from django import forms

from django_prosemirror.filer_models import get_image_model


class FileUploadForm(forms.Form):
    upload_file = forms.FileField(required=True)


class ImageEditForm(forms.ModelForm):
    class Meta:
        model = get_image_model()
        fields = ["name", "description", "default_caption"]
