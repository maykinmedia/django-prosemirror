from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index_view),
    path("form", views.simple_form_view),
    path("model-form", views.model_form_view),
    path("admin/", admin.site.urls),
]
