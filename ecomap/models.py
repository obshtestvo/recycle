from django.db import models

class RecycleSpotMaterial(models.Model):
    class Meta:
        db_table = 'spot_material'
    name = models.CharField(max_length=255, primary_key=True)


class RecyclableItem(models.Model):
    class Meta:
        db_table = 'material_mapping'
    alias = models.CharField(max_length=255, primary_key=True)
    material = models.ForeignKey('RecycleSpotMaterial')

class RecycleSpot(models.Model):
    class Meta:
        db_table = 'spot'

    TYPE_DEPOT = 'depot'
    TYPE_STATION = 'station'
    TYPE_YARD = 'yard'
    TYPE_STORE = 'store'

    type = models.ForeignKey('RecycleSpotType', db_column = 'type', related_name = 'spots')
    name = models.CharField(max_length=255)
    organisation = models.CharField(max_length=64)
    area = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    lng = models.FloatField()
    lat = models.FloatField()
    added_at = models.DateTimeField()
    description = models.TextField()
    contact = models.TextField()
    pointer = models.CharField(max_length=255)
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

class RecycleSpotMaterialLink(models.Model):
    class Meta:
        db_table = 'spot_material_link'

    spot = models.ForeignKey('RecycleSpot', primary_key = True)
    material = models.ForeignKey('RecycleSpotMaterial', related_name = 'spot_materials')

class RecycleSpotType(models.Model):
    class Meta:
        db_table = "spot_type"
 
    name = models.CharField(max_length = 255)

