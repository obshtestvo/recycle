from django.template.response import TemplateResponse
from django.views.generic.base import View

from core.exception.verbose import VerboseRedirectException
from ..services import *


class HomeView(View):
    def get(self, request):
        spotService = RecycleSpotService()
        recyclableService = RecyclableItemService()
        return TemplateResponse(request, 'home/get', {
            'spots': spotService.get_by_types(request.params.getlist('types')),
            'recyclables': recyclableService.get_all(),
        })

    def put(self, request):
        # ...nothing happens here yet, test redirection with errors...
        failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')