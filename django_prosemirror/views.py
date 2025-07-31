from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .forms import FileUploadForm


@csrf_exempt
@require_http_methods(["POST"])
def filer_upload_handler(request):
    form = FileUploadForm(request.POST, request.FILES)

    if not form.is_valid():
        return JsonResponse({"error": "Invalid form data"}, status=400)

    uploaded_file = form.cleaned_data["upload_file"]
    destination_path = form.cleaned_data.get("destination_path", "/")
    filename = uploaded_file.name

    mock_file_data = {
        "id": 123,
        "name": filename,
        "original_filename": filename,
        "file_size": uploaded_file.size,
        "mime_type": uploaded_file.content_type or "application/octet-stream",
        "uploaded_at": "2024-01-15T10:30:00Z",
        "description": f"Uploaded file: {filename}",
        "folder": {"id": 45, "name": "Documents"},
        "owner": {"id": 1, "username": "admin"},
        "url": f"/media/filer_public{destination_path.rstrip('/')}/{filename}",
        "is_public": True,
    }

    return JsonResponse(mock_file_data)
