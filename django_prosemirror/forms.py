from django import forms


class FileUploadForm(forms.Form):
    upload_file = forms.FileField(required=True)
    destination_path = forms.CharField(required=False, initial="/", max_length=256)
