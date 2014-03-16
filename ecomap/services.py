from models import *
from django import forms

class BoundsForm(forms.Form):
    ne_lat = forms.FloatField(required=True)
    ne_lng = forms.FloatField(required=True)
    sw_lat = forms.FloatField(required=True)
    sw_lng = forms.FloatField(required=True)

class RecycleSpotService():
    FIELDS = [
        'id',
        'description',
        'address',
        'lat',
        'lng',
        'streetview_params',
        'type__name',
        'materials__name',
    ]    

    @classmethod
    def get_all_by_types_and_bounds(cls, types, bounds=None):
        criteria = {}
        # check if the provided types are valid
        if types and len(types)>0:
            if RecycleSpot.check_type(*types) > 0:
                raise Exception("Invalid recycle spot type")
            else:
                criteria["materials__name__in"] = types

        #                **************** North East(ne)
        # South West(sw) ****************
        # @todo it only works for bulgaria right now
        if bounds:
            criteria["lat__lte"] = bounds["ne_lat"]
            criteria["lat__gte"] = bounds["sw_lat"]
            criteria["lng__gte"] = bounds["sw_lng"]
            criteria["lng__lte"] = bounds["ne_lng"]

        return RecycleSpot.objects.select_related("type").prefetch_related('materials').filter(**criteria)

    @classmethod
    def get_by_id(cls, id):
        return RecycleSpot.objects.select_related("type").prefetch_related('materials').get(pk=id)

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

        return result
