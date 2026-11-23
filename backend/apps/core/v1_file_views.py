"""Views for File Upload Presigning, Completion, and Retrieval (Section 16.6)."""
import uuid
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.models import FileAsset

PURPOSE_RULES = {
    'avatar': {'exts': ['jpg', 'jpeg', 'png', 'webp'], 'max_bytes': 2 * 1024 * 1024, 'public': False},
    'logo': {'exts': ['jpg', 'jpeg', 'png', 'webp', 'svg'], 'max_bytes': 5 * 1024 * 1024, 'public': True},
    'library_logo': {'exts': ['jpg', 'jpeg', 'png', 'webp', 'svg'], 'max_bytes': 5 * 1024 * 1024, 'public': True},
    'banner': {'exts': ['jpg', 'jpeg', 'png', 'webp'], 'max_bytes': 5 * 1024 * 1024, 'public': True},
    'gallery': {'exts': ['jpg', 'jpeg', 'png', 'webp'], 'max_bytes': 5 * 1024 * 1024, 'public': True},
    'achiever': {'exts': ['jpg', 'jpeg', 'png', 'webp'], 'max_bytes': 5 * 1024 * 1024, 'public': True},
    'book_cover': {'exts': ['jpg', 'jpeg', 'png', 'webp'], 'max_bytes': 5 * 1024 * 1024, 'public': True},
    'notification_image': {'exts': ['jpg', 'jpeg', 'png', 'webp'], 'max_bytes': 5 * 1024 * 1024, 'public': True},
    'page_image': {'exts': ['jpg', 'jpeg', 'png', 'webp'], 'max_bytes': 5 * 1024 * 1024, 'public': True},
    'video': {'exts': ['mp4'], 'max_bytes': 50 * 1024 * 1024, 'public': True},
    'student_document': {'exts': ['jpg', 'jpeg', 'png', 'pdf'], 'max_bytes': 5 * 1024 * 1024, 'public': False},
    'import': {'exts': ['xlsx', 'csv'], 'max_bytes': 10 * 1024 * 1024, 'public': False},
    'payment_proof': {'exts': ['jpg', 'jpeg', 'png', 'pdf'], 'max_bytes': 5 * 1024 * 1024, 'public': False},
    'ticket_attachment': {'exts': ['jpg', 'jpeg', 'png', 'pdf'], 'max_bytes': 5 * 1024 * 1024, 'public': False},
    'feedback_attachment': {'exts': ['jpg', 'jpeg', 'png', 'pdf'], 'max_bytes': 5 * 1024 * 1024, 'public': False},
}


def _serialize_file_asset(asset):
    return {
        'id': str(asset.id),
        'filename': asset.filename,
        'purpose': asset.purpose,
        'content_type': asset.content_type,
        'size_bytes': asset.size_bytes,
        'status': asset.status,
        'is_public': asset.is_public,
        'url': f"https://cdn.shelfspace.in/files/{asset.id}/{asset.filename}",
        'created_at': asset.created_at.isoformat(),
    }


class FilesPresignView(APIView):
    """POST /v1/files/presign"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        purpose = request.data.get('purpose')
        filename = request.data.get('filename') or request.data.get('file_name')
        content_type = request.data.get('content_type') or request.data.get('mime_type')
        size_bytes = request.data.get('size_bytes') if request.data.get('size_bytes') is not None else request.data.get('file_size_bytes')

        if not purpose or not filename or not content_type or size_bytes is None:
            raise PlatformAPIException('purpose, filename, content_type, and size_bytes are required.', code='validation_error')

        if purpose not in PURPOSE_RULES:
            raise PlatformAPIException(f'Invalid purpose. Must be one of {list(PURPOSE_RULES.keys())}.', code='invalid_purpose')

        rule = PURPOSE_RULES[purpose]
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if ext not in rule['exts']:
            raise PlatformAPIException(f"Invalid file type for {purpose}. Allowed: {rule['exts']}", code='invalid_file_type')

        if int(size_bytes) > rule['max_bytes']:
            raise PlatformAPIException(f"File exceeds maximum allowed size of {rule['max_bytes'] // (1024 * 1024)} MB.", code='file_too_large')

        library_id = getattr(request, 'org_id', None) or getattr(request.user, 'library_id', None)
        file_id = uuid.uuid4()

        asset = FileAsset.objects.create(
            id=file_id,
            user=request.user,
            library_id=library_id,
            purpose=purpose,
            filename=filename,
            content_type=content_type,
            size_bytes=int(size_bytes),
            status='pending',
            storage_path=f"uploads/{purpose}/{file_id}_{filename}",
            is_public=rule['public'],
        )

        return Response({
            'file_id': str(asset.id),
            'upload_url': f"https://storage.shelfspace.in/upload/{asset.id}",
            'method': 'PUT',
            'headers': {'Content-Type': content_type},
            'expires_in': 900,
        }, status=status.HTTP_200_OK)


class FilesCompleteView(APIView):
    """POST /v1/files/{id}/complete"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        asset = FileAsset.objects.filter(pk=id).first()
        if not asset:
            raise PlatformAPIException('File asset not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        asset.status = 'ready'
        asset.save(update_fields=['status'])
        return Response(_serialize_file_asset(asset))


class FileDetailView(APIView):
    """GET & DELETE /v1/files/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        asset = FileAsset.objects.filter(pk=id).first()
        if not asset:
            raise PlatformAPIException('File asset not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response(_serialize_file_asset(asset))

    def delete(self, request, id):
        asset = FileAsset.objects.filter(pk=id).first()
        if not asset:
            raise PlatformAPIException('File asset not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        asset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
