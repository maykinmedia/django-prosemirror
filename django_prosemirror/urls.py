from django.urls import path

from . import views

urlpatterns = [
    path(
        "filer-upload-handler/", views.filer_upload_handler, name="filer_upload_handler"
    ),
]
