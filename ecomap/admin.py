from django.contrib import admin
from ecomap.models import RecycleSpot, RecycleSpotType, RecycleSpotMaterial, RecyclableItem

admin.site.register(RecycleSpot)
admin.site.register(RecycleSpotType)
admin.site.register(RecycleSpotMaterial)
admin.site.register(RecyclableItem)