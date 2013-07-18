from models import *
from django.utils import simplejson

def json_prepare(data = [], keys = True):
        json_data = {}
        for i in data:
            if i.type not in json_data:
                json_data[i.type] = []
                
            entry = {
                "id"  : i.id,
            	"name": i.name,
            	"description": i.description,
		        "lat": i.lat,
		        "lng": i.lng
            }
            json_data[i.type].append(entry)

        if data:
             data = simplejson.dumps(json_data) if keys else simplejson.dumps(json_data.values()[0])

        return data

class RecycleSpotService():
    def get_by_types(self, params):
        types = params['types']
        if len(types)==0:
            return json_prepare(RecycleSpot.objects.all())

    # check if the provided types are valid
        if RecycleSpot.check_type(*types) > 0:
            raise Exception("Invalid recycle spot type")

            return json_prepare(RecycleSpot.objects.filter(type__in=types))
    def get_by_id(self, params):
        spot_id = int(params.get('spot_id', 0))
        try:
            spot = [RecycleSpot.objects.get(id = spot_id)]
        except RecycleSpot.DoesNotExist:
            spot = [] # to handle error
        
        return json_prepare(spot, keys = False)

    class RecyclableItemService():
        def get_all(self):
            return RecyclableItem.objects.all()
