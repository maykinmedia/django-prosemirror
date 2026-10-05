"""Report on all filer images, flagging files that look suspicious.

Only relevant if a version of django-prosemirror before 0.11.0 was installed
together with django-filer: the editor's image upload endpoint of those versions
accepted any file, so unsafe files (e.g. SVGs with scripts, or HTML with an image
extension) may have been stored. Uploads are validated since 0.11.0; if you never
ran an earlier version with filer, there is nothing for this command to find.

See :mod:`django_prosemirror.management.utils.check_filer_images` for what is
checked.
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils.module_loading import import_string

from django_prosemirror.management.utils.check_filer_images import (
    FilerImageCheck,
    UnresolvableURLError,
    Verdict,
    check_filer_images,
    resolve_base_url,
)

# Exit statuses for the findings. They come after 1, which errors and uncaught
# exceptions exit with, and 2, which invalid arguments exit with (argparse), so
# scripts can tell findings from failures.
EXIT_SUSPICIOUS = 3
EXIT_UNCHECKED = 4


class Command(BaseCommand):
    help = (
        "Check all filer images. Each gets a verdict: SUSPICIOUS (review it, "
        "e.g. a file that isn't an image or an SVG with scripts), UNCHECKED (the "
        "file couldn't be read), NOTE (wouldn't be accepted as an upload today, "
        "but can't run code, or uploaded by someone who isn't a current staff "
        "member) or OK. The summary is written to stderr. Exits with "
        "status 3 if any image is suspicious, else with status 4 if any image "
        "is unchecked. Status 1 means the command failed and 2 that its "
        "arguments are invalid."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--base-url",
            default="",
            help=(
                "Base URL to make relative admin and file URLs absolute, e.g. "
                "https://example.com. Defaults to the current site's domain if "
                "django.contrib.sites is installed."
            ),
        )
        parser.add_argument(
            "--format",
            choices=["table", "csv"],
            default="table",
            help=(
                "table (default): one line per image, worst first. csv: one row "
                "per image with all details, for spreadsheets and other tools."
            ),
        )
        parser.add_argument(
            "--hide-ok",
            action="store_true",
            help="Leave out the images that are OK: list only those that need "
            "attention.",
        )
        parser.add_argument(
            "--validator",
            action="append",
            default=[],
            dest="validators",
            metavar="DOTTED_PATH",
            help=(
                "Dotted path to an additional check, a function taking the filer "
                "Image and its file content (bytes) that raises ValidationError if "
                "the image fails, which makes it suspicious. Can be given more "
                "than once."
            ),
        )
        parser.add_argument(
            "--output",
            help="Write the report to this file instead of stdout.",
        )

    def handle(self, *args, **options):
        try:
            import filer  # noqa: F401
        except ImportError:
            # Not an error: without filer, there are no filer images to check.
            self.stderr.write(
                "django-filer is not installed; there are no filer images to check."
            )
            return

        validators = {}
        for path in options["validators"]:
            try:
                validators[path] = import_string(path)
            except ImportError as exc:
                raise CommandError(f"Can't import validator {path!r}: {exc}") from exc
            if not callable(validators[path]):
                raise CommandError(f"Validator {path!r} is not callable.")

        base_url = resolve_base_url(options["base_url"])
        try:
            checks = list(check_filer_images(base_url=base_url, validators=validators))
        except UnresolvableURLError as exc:
            raise CommandError(f"{exc} Pass --base-url.") from exc

        if options["format"] == "csv":
            report = FilerImageCheck.render_csv(
                checks, include_ok=not options["hide_ok"]
            )
        else:
            report = FilerImageCheck.render_table(
                checks,
                include_ok=not options["hide_ok"],
                # self.style colors based on stdout, so don't color a file.
                styles=None
                if options["output"]
                else {
                    Verdict.SUSPICIOUS: self.style.ERROR,
                    # Cyan; Django has no style named for this.
                    Verdict.UNCHECKED: self.style.MIGRATE_HEADING,
                    Verdict.NOTE: self.style.WARNING,
                },
            )

        if options["output"]:
            with open(options["output"], "w", encoding="utf-8", newline="") as file:
                file.write(report)
        else:
            self.stdout.write(report, ending="")

        summary = FilerImageCheck.render_summary(checks)
        verdicts = {check.verdict for check in checks}
        if Verdict.SUSPICIOUS in verdicts:
            raise CommandError(summary, returncode=EXIT_SUSPICIOUS)
        if Verdict.UNCHECKED in verdicts:
            raise CommandError(summary, returncode=EXIT_UNCHECKED)
        self.stderr.write(self.style.SUCCESS(summary))
