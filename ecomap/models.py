from django.db import models

class RecycleSpotType(models.Model):
    class Meta:
        db_table = "spot_type"

    name = models.CharField(max_length=255)

    def __unicode__(self):
        return self.name

class RecycleSpotMaterial(models.Model):
    class Meta:
        db_table = 'spot_material'
    name = models.CharField(max_length=255)

    def __unicode__(self):
        return self.name

class RecyclableItem(models.Model):
    class Meta:
        db_table = 'material_mapping'
    alias = models.CharField(max_length=255, primary_key=True)
    material = models.ForeignKey('RecycleSpotMaterial', related_name = 'aliases')

    def __unicode__(self):
        return self.alias + ' - ' + self.material.name


class RecycleSpotMaterialLink(models.Model):
    class Meta:
        db_table = 'spot_material_link'

    spot        = models.ForeignKey('RecycleSpot')
    material    = models.ForeignKey('RecycleSpotMaterial', related_name='spots')

class RecycleSpot(models.Model):
    class Meta:
        db_table = 'spot'

    TYPE_DEPOT = 'depot'
    TYPE_STATION = 'station'
    TYPE_YARD = 'yard'
    TYPE_STORE = 'store'

    type = models.ForeignKey('RecycleSpotType', related_name = 'spots')
    name = models.CharField(max_length=255, blank=True)
    organisation = models.CharField(max_length=64, blank=True)
    contact = models.TextField()

    added_at = models.DateTimeField(auto_now=True)
    lng = models.FloatField()
    lat = models.FloatField()
    area = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255)
    description = models.TextField()
    streetview_params = models.CharField(max_length=255)
    pointer = models.CharField(max_length=255, blank=True)
    materials = models.ManyToManyField('RecycleSpotMaterial', through='RecycleSpotMaterialLink')

    def __unicode__(self):
        return self.name

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
            'type_id'          : data.get('object_type'),
            'description'      : data.get('object_description', ""),
            'lat'              : data.get('lat'),
            'lng'              : data.get('lng'),
            'address'          : data.get('address'),
            'streetview_params': data.get('streetview_params')
        }

        spot_id = cls.objects.create(**fields)
        
        materials = RecycleSpotMaterial.objects.filter(name__in = data.getlist('object_services[]'))
        for i in materials:
            spot_material_fields = {
                'spot_id'    : spot_id.id,
                'material_id': int(i.id)
            }
            RecycleSpotMaterialLink.objects.create(**spot_material_fields)