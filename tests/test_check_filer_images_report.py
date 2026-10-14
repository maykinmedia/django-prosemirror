"""check_filer_images results and their rendering; needs neither filer nor a
database."""

import csv
from datetime import UTC, datetime
from io import StringIO
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured, ValidationError

import pytest

from django_prosemirror.management.utils.check_filer_images import (
    FilerImageCheck,
    Finding,
    UnresolvableURLError,
    Verdict,
    _is_current_staff_member,
    _svg_triggers,
    _uploader,
    absolute_url,
    resolve_base_url,
    run_validators,
)

UPLOADED_AT = datetime(2026, 3, 2, 9, 30, tzinfo=UTC)


def make_check(*findings: Finding, **kwargs) -> FilerImageCheck:
    return FilerImageCheck(
        **{
            "pk": 1,
            "filename": "photo.png",
            "uploaded_at": UPLOADED_AT,
            "uploaded_by": "editor@example.com",
            "uploader_is_current_staff_member": True,
            "admin_url": "https://example.com/admin/filer/image/1/change/",
            "url": "https://example.com/media/photo.png",
            "findings": findings or (OK,),
            **kwargs,
        }
    )


OK = Finding(Verdict.OK, "PNG image")
NOTE = Finding(Verdict.NOTE, "SVG without scripts")
SUSPICIOUS = Finding(Verdict.SUSPICIOUS, "Not an image, served as text/html")
UNCHECKED = Finding(Verdict.UNCHECKED, "Could not read the file: Denied")


def csv_row(check):
    return next(csv.DictReader(StringIO(FilerImageCheck.render_csv([check]))))


def test_csv_row(settings):
    settings.TIME_ZONE = "Europe/Amsterdam"

    assert csv_row(make_check()) == {
        "Verdict": "OK",
        "ID": "1",
        "Filename": "photo.png",
        "Uploaded at": "2026-03-02T10:30:00+01:00",
        "Uploaded by": "editor@example.com",
        "Uploader is current staff member": "yes",
        "Reason": "PNG image",
        "Admin page (don't open SUSPICIOUS or UNCHECKED files in the browser)": (
            "https://example.com/admin/filer/image/1/change/"
        ),
        "File URL (don't open SUSPICIOUS or UNCHECKED files in the browser)": (
            "https://example.com/media/photo.png"
        ),
    }


def test_csv_uploader_is_not_current_staff_member():
    check = make_check(uploader_is_current_staff_member=False)

    assert csv_row(check)["Uploader is current staff member"] == "no"


@pytest.mark.parametrize(
    "value",
    [
        '=HYPERLINK("https://evil.example/","photo.png")',
        "+1+1",
        "-1+1",
        "@SUM(1+1)",
        "\t=1+1",
        "\r=1+1",
    ],
)
def test_csv_doesnt_start_values_with_formulas(value):
    row = csv_row(make_check(filename=value, uploaded_by=value))

    assert row["Filename"] == f"'{value}"
    assert row["Uploaded by"] == f"'{value}"


def test_csv_leaves_formula_characters_after_the_start():
    row = csv_row(make_check(filename="photo=1.png", uploaded_by="a-b@example.com"))

    assert row["Filename"] == "photo=1.png"
    assert row["Uploaded by"] == "a-b@example.com"


def test_table_shows_values_as_they_are():
    check = make_check(SUSPICIOUS, filename="=1+1")

    assert "  =1+1  " in FilerImageCheck.render_table([check])


def test_csv_lists_all_images_in_the_given_order():
    checks = [make_check(OK, pk=1), make_check(SUSPICIOUS, pk=2), make_check(pk=3)]

    rows = csv.DictReader(StringIO(FilerImageCheck.render_csv(checks)))

    assert [row["ID"] for row in rows] == ["1", "2", "3"]


def test_csv_can_leave_out_ok_images():
    checks = [make_check(OK, pk=1), make_check(SUSPICIOUS, pk=2), make_check(pk=3)]

    csv_text = FilerImageCheck.render_csv(checks, include_ok=False)

    assert [row["ID"] for row in csv.DictReader(StringIO(csv_text))] == ["2"]


