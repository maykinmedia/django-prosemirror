from django.urls import path

from . import views

urlpatterns = [
    path(
        "filer-upload-handler/", views.filer_upload_handler, name="filer_upload_handler"
    ),
    path("temp-file/<str:file_key>/", views.serve_temp_file, name="serve_temp_file"),
    path(
        "temp-file/<str:dest>/<str:file_key>/",
        views.serve_temp_file,
        name="serve_temp_file",
    ),
]
