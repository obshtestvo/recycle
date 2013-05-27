from django.template.response import TemplateResponse
from django.views.generic.base import View

from core.exception.verbose import VerboseRedirectException
from core.shortcuts import errors


class HomeView(View):
    def get(self, request):
        return TemplateResponse(request, 'home/index', {
                'errors': errors(request),
                'meta': request.META,
                'params': request.params,
                'get': request.GET,
                'post': request.POST,
            });

    def put(self, request):
        # ...nothing happens here yet, test redirection with errors...
        failure = VerboseRedirectException('Unable to change home page').set_redirect('home')
        # ...processing changes on home page...
        # Ooops, an error occurred
        raise failure.add_error('sidebar', 'Your chosen sidebar widgets are unavailable')
