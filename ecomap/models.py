from django.db import models
import logging 
class RecycleSpotMaterial(models.Model):
    class Meta:
        db_table = 'spot_material'
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name.encode("utf-8")

class RecyclableItem(models.Model):
    class Meta:
        db_table = 'material_mapping'
    alias = models.CharField(max_length=255, primary_key=True)
    material = models.ForeignKey('RecycleSpotMaterial', related_name = 'aliases')

class RecycleSpot(models.Model):
    class Meta:
        db_table = 'spot'

    TYPE_DEPOT = 'depot'
    TYPE_STATION = 'station'
    TYPE_YARD = 'yard'
    TYPE_STORE = 'store'

    type = models.ForeignKey('RecycleSpotType', related_name = 'spot_types')
    name = models.CharField(max_length=255)
    organisation = models.CharField(max_length=64)
    area = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    lng = models.FloatField()
    lat = models.FloatField()
    added_at = models.DateTimeField()
    description = models.TextField()
    contact = models.TextField()
    pointer = models.CharField(max_length=255, blank=True)
    streetview_params = models.CharField(max_length=255)
    materials = models.ManyToManyField('RecycleSpotMaterial', through= 'RecycleSpotMaterialLink' )

    @classmethod
    def check_type(cls, *args):
        return len(set(args)-{
            cls.TYPE_DEPOT,
            cls.TYPE_STATION,
            cls.TYPE_STORE,
            cls.TYPE_YARD,
        }) == 0

    @classmethod
    def add_spot(cls, data):
        fields = { # This will be refactored
            'type_id'     : data['object_type'][0],
            'description' : data['object_description'][0] if 'object_description' in data else "",
            'lat'         : data['lat'][0],
            'lng'         : data['lng'][0],
            'address'     : data['address'][0],
            'streetview_params': data['streetview_params'][0]
        }

        spot_id = cls.objects.create(**fields)
        
        materials = RecycleSpotMaterial.objects.filter(name__in = data['object_services[]'])
        for i in materials:
            spot_material_fields = {
                'spot_id'    : spot_id.id,
                'material_id': int(i.id)
            }
            RecycleSpotMaterialLink.objects.create(**spot_material_fields)
        
        
class RecycleSpotMaterialLink(models.Model):
    class Meta:
        db_table = 'spot_material_link'

    spot        = models.ForeignKey('RecycleSpot', primary_key = True)
    material    = models.ForeignKey('RecycleSpotMaterial', related_name = 'spot_materials')

class RecycleSpotType(models.Model):
    class Meta:
        db_table = "spot_type"
 
    name = models.CharField(max_length = 255)

    def __str__(self):
        return self.name