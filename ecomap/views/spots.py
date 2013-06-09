from django.template.response import TemplateResponse
from django.views.generic.base import View

from core.exception.verbose import VerboseRedirectException
from ..services import *


class RecycleSpotsView(View):
    def get(self, request):
        service = RecycleSpotService()
        request.params.get('types')
        return TemplateResponse(request, 'spots/get', {
            'spots': service.get_by_types(request.params.getlist('test'))
        })

    def put(self, request):
        # ...nothing happens here yet, test redirection with errors...
        failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')
