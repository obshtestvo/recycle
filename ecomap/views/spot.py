from restful.decorators import restful_view_templates
from django.views.generic.base import View

from ecomap.services import *

@restful_view_templates('spot')
class RecycleSpotView(View):
    def get(self, request, **args):
        data = RecycleSpotService.get_by_id(args['id'])
        return {
            'spot': data
        }