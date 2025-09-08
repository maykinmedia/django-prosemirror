from django.urls import path

urlpatterns = []

# Include filer URLs if filer is available
try:
    import filer  # noqa: F401, I001

    from django_prosemirror.views import filer_image as filer_image_views

    urlpatterns += [
        path(
            "filer-image-upload/",
            filer_image_views.filer_upload_handler,
            name="filer_upload_handler",
        ),
        path(
            "filer-image-upload/<str:image_pk>/",
            filer_image_views.filer_edit_handler,
            name="filer_edit_handler",
        ),
    ]
except ImportError:
    # filer not available, skip filer URLs
    pass
