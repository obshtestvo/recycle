from django.template.response import TemplateResponse
from django.views.generic.base import View

from core.exception.verbose import VerboseRedirectException
from ecomap.services import *

class RecycleSpotView(View):
    def get(self, request, **args):
        data = RecycleSpotService.get_by_id(args['id'])
        return TemplateResponse(request, 'spot/get', {
            'spot': data
        })