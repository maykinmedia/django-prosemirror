from django.urls import path

from . import views

urlpatterns = [
    path(
        "filer-image-upload/",
        views.filer_upload_handler,
        name="filer_upload_handler",
    ),
    path(
        "filer-image-upload/<str:image_pk>/",
        views.filer_edit_handler,
        name="filer_edit_handler",
    ),
]
