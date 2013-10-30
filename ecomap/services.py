from models import *

import logging
class RecycleSpotService():
    @staticmethod
    def get_by_types(params):
        if 'types' not in params or len(params.getlist('types'))==0:
           results = {}
           fields = [
                'id',
                'name',
                'description',
                'address',
                'lat',
                'lng',
                'streetview_params',
                'type__name'
            ]
           for i in RecycleSpot.objects.select_related().values(*fields):
            logging.critical(i)
            if i['type__name'] not in results:
                results[i['type__name']] = [i]
            else:
                results[i['type__name']].append(i)
        return results

        # check if the provided types are valid
        if RecycleSpot.check_type(*types) > 0:  
            raise Exception("Invalid recycle spot type")
        
        return RecycleSpot.objects.filter(type__in=types)


class RecyclableItemService():
    def get_all(self):
        return RecyclableItem.objects.all()
