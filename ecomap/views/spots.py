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
        try:
            RecycleSpot.add_spot(request.params)
            status = 201
            message = 'OK'
        except Exception as e:
            status = 400
            message = str(e)
        return {'status': message}, status