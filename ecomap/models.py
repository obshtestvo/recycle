from django.db import models


class RecycleSpotMaterial(models.Model):
    name = models.CharField(max_length=255, primary_key=True)


class RecyclableItem(models.Model):
    name = models.CharField(max_length=255, primary_key=True)
    material = models.ForeignKey(RecycleSpotMaterial)


class RecycleSpot(models.Model):
    class Meta:
        db_table = 'spot'

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
    pointer = models.CharField(max_length=255)
    streetview_params = models.CharField(max_length=255)
    materials = models.ManyToManyField(RecycleSpotMaterial)

    @staticmethod
    def check_type(self, *args):
        return len(set(args)-{
            self.TYPE_DEPOT,
            self.TYPE_STATION,
            self.TYPE_STORE,
            self.TYPE_YARD,
        }) == 0
