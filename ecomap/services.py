from models import *
import logging
class RecycleSpotService():
    def get_by_types(self, **params):
        
        if 'types' not in params or len(params.getlist('types'))==0:
            return RecycleSpot.objects.all()
        types = params.getlist('types')

        # check if the provided types are valid
        if RecycleSpot.check_type(*types) > 0:
            raise Exception("Invalid recycle spot type")

        return RecycleSpot.objects.filter(type__in=types)

    def get_by_id(self, **params):
        spot_id = int(params.get('spot_id', 0))
        try:
            spot = [RecycleSpot.objects.get(id = spot_id)]
        except RecycleSpot.DoesNotExist:
            spot = [] # to handle error
        
        return spot

class RecyclableItemService():
    def get_all(self):
        return RecyclableItem.objects.all()
