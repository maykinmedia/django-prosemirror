import dataclasses
from http import HTTPStatus
from typing import assert_never

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.uploadedfile import UploadedFile
from django.http import JsonResponse, QueryDict
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from filer import settings as filer_settings
from filer.models import Image

from django_prosemirror.forms.filer import FileUploadForm, ImageEditForm


@dataclasses.dataclass
class ImageDataResponse:
    id: str
    name: str
    original_filename: str | None
    file_size: int
    mime_type: str
    uploaded_at: str
    url: str
    title: str
    alt_text: str | None
    caption: str | None
    description: str | None

    @classmethod
    def from_image(cls, img: Image) -> "ImageDataResponse":
        return cls(
            id=str(img.pk),
            name=img.label,
            original_filename=img.original_filename,
            file_size=img.size,
            mime_type=img.mime_type,
            uploaded_at=img.uploaded_at.isoformat(),
            url=img.url,
            title=img.name,
            alt_text=img.default_alt_text,
            caption=img.default_caption,
            description=img.description,
        )


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def filer_upload_handler(request) -> JsonResponse:
    # Check if the request is multipart, which is required for file uploads
    if not request.content_type.startswith("multipart/"):
        return JsonResponse(
            {"error": "File upload requires multipart/form-data content type"},
            status=400,
        )

    form = FileUploadForm(request.POST, request.FILES)
    if not form.is_valid():
        return JsonResponse(
            {"error": "Invalid form data", "errors": form.errors}, status=400
        )

    uploaded_file: UploadedFile = form.cleaned_data["upload_file"]
    img = Image.objects.create(
        original_filename=uploaded_file.name,
        file=uploaded_file,
        folder=None,
        is_public=filer_settings.FILER_IS_PUBLIC_DEFAULT,
        owner=request.user,
    )

    return JsonResponse(
        dataclasses.asdict(ImageDataResponse.from_image(img)),
        status=HTTPStatus.CREATED,
    )


@csrf_exempt
@login_required
@require_http_methods(["GET", "PATCH"])
def filer_edit_handler(request, image_pk: str) -> JsonResponse:
    """View to handle image editing form and updates"""
    try:
        img = Image.objects.get(pk=image_pk)
    except ObjectDoesNotExist:
        return JsonResponse({"error": "Image not found"}, status=404)

    match request.method:
        case "PATCH":
            # Parse URL-encoded PATCH data from request body
            patch_data = QueryDict(request.body)
            form = ImageEditForm(patch_data, instance=img)
            if form.is_valid():
                img = form.save()
                return JsonResponse(
                    {
                        **dataclasses.asdict(
                            ImageDataResponse.from_image(img),
                        ),
                    }
                )
            else:
                return JsonResponse(
                    {"error": "Invalid form data", "errors": form.errors},
                    status=400,
                )
        case "GET":
            return JsonResponse(
                dataclasses.asdict(
                    ImageDataResponse.from_image(img),
                ),
            )
        case _:
            assert_never(request.method)
