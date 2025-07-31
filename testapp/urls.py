from django.contrib import admin
from django.urls import include, path

from . import views

urlpatterns = [
    path("", views.index_view),
    path("form", views.simple_form_view),
    path("model-form", views.model_form_view),
    path("admin/", admin.site.urls),
    path("prosemirror/", include("django_prosemirror.urls")),
]
