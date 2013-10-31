from models import *

import logging
class RecycleSpotService():
    FIELDS = [
        'id',
        'name',
        'description',
        'address',
        'lat',
        'lng',
        'streetview_params',
        'type__name',
        'materials__name'
    ]    
    @classmethod
    def get_by_types(cls, types):
        logging.critical(types)
        if not types or len(types)==0:
            return cls.build_dict(RecycleSpot.objects.select_related().values(*cls.FIELDS))
        # check if the provided types are valid
        if RecycleSpot.check_type(*types) > 0:  
            raise Exception("Invalid recycle spot type")
        
        return cls.build_dict(RecycleSpot.objects.select_related().filter(materials__name__in=types).values(*cls.FIELDS))
    @classmethod
    def get_by_id(cls, id):
        return cls.build_dict(RecycleSpot.objects.select_related().get(id=int(id)).values(*cls.FIELDS))
    
    @staticmethod
    def build_dict(data):
        results = {}
        for i in data:
            if i['type__name'] not in results:
                results[i['type__name']] = [i]
            else:
                results[i['type__name']].append(i)
        return results

class RecyclableItemService():
    def get_all(self):
        return RecyclableItem.objects.all()

class RecycleMaterialService():
    @staticmethod
    def get_all():
        result = {}

        for i in RecycleSpotMaterial.objects.select_related().values('aliases__alias', 'name'):
            result[i['name']] = i['name']
            if i['aliases__alias'] and i['aliases__alias'] not in result:
                result[i['aliases__alias']] = i['name']
        logging.critical(result)
        return result
