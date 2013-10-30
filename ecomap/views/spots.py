from django.template.response import TemplateResponse
from django.views.generic.base import View
from django.http import HttpResponse

from core.exception.verbose import VerboseRedirectException
from ecomap.services import *


class RecycleSpotsView(View):
    def get(self, request):
        return TemplateResponse(request, 'spots/get', {
            'spots': RecycleSpotService.get_by_types(request.params.getlist('test'))
        })

    def put(self, request):
        data = request.PUT
        
        RecycleSpot.save(data)
        return HttpResponse(content = "123", status = 200)
        # ...nothing happens here yet, test redirection with errors...
       # failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        #raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')

