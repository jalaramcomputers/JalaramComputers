"""Storage backend selection for uploaded product videos.

`select_video_storage` is referenced (by import path) as the `storage=` callable
on Product.video, so it never gets baked into migrations. It returns Cloudinary
storage when credentials are present, and falls back to the local filesystem
otherwise — so the app still boots and runs in dev without Cloudinary set up.
"""
import os

from django.core.files.storage import FileSystemStorage


def cloudinary_enabled():
    return bool(
        os.environ.get('CLOUDINARY_URL')
        or os.environ.get('CLOUDINARY_CLOUD_NAME')
    )


def select_video_storage():
    if cloudinary_enabled():
        try:
            from cloudinary_storage.storage import VideoMediaCloudinaryStorage
            return VideoMediaCloudinaryStorage()
        except Exception:
            # Misconfigured/unavailable Cloudinary must not break model loading.
            pass
    return FileSystemStorage()
