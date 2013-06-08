from django.db import models


class RecycleSpotMaterial(models.Model):
    name = models.CharField(max_length=255, primary_key=True)


class RecyclableItem():
    name = models.CharField(max_length=255, primary_key=True)
    material = models.ForeignKey(RecycleSpotMaterial)


class RecycleSpot(models.Model):
    TYPE_DEPOT = 'depot'
    TYPE_STATION = 'station'
    TYPE_YARD = 'yard'
    TYPE_STORE = 'store'

    type = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    organisation = models.CharField(max_length=64)
    area = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    lng = models.FloatField()
    lat = models.FloatField()
    added_at = models.DateTimeField()
    description = models.TextField()
    contact = models.TextField()
    pointer = models.CharField(max_lenght=255)
    streetview_params = models.CharField(max_lenght=255)
    materials = models.ManyToManyField(RecycleSpotMaterial)