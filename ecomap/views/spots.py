from django.template.response import TemplateResponse
from django.views.generic.base import View

from core.exception.verbose import VerboseRedirectException
from ecomap.services import *
from django.http import HttpResponse

import logging

class RecycleSpotsView(View):
    func_name = "get_by_types"
    def get(self, request, **params):
        service = RecycleSpotService()
        params['types'] = request.params.getlist('test')
        data = getattr(service, self.func_name)(params)

        return HttpResponse(data, mimetype='application/json')
        #return TemplateResponse(request, 'spots/get', { 'spots': data })
    def put(self, request):
        # ...nothing happens here yet, test redirection with errors...
        failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')

