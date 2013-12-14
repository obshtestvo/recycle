from django.contrib import admin
from ecomap.models import RecycleSpot, RecycleSpotType, RecycleSpotMaterial, RecyclableItem

class RecycleSpotAdmin(admin.ModelAdmin):
    list_filter = ('type__name',)
    list_display = ('name', 'description',)

class RecycleSpotTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)

class RecycleSpotMaterialAdmin(admin.ModelAdmin):
    list_display = ('name',)

class RecyclableItemAdmin(admin.ModelAdmin):
    list_display = ('alias',)

admin.site.register(RecycleSpot,RecycleSpotAdmin)
admin.site.register(RecycleSpotType, RecycleSpotTypeAdmin)
admin.site.register(RecycleSpotMaterial, RecycleSpotMaterialAdmin)
admin.site.register(RecyclableItem,RecyclableItemAdmin)