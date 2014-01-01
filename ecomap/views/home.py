from restful.decorators import restful_view_templates
from django.views.generic.base import View

from restful.exception.verbose import VerboseRedirectException
from ecomap.services import *

@restful_view_templates('home')
class HomeView(View):
    def get(self, request):
        return {
            'recyclables': RecycleMaterialService.get_all(),
            'spots': RecycleSpotService.get_by_types(request.POST.getlist('types')),
            'spot_types': RecycleSpotType.objects.all(),
        }

    def put(self, request):
        # ...nothing happens here yet, test redirection with errors...
        failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')
