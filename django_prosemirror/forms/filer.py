from django import forms

from filer.models import Image


class FileUploadForm(forms.Form):
    upload_file = forms.FileField(required=True)


class ImageEditForm(forms.ModelForm):
    class Meta:
        model = Image
        fields = ["name", "description", "default_caption"]