@pytest.mark.parametrize(
    "findings, verdict, reason",
    [
        pytest.param((OK,), Verdict.OK, "PNG image", id="ok"),
        pytest.param((NOTE,), Verdict.NOTE, "SVG without scripts", id="note"),
        pytest.param(
            (NOTE, Finding(Verdict.SUSPICIOUS, "check: Too big.")),
            Verdict.SUSPICIOUS,
            "check: Too big. | SVG without scripts",
            id="worst-first",
        ),
        pytest.param(
            (OK, Finding(Verdict.SUSPICIOUS, "check: Too big.")),
            Verdict.SUSPICIOUS,
            "check: Too big.",
            id="ok-reason-hidden-when-not-ok",
        ),
    ],
)
def test_verdict_and_reason(findings, verdict, reason):
    check = make_check(*findings)

    assert check.verdict == verdict
    assert check.reason == reason


def test_run_validators():
    def passes(image, data):
        pass

    def fails(image, data):
        raise ValidationError(["Too big.", "Too old."])

    results = run_validators(object(), b"data", {"passes": passes, "fails": fails})

    assert results == {"passes": None, "fails": "Too big. Too old."}


def test_run_validators_passes_image_and_data():
    calls = []
    image = object()

    run_validators(image, b"data", {"record": lambda *args: calls.append(args)})

    assert calls == [(image, b"data")]


def test_run_validators_does_not_catch_other_exceptions():
    def broken(image, data):
        raise KeyError("bug")

    with pytest.raises(KeyError):
        run_validators(object(), b"data", {"broken": broken})


def test_table_lists_images_that_need_attention_worst_first():
    checks = [
        make_check(NOTE, pk=1),
        make_check(OK, pk=2),
        make_check(SUSPICIOUS, pk=3),
        make_check(NOTE, pk=4),
        make_check(UNCHECKED, pk=5),
    ]

    lines = FilerImageCheck.render_table(checks, include_ok=False).splitlines()

    assert lines[0].split()[:4] == ["Verdict", "ID", "Uploaded", "Uploaded"]
    assert [line.split()[:2] for line in lines[2:]] == [
        ["SUSPICIOUS", "3"],
        ["UNCHECKED", "5"],
        ["NOTE", "1"],
        ["NOTE", "4"],
    ]


def test_table_includes_ok_images_by_default():
    checks = [make_check(OK, pk=1), make_check(NOTE, pk=2)]

    lines = FilerImageCheck.render_table(checks).splitlines()

    assert [line.split()[:2] for line in lines[2:]] == [["NOTE", "2"], ["OK", "1"]]


def test_table_is_empty_without_images_that_need_attention():
    assert FilerImageCheck.render_table([make_check(OK)], include_ok=False) == ""


def test_table_shows_the_upload_date(settings):
    settings.TIME_ZONE = "America/New_York"
    check = make_check(NOTE, uploaded_at=datetime(2026, 3, 2, 2, 0, tzinfo=UTC))

    line = FilerImageCheck.render_table([check]).splitlines()[2]

    # In the local time zone.
    assert " 2026-03-01 " in line


def test_table_styles_lines_per_verdict():
    checks = [make_check(SUSPICIOUS, pk=1), make_check(NOTE, pk=2), make_check(pk=3)]

    table = FilerImageCheck.render_table(
        checks,
        styles={
            Verdict.SUSPICIOUS: lambda line: f"!{line}!",
            Verdict.NOTE: lambda line: f"?{line}?",
        },
    )

    lines = table.splitlines()
    assert lines[2].startswith("!SUSPICIOUS ") and lines[2].endswith("!")
    assert lines[3].startswith("?NOTE ") and lines[3].endswith("?")
    assert lines[4].startswith("OK ")


def test_table_shows_values_in_full_but_not_the_file_url():
    uploaded_by = f"{'a' * 100}@example.com"
    filename = f"{'f' * 100}.png"
    reason = "A long reason. " * 10
    admin_url = f"https://example.com/admin/filer/image/{'1' * 50}/change/"
    check = make_check(
        Finding(Verdict.NOTE, reason.strip()),
        uploaded_by=uploaded_by,
        filename=filename,
        admin_url=admin_url,
    )

    line = FilerImageCheck.render_table([check]).splitlines()[2]

    for value in [uploaded_by, filename, reason.strip()]:
        assert value in line
    assert line.endswith(admin_url)
    assert check.url not in line
    assert "…" not in line


def test_table_columns_fit_the_longest_value():
    checks = [
        make_check(NOTE, pk=1, filename="a.png"),
        make_check(NOTE, pk=2, filename="b" * 50),
    ]

    lines = FilerImageCheck.render_table(checks).splitlines()

    # The column after the filename starts at the same position on every line.
    reason_starts = {line.index(NOTE.reason) for line in lines[2:]}
    assert len(reason_starts) == 1
    assert lines[0].index("Reason") == reason_starts.pop()


