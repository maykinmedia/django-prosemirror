import uuid
import base64
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.cache import cache

from .forms import FileUploadForm
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@require_http_methods(["POST"])
def filer_upload_handler(request):
    form = FileUploadForm(request.POST, request.FILES)

    if not form.is_valid():
        return JsonResponse({"error": "Invalid form data"}, status=400)

    uploaded_file = form.cleaned_data["upload_file"]
    destination_path = form.cleaned_data.get("destination_path", "/")
    filename = uploaded_file.name

    # Generate a unique key for cache
    unique_key = str(uuid.uuid4())

    # Read file content
    file_content = uploaded_file.read()

    # Store in cache with 1 hour expiration
    cache_data = {
        "content": base64.b64encode(file_content).decode("utf-8"),
        "content_type": uploaded_file.content_type,
        "filename": filename,
    }
    cache.set(f"temp_file_{unique_key}", cache_data, timeout=3600)  # 1 hour

    # Generate temporary URL
    temp_url = request.build_absolute_uri(
        f"/prosemirror/temp-file{destination_path.rstrip('/')}/{unique_key}"
    )

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
        "url": temp_url,
        "temp_key": unique_key,
        "is_public": True,
    }

    return JsonResponse(mock_file_data)


def serve_temp_file(request, **dest):
    """View to serve temporary cached files"""
    cache_data = cache.get(f"temp_file_{dest['file_key']}")

    if not cache_data:
        return HttpResponse("File not found or expired", status=404)

    file_content = base64.b64decode(cache_data["content"])
    response = HttpResponse(file_content, content_type=cache_data["content_type"])
    response["Content-Disposition"] = f'inline; filename="{cache_data["filename"]}"'

    return response
