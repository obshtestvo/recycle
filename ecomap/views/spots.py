from django.template.response import TemplateResponse
from django.views.generic.base import View
from django.http import HttpResponse

from core.exception.verbose import VerboseRedirectException
from ecomap.services import *

class RecycleSpotsView(View):
    def get(self, request, **args):
        
        if "spot_id" in args and args['spot_id'] > 0:
            data = RecycleSpotService.get_by_id(args['spot_id'])
        else:
            data = RecycleSpotService.get_by_types(request.params.getlist('tags[]'))
        
        return TemplateResponse(request, 'spots/get', {
            'spots': data
        })

    def put(self, request):      
        try:
            RecycleSpot.add_spot(request.PUT)
            status  = 201
            message = 'OK'
        except:
            status  = 400
            message = 'Error'

        return TemplateResponse(request, 'spots/put',{ 'status': message }, status = status)

        # ...nothing happens here yet, test redirection with errors...
       # failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        #raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')

