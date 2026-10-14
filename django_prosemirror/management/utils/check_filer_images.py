"""Check stored filer images for files that are unsafe or look out of place.

Before the upload endpoint validated file types, any file could be uploaded
through it and was stored as a filer ``Image``: SVGs with scripts, or HTML with
an image extension. Those uploads also bypassed filer's own upload validators,
so SVGs were never sanitized.

Each image gets a :class:`Verdict` with the reasons for it:

* ``SUSPICIOUS``: needs a look. The file isn't an image (e.g. HTML), an SVG
  contains scripts, event handlers or embedded data, the file would be served
  with a non-image content type, it is rejected by the upload validation for
  another reason, or it fails a project's own check (a :data:`Validator`).
* ``UNCHECKED``: the file exists but couldn't be read (e.g. a storage error), so
  nothing is known about it. Worth checking again later.
* ``NOTE``: wouldn't be accepted as an upload today, but can't run code: SVGs
  without scripts, images in an unsupported format or with the wrong
  extension, damaged images, records without a file, files missing from the
  storage. Also images that are otherwise OK, but whose uploader isn't a
  current staff member: only staff can upload today.
* ``OK``: passes the upload validation and was uploaded by a current staff
  member.

The results are :class:`FilerImageCheck` objects, which also render the report.

filer is imported lazily, so this module can be imported without it.
"""

import csv
import dataclasses
import enum
import mimetypes
import warnings
from collections import Counter
from collections.abc import Callable, Iterable, Iterator, Mapping
from datetime import datetime
from html import unescape
from io import BytesIO, StringIO
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from django.apps import apps
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import NoReverseMatch, reverse
from django.utils import timezone
from django.utils.text import capfirst

from django_prosemirror.constants import ALLOWED_IMAGE_FORMATS

# CSV columns, in order, with their headers. Opening a suspicious file directly
# in a browser may run its scripts, and nothing is known about unchecked files.
CSV_COLUMNS = {
    "verdict": "Verdict",
    "id": "ID",
    "filename": "Filename",
    "uploaded_at": "Uploaded at",
    "uploaded_by": "Uploaded by",
    "uploader_is_current_staff_member": "Uploader is current staff member",
    "reason": "Reason",
    "admin_url": "Admin page (don't open SUSPICIOUS or UNCHECKED files in the browser)",
    "url": "File URL (don't open SUSPICIOUS or UNCHECKED files in the browser)",
}

# Table columns, in order, with their headers. The admin page comes last, so
# long URLs don't push the other columns apart.
TABLE_COLUMNS = {
    "verdict": "Verdict",
    "id": "ID",
    "uploaded_on": "Uploaded",
    "uploaded_by": "Uploaded by",
    "uploader_is_current_staff_member": "Staff",
    "filename": "File",
    "reason": "Reason",
    "admin_url": "Admin page",
}

# A project's own check of a filer image: called with the filer ``Image`` and its
# file content, raises ValidationError if the image fails. Other exceptions are
# not caught; they stop the check. Only run on files that could be read. Failing
# makes the image suspicious.
type Validator = Callable[[object, bytes], None]


class Verdict(enum.IntEnum):
    """How much attention an image needs; higher is worse."""

    OK = 0
    NOTE = 1
    UNCHECKED = 2
    SUSPICIOUS = 3


@dataclasses.dataclass(frozen=True)
class Finding:
    verdict: Verdict
    reason: str


# Spreadsheets read a cell that starts with one of these as a formula. Filenames
# and usernames come from uploaders, so an attacker could otherwise put a
# formula in the CSV report (CSV injection).
CSV_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _csv_cell(value: str) -> str:
    """Make the value safe to open in a spreadsheet: prefix a ``'`` to values
    that would be read as a formula, so they show as text."""
    return f"'{value}" if value.startswith(CSV_FORMULA_PREFIXES) else value


def _plural(count: int, word: str) -> str:
    return f"{count} {word}{'' if count == 1 else 's'}"


