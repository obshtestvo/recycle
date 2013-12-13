from django.template.response import TemplateResponse
from django.views.generic.base import View

from core.exception.verbose import VerboseRedirectException
from ecomap.services import *

class HomeView(View):
    def get(self, request):
        recyclableService = RecyclableItemService()
        return TemplateResponse(request, 'home/get', {
            #'spots': [{"name": "glass", "material": "glass"}],
            'recyclables': RecycleMaterialService.get_all(),
             'spots': RecycleSpotService.get_by_types(request.POST.getlist('types')),
             #'recyclables':  recyclableService.get_all()
        })

    def put(self, request):
        # ...nothing happens here yet, test redirection with errors...
        failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')