@pytest.mark.parametrize(
    "checks, expected",
    [
        pytest.param(
            [
                make_check(SUSPICIOUS),
                make_check(UNCHECKED),
                make_check(NOTE),
                make_check(NOTE),
                make_check(),
            ],
            "Checked 5 images: 1 suspicious, 1 unchecked, 2 notes, 1 OK.",
            id="suspicious",
        ),
        pytest.param(
            [make_check(UNCHECKED), make_check(UNCHECKED), make_check()],
            "Checked 3 images: 0 suspicious, 2 unchecked, 0 notes, 1 OK. "
            "Nothing suspicious found, but 2 images could not be checked; run "
            "again once the reasons are resolved.",
            id="unchecked",
        ),
        pytest.param(
            [make_check(NOTE), make_check()],
            "Checked 2 images: 0 suspicious, 0 unchecked, 1 note, 1 OK. "
            "Nothing suspicious found.",
            id="nothing-suspicious",
        ),
        pytest.param(
            [],
            "Checked 0 images: 0 suspicious, 0 unchecked, 0 notes, 0 OK. "
            "Nothing suspicious found.",
            id="no-images",
        ),
    ],
)
def test_summary(checks, expected):
    assert FilerImageCheck.render_summary(checks) == expected


@pytest.mark.parametrize(
    "url, base, expected",
    [
        (
            "/media/photo.png",
            "https://example.com",
            "https://example.com/media/photo.png",
        ),
        (
            "/media/photo.png",
            "https://example.com/",
            "https://example.com/media/photo.png",
        ),
        (
            "https://cdn.example/photo.png",
            "https://example.com",
            "https://cdn.example/photo.png",
        ),
        ("https://cdn.example/photo.png", "", "https://cdn.example/photo.png"),
        ("", "https://example.com", ""),
    ],
)
def test_absolute_url(url, base, expected):
    assert absolute_url(url, base) == expected


@pytest.mark.parametrize("base", ["", "example.com", "/prefix/"])
def test_absolute_url_fails_without_usable_base(base):
    with pytest.raises(UnresolvableURLError):
        absolute_url("/media/photo.png", base)


def test_resolve_base_url_prefers_the_given_one():
    assert resolve_base_url("https://example.com") == "https://example.com"


def test_resolve_base_url_falls_back_to_the_current_site(settings):
    settings.INSTALLED_APPS = [*settings.INSTALLED_APPS, "django.contrib.sites"]
    from django.contrib.sites.models import Site

    with patch.object(Site.objects, "get_current") as get_current:
        get_current.return_value.domain = "site.example"

        assert resolve_base_url() == "https://site.example/"


def test_resolve_base_url_without_current_site(settings):
    settings.INSTALLED_APPS = [*settings.INSTALLED_APPS, "django.contrib.sites"]
    from django.contrib.sites.models import Site

    # No SITE_ID, or no Site record for it.
    for error in [ImproperlyConfigured, Site.DoesNotExist]:
        with patch.object(Site.objects, "get_current", side_effect=error):
            assert resolve_base_url() == ""


class UserWithoutEmail:
    """A custom user model without an email field."""

    def get_username(self):
        return "jdoe"


def test_uploader_without_email_field():
    assert _uploader(UserWithoutEmail()) == "jdoe"


class StaffUserWithoutIsActive:
    """A custom user model without an is_active field."""

    is_staff = True


@pytest.mark.parametrize(
    "owner, expected",
    [
        pytest.param(None, False, id="no-owner"),
        pytest.param(UserWithoutEmail(), False, id="no-is-staff-field"),
        pytest.param(StaffUserWithoutIsActive(), True, id="no-is-active-field"),
    ],
)
def test_is_current_staff_member_with_custom_user_models(owner, expected):
    assert _is_current_staff_member(owner) is expected


def test_resolve_base_url_without_sites_framework():
    # The test app doesn't install django.contrib.sites.
    assert resolve_base_url() == ""


@pytest.mark.parametrize(
    "triggers",
    [("onload=", "<script"), (b"onload=", b"<script")],
    ids=["str", "bytes"],
)
def test_svg_triggers_with_str_or_bytes_triggers(triggers):
    # Older filer versions define TRIGGER_XSS_THREAD as bytes.
    pytest.importorskip("filer")
    with patch("filer.validation.TRIGGER_XSS_THREAD", triggers):
        assert _svg_triggers(b'<svg onload="x"><SCRIPT></SCRIPT></svg>') == [
            "onload=",
            "<script",
        ]
