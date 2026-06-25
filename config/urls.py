from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from shop.admin import jalaram_admin

urlpatterns = [
    path('admin/', jalaram_admin.urls),
    path('', include('shop.urls')),
]

# In dev (and when Cloudinary is not used), serve uploaded media locally.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
