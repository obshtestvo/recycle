from restful.decorators import restful_view_templates
from django.views.generic.base import View

from ecomap.services import *

@restful_view_templates('spots')
class RecycleSpotsView(View):
    def get(self, request, **args):
        criteria = {
            "types": request.params.getlist('tags[]')
        }
        bounds = BoundsForm(data=request.params, prefix='bounds')
        if bounds.is_valid():
            criteria["bounds"] = bounds.cleaned_data
        data = RecycleSpotService.get_all_by_types_and_bounds(**criteria)
        return {
            'spots': data
        }

    def put(self, request):
        data = {}
        try:
            form = LocationForm(data=request.params)
            if form.is_valid():
                id = RecycleSpot.add_spot(form, request.params.getlist('object_services[]'))
                status = 201
                data["message"] = 'OK'
                data["id"] = id
            else:
                status = 400
                data["message"] = str(form.errors)
        except Exception as e:
            status = 400
            data["message"] = str(e)
        return { "data": data}, status


from django.forms import ModelForm
class LocationForm(ModelForm):
    class Meta:
        model = RecycleSpot
        fields = ['type', 'description', 'lat', 'lng', 'address', 'area', 'number', 'post_code', 'streetview_params']