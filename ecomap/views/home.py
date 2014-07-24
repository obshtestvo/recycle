from restful.decorators import restful_view_templates
from django.views.generic.base import View

from restful.exception.verbose import VerboseRedirectException
from ecomap.services import *

@restful_view_templates
class HomeView(View):
    def get(self, request):
        criteria = {
            "types": request.params.getlist('types[]')
        }
        bounds = BoundsForm(data=request.params, prefix='bounds')
        if bounds.is_valid():
            criteria["bounds"] = bounds.cleaned_data
        return {
            'recyclables': RecycleMaterialService.get_all(),
            'spot_types': RecycleSpotType.objects.all(),
        }

    def put(self, request):
        # ...nothing happens here yet, test redirection with errors...
        failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')
