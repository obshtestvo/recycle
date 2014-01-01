from restful.decorators import restful_view_templates
from django.views.generic.base import View

from ecomap.services import *

@restful_view_templates('spots')
class RecycleSpotsView(View):
    def get(self, request, **args):
        if "spot_id" in args and args['spot_id'] > 0:
            data = RecycleSpotService.get_by_id(args['spot_id'])
        else:
            data = RecycleSpotService.get_by_types(request.params.getlist('tags[]'))
        
        return {
            'spots': data
        }

    def put(self, request):      
        try:
            RecycleSpot.add_spot(request.PUT)
            status = 201
            message = 'OK'
        except:
            status = 400
            message = 'Error'
        return {'status': message}, status