@dataclasses.dataclass(frozen=True)
class FilerImageCheck:
    """The result of checking one filer image."""

    pk: int
    filename: str
    uploaded_at: datetime | None
    # The email address of the image's owner, else their username; empty if the
    # image has no owner.
    uploaded_by: str
    # Whether the image's owner is an active staff member now; False if the
    # image has no owner.
    uploader_is_current_staff_member: bool
    # The image's change page in the admin, fully qualified; empty if the admin
    # isn't available.
    admin_url: str
    # The file's URL, fully qualified; empty if the image has no file.
    url: str
    findings: tuple[Finding, ...]

    @property
    def verdict(self) -> Verdict:
        return max((finding.verdict for finding in self.findings), default=Verdict.OK)

    @property
    def reason(self) -> str:
        """Why the image got its verdict: for OK images what the file is,
        otherwise everything that isn't OK, worst first."""
        verdict = self.verdict
        findings = [
            finding
            for finding in sorted(
                self.findings, key=lambda finding: finding.verdict, reverse=True
            )
            if (finding.verdict == Verdict.OK) == (verdict == Verdict.OK)
        ]
        return " | ".join(finding.reason for finding in findings)

    def as_row(self) -> dict[str, str]:
        """The values of all report columns, in full."""
        uploaded_at = self.uploaded_at
        if uploaded_at is not None and timezone.is_aware(uploaded_at):
            uploaded_at = timezone.localtime(uploaded_at)
        return {
            "verdict": self.verdict.name,
            "id": str(self.pk),
            "filename": self.filename,
            "uploaded_at": (
                uploaded_at.isoformat(timespec="seconds") if uploaded_at else ""
            ),
            "uploaded_on": uploaded_at.date().isoformat() if uploaded_at else "",
            "uploaded_by": self.uploaded_by,
            "uploader_is_current_staff_member": (
                "yes" if self.uploader_is_current_staff_member else "no"
            ),
            "reason": self.reason,
            "admin_url": self.admin_url,
            "url": self.url,
        }

    @classmethod
    def render_csv(
        cls, checks: Iterable["FilerImageCheck"], include_ok: bool = True
    ) -> str:
        """Render the checks as CSV, in the given order, with all details.

        Values that a spreadsheet would read as a formula are prefixed with
        ``'``, see :func:`_csv_cell`.

        Args:
            checks: The checks to render.
            include_ok: Whether to include the images that are OK.
        """
        output = StringIO()
        writer = csv.writer(output, lineterminator="\n")
        writer.writerow(CSV_COLUMNS.values())
        for check in checks:
            if not include_ok and check.verdict == Verdict.OK:
                continue
            row = check.as_row()
            writer.writerow(_csv_cell(row[key]) for key in CSV_COLUMNS)
        return output.getvalue()

    @classmethod
    def render_table(
        cls,
        checks: Iterable["FilerImageCheck"],
        include_ok: bool = True,
        styles: Mapping[Verdict, Callable[[str], str]] | None = None,
    ) -> str:
        """Render the checks as a table, one line per image, worst first.

        Args:
            checks: The checks to render.
            include_ok: Whether to include the images that are OK.
            styles: Applied to the line of each image with the given verdict,
                e.g. to color it.

        Returns:
            The table, or an empty string if there are no images to show.
        """
        styles = styles or {}
        checks = sorted(
            (check for check in checks if include_ok or check.verdict != Verdict.OK),
            key=lambda check: (-check.verdict, check.pk),
        )
        if not checks:
            return ""

        headers = list(TABLE_COLUMNS.values())
        cells = []
        for check in checks:
            row = check.as_row()
            cells.append([row[key] for key in TABLE_COLUMNS])
        widths = [
            max(len(value) for value in column)
            for column in zip(headers, *cells, strict=True)
        ]

        def line(values: list[str]) -> str:
            return "  ".join(
                v.ljust(w) for v, w in zip(values, widths, strict=True)
            ).rstrip()

        lines = [line(headers), line(["-" * w for w in widths])]
        for check, row_cells in zip(checks, cells, strict=True):
            style = styles.get(check.verdict, str)
            lines.append(style(line(row_cells)))
        return "\n".join(lines) + "\n"

    @classmethod
    def render_summary(cls, checks: Iterable["FilerImageCheck"]) -> str:
        """One line with the number of images checked, per verdict."""
        checks = list(checks)
        counts = Counter(check.verdict for check in checks)
        summary = (
            f"Checked {_plural(len(checks), 'image')}: "
            f"{counts[Verdict.SUSPICIOUS]} suspicious, "
            f"{counts[Verdict.UNCHECKED]} unchecked, "
            f"{_plural(counts[Verdict.NOTE], 'note')}, {counts[Verdict.OK]} OK."
        )
        if counts[Verdict.SUSPICIOUS]:
            return summary
        if unchecked := counts[Verdict.UNCHECKED]:
            return (
                f"{summary} Nothing suspicious found, but "
                f"{_plural(unchecked, 'image')} could not be checked; run again "
                "once the files can be read."
            )
        return f"{summary} Nothing suspicious found."


class UnresolvableURLError(Exception):
    """A URL is relative and there is no base URL to resolve it with."""


def resolve_base_url(base_url: str = "") -> str:
    """Return the base URL to make relative URLs absolute with.

    That's the given base URL if any, else the current site's domain (over
    HTTPS) if the sites framework is installed and there is a current site,
    else an empty string.
    """
    if base_url:
        return base_url
    if apps.is_installed("django.contrib.sites"):
        from django.contrib.sites.models import Site

        try:
            site = Site.objects.get_current()
        # Without SITE_ID, there is no current site outside of a request.
        except (ImproperlyConfigured, Site.DoesNotExist):
            return ""
        return f"https://{site.domain}/"
    return ""


def absolute_url(url: str, base_url: str) -> str:
    if not url:
        return ""
    absolute = urljoin(base_url, url)
    parts = urlsplit(absolute)
    if not (parts.scheme and parts.netloc):
        raise UnresolvableURLError(f"Can't make the URL {url!r} absolute.")
    return absolute


def check_image_file(name: str, data: bytes) -> list[str]:
    """Return the reasons the file fails the upload validation, or an empty list.

    The upload size limit isn't applied: a large image isn't unsafe, and it
    would stop the content from being checked.
    """
    from django_prosemirror.forms.filer import FileUploadForm

    form = FileUploadForm(
        files={"upload_file": SimpleUploadedFile(name, data)}, check_size=False
    )
    if form.is_valid():
        return []
    return [str(error) for error in form.errors["upload_file"]]


def _version_tuple(version: str) -> tuple[int, ...]:
    """The leading numeric parts of a version, e.g. (3, 5) for "3.5.0rc1"."""
    parts = []
    for part in version.split("."):
        if not part.isdigit():
            break
        parts.append(int(part))
    return tuple(parts)


def check_svg_file(name: str, data: bytes, owner) -> dict[str, str | None]:
    """Run filer's SVG validators on a copy of the file.

    Returns the error per validator, or None if it passes. Note that
    ``sanitize_svg`` only fails on SVGs it can't parse: it strips scripts rather
    than rejecting them, which ``validate_svg`` does. Before filer 3.5,
    ``sanitize_svg`` redraws the SVG with svglib instead, which fails for other
    reasons than damage (e.g. on embedded images), so its result is left out.
    """
    import filer
    from filer import validation

    validators = [validation.validate_svg]
    if _version_tuple(filer.__version__) >= (3, 5):
        validators.append(validation.sanitize_svg)

    results: dict[str, str | None] = {}
    for validator in validators:
        try:
            with warnings.catch_warnings():
                # validate_svg warns that it is deprecated whenever it rejects.
                warnings.simplefilter("ignore", DeprecationWarning)
                # sanitize_svg rewrites the file it is given: only pass a copy.
                validator(name, BytesIO(data), owner, "image/svg+xml")
        except ValidationError as exc:
            results[validator.__name__] = " ".join(exc.messages)
        except UnicodeDecodeError:
            results[validator.__name__] = "Not valid UTF-8."
        else:
            results[validator.__name__] = None
    return results


def _svg_triggers(data: bytes) -> list[str]:
    """What makes filer's validate_svg reject the SVG, as it checks it."""
    from filer.validation import TRIGGER_XSS_THREAD

    # Older filer versions define the triggers as bytes and match them against
    # the raw file rather than its unescaped content: check both.
    raw = data.decode("utf-8", errors="replace").lower()
    contents = (raw, unescape(raw))
    triggers = (t.decode() if isinstance(t, bytes) else t for t in TRIGGER_XSS_THREAD)
    return list(dict.fromkeys(t for t in triggers if any(t in c for c in contents)))


def _svg_findings(name: str, data: bytes, owner) -> list[Finding]:
    # Checked here, as older filer versions match their triggers against the
    # raw bytes, which misses scripts in e.g. UTF-16.
    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        return [Finding(Verdict.SUSPICIOUS, "SVG that can't be checked: not UTF-8")]
    results = check_svg_file(name, data, owner)
    if results["validate_svg"]:
        triggers = ", ".join(_svg_triggers(data))
        return [Finding(Verdict.SUSPICIOUS, f"SVG with possible scripts: {triggers}")]
    if results.get("sanitize_svg"):
        return [Finding(Verdict.NOTE, "Damaged SVG, without scripts")]
    return [Finding(Verdict.NOTE, "SVG without scripts")]


def _identify_image(data: bytes) -> tuple[str | None, bool]:
    """Identify the data as an image like the upload form does (with Pillow's
    ``verify``).

    Returns:
        The image format (None if unknown), and whether the image is damaged.
        Data that isn't an image at all gives ``(None, False)``.
    """
    from PIL import Image as PILImage, UnidentifiedImageError

    try:
        with PILImage.open(BytesIO(data)) as image:
            image_format = image.format
            try:
                image.verify()
            except Exception:
                return image_format, True
            return image_format, False
    except UnidentifiedImageError:
        return None, False
    except Exception:  # recognised as an image, but broken
        return None, True


def _image_findings(name: str, data: bytes) -> list[Finding]:
    """Check a file that isn't an SVG."""
    if not data:
        return [Finding(Verdict.NOTE, "Empty file")]

    extension = Path(name).suffix.lower()
    # Storages serve files with the content type of their extension.
    content_type, _ = mimetypes.guess_type(f"file{extension}")

    image_format, damaged = _identify_image(data)
    if image_format is None and not damaged:
        # What the content looks like is easy to disguise, and what a browser
        # does with it depends on the content type it's served with.
        if content_type:
            served = f"served as {content_type}"
        elif extension:
            served = f"saved as {extension} (unknown content type)"
        else:
            served = "saved as a file without extension"
        return [Finding(Verdict.SUSPICIOUS, f"Not an image, {served}")]

    description = f"{image_format} image" if image_format else "image"
    if damaged:
        description = f"damaged {description}"
    if content_type and not content_type.startswith("image/"):
        return [
            Finding(
                Verdict.SUSPICIOUS,
                f"{capfirst(description)} saved as {extension}, "
                f"served as {content_type}",
            )
        ]
    if damaged:
        return [Finding(Verdict.NOTE, capfirst(description))]
    if image_format not in {f for fs in ALLOWED_IMAGE_FORMATS.values() for f in fs}:
        return [Finding(Verdict.NOTE, f"Unsupported format: {image_format}")]
    if image_format not in ALLOWED_IMAGE_FORMATS.get(extension.removeprefix("."), ()):
        return [
            Finding(
                Verdict.NOTE,
                f"{capfirst(description)} saved as "
                f"{extension or 'a file without extension'}",
            )
        ]

    # Looks like a valid image: anything the upload validation still rejects
    # (such as the site's filer upload policy) is unexpected.
    if problems := check_image_file(name, data):
        return [
            Finding(
                Verdict.SUSPICIOUS,
                f"Rejected by the upload validation: {' '.join(problems)}",
            )
        ]
    return [Finding(Verdict.OK, capfirst(description))]


def _uploader(owner) -> str:
    """Identify the image's owner: by email address, else by username.

    Custom user models need not have an email field.
    """
    if owner is None:
        return ""
    return getattr(owner, "email", "") or owner.get_username()


def _is_current_staff_member(owner) -> bool:
    """Whether the owner is an active staff member now.

    Custom user models need not have ``is_staff`` or ``is_active``.
    """
    return (
        owner is not None
        and getattr(owner, "is_staff", False)
        and getattr(owner, "is_active", True)
    )


def _admin_url(image) -> str:
    opts = image._meta
    try:
        return reverse(
            f"admin:{opts.app_label}_{opts.model_name}_change", args=[image.pk]
        )
    except NoReverseMatch:
        return ""


def _read(image) -> tuple[bytes | None, Finding | None]:
    """Return the image's file content, or None and why it can't be read.

    A file missing from the storage can't be served, so it is only a note. A
    file that exists but can't be read is unchecked.
    """
    if not image.file:
        return None, Finding(Verdict.NOTE, "No file")
    try:
        with image.file.open("rb") as file:
            return file.read(), None
    except Exception as exc:  # storage backends raise all sorts of errors
        read_error = exc
    # Storage backends differ in what they raise for a missing file, so ask.
    try:
        missing = not image.file.storage.exists(image.file.name)
    except Exception:
        missing = False
    if missing:
        return None, Finding(Verdict.NOTE, "File missing from storage")
    return None, Finding(Verdict.UNCHECKED, f"Could not read the file: {read_error}")


def run_validators(
    image, data: bytes, validators: Mapping[str, Validator]
) -> dict[str, str | None]:
    """Run the validators on the image; return the error per validator name."""
    results: dict[str, str | None] = {}
    for name, validator in validators.items():
        try:
            validator(image, data)
        except ValidationError as exc:
            results[name] = " ".join(exc.messages)
        else:
            results[name] = None
    return results


def check_filer_image(
    image, base_url: str = "", validators: Mapping[str, Validator] | None = None
) -> FilerImageCheck:
    """Check one filer ``Image``.

    Args:
        image: The filer image.
        base_url: Base URL to make relative URLs absolute.
        validators: Additional checks to run, by name.

    Raises:
        UnresolvableURLError: If a URL is relative and there is no base URL.
    """
    stored_name = Path(image.file.name).name if image.file else ""
    data, read_problem = _read(image)

    findings = []
    if data is None:
        findings.append(read_problem)
    elif image.mime_type == "image/svg+xml" or stored_name.lower().endswith(".svg"):
        findings += _svg_findings(stored_name, data, image.owner)
    else:
        findings += _image_findings(stored_name, data)

    if validators and data is not None:
        findings += [
            Finding(Verdict.SUSPICIOUS, f"{name}: {error}")
            for name, error in run_validators(image, data, validators).items()
            if error
        ]

    # Only staff can upload today, so an image that is otherwise fine but was
    # uploaded by someone else (or by staff who have since left) is worth a look.
    is_current_staff_member = _is_current_staff_member(image.owner)
    if not is_current_staff_member and all(
        finding.verdict == Verdict.OK for finding in findings
    ):
        findings.append(
            Finding(Verdict.NOTE, "Uploaded by member who's not currently staff")
        )

    return FilerImageCheck(
        pk=image.pk,
        filename=image.original_filename or stored_name,
        uploaded_at=image.uploaded_at,
        uploaded_by=_uploader(image.owner),
        uploader_is_current_staff_member=is_current_staff_member,
        admin_url=absolute_url(_admin_url(image), base_url),
        url=absolute_url(image.url or "", base_url),
        findings=tuple(findings),
    )


def check_filer_images(
    images: Iterable | None = None,
    base_url: str = "",
    validators: Mapping[str, Validator] | None = None,
) -> Iterator[FilerImageCheck]:
    """Check the given filer images, by default all images of the image model
    configured with ``FILER_IMAGE_MODEL``.

    See :func:`check_filer_image`.
    """
    if images is None:
        from django_prosemirror.filer_models import get_image_model

        images = (
            get_image_model().objects.select_related("owner").order_by("pk").iterator()
        )
    for image in images:
        yield check_filer_image(image, base_url, validators)
