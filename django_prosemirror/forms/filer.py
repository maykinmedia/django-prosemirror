import os
from pathlib import Path

from django import forms
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.template.defaultfilters import filesizeformat

from filer.validation import validate_upload

from django_prosemirror.config import get_setting
from django_prosemirror.constants import ALLOWED_IMAGE_FORMATS
from django_prosemirror.filer_models import get_image_model

# MIME type per allowed format, passed to filer's upload validators.
IMAGE_MIME_TYPES = {
    "JPEG": "image/jpeg",
    "MPO": "image/jpeg",
    "PNG": "image/png",
    "GIF": "image/gif",
    "WEBP": "image/webp",
}


class WebImageField(forms.ImageField):
    # Replaces ImageField's default validator, which allows every extension
    # Pillow knows about.
    default_validators = [
        FileExtensionValidator(allowed_extensions=list(ALLOWED_IMAGE_FORMATS))
    ]

    def to_python(self, data):
        # Check the size before ImageField parses the file.
        max_size = get_setting("max_image_upload_size")
        if data and max_size is not None and data.size > max_size:
            raise ValidationError(
                "The file is too large. The maximum size is %(max_size)s.",
                code="file_too_large",
                params={"max_size": filesizeformat(max_size)},
            )
        return super().to_python(data)


class FileUploadForm(forms.Form):
    # ImageField parses the upload with Pillow, which also rules out SVG.
    upload_file = WebImageField(required=True)

    def __init__(self, *args, owner=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.owner = owner

    def clean_upload_file(self):
        upload_file = self.cleaned_data["upload_file"]
        extension = Path(upload_file.name).suffix.lower().removeprefix(".")
        image_format = upload_file.image.format
        if image_format not in ALLOWED_IMAGE_FORMATS[extension]:
            raise ValidationError(
                "The file content does not match its extension.",
                code="format_mismatch",
            )

        # Apply the site's filer upload policy (FILER_MIME_TYPE_WHITELIST and
        # file validators), as filer's own upload views do. Validators may
        # rewrite the file, so we check and save the file size after validation
        validate_upload(
            upload_file.name, upload_file, self.owner, IMAGE_MIME_TYPES[image_format]
        )
        upload_file.seek(0, os.SEEK_END)
        upload_file.size = upload_file.tell()
        upload_file.seek(0, os.SEEK_SET)
        return upload_file


class ImageEditForm(forms.ModelForm):
    class Meta:
        model = get_image_model()
        fields = ["name", "description", "default_caption"]
