import dataclasses
from functools import wraps
from http import HTTPStatus
from typing import assert_never

from django.core.exceptions import ObjectDoesNotExist
from django.core.files.uploadedfile import UploadedFile
from django.http import JsonResponse, QueryDict
from django.views.decorators.http import require_http_methods

from filer import settings as filer_settings
from filer.models.abstract import BaseImage

from django_prosemirror.filer_models import get_image_model, image_permission
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
    def from_image(cls, img: BaseImage) -> "ImageDataResponse":
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


def staff_image_permission_required(action: str):
    """
    Require a staff user with the permission to perform the action on images.

    The permission is that of filer's configured image model, see
    :func:`django_prosemirror.filer_models.image_permission`.
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs) -> JsonResponse | None:
            # Anonymous users also get 403 rather than 401: a 401 must carry a
            # WWW-Authenticate header, which doesn't apply to session auth.
            if not request.user.is_authenticated:
                return JsonResponse({"error": "Authentication required"}, status=403)
            perm = image_permission(action)
            if not (request.user.is_staff and request.user.has_perm(perm)):
                return JsonResponse({"error": "Permission denied"}, status=403)
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


@require_http_methods(["POST"])
@staff_image_permission_required("add")
def filer_upload_handler(request) -> JsonResponse:
    form = FileUploadForm(request.POST, request.FILES, owner=request.user)
    if not form.is_valid():
        return JsonResponse(
            {"error": "Invalid form data", "errors": form.errors}, status=400
        )

    uploaded_file: UploadedFile = form.cleaned_data["upload_file"]
    img = get_image_model().objects.create(
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


@require_http_methods(["GET", "PATCH"])
@staff_image_permission_required("change")
def filer_edit_handler(request, image_pk: str) -> JsonResponse:
    """View to handle image editing form and updates"""

    try:
        img = get_image_model().objects.get(pk=image_pk)
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
