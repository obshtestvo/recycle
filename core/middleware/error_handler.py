import pickle

from django.contrib import messages
from django.shortcuts import resolve_url

from core.exception.verbose import VerboseException, VerboseRedirectException
from core.exception.http import HttpResponseNotModifiedRedirect

class ErrorHandler(object):
    def process_exception(self, request, exception):
        if not isinstance(exception, VerboseException):
            return

        if isinstance(exception, VerboseRedirectException):
            for key, value in exception.get_errors().iteritems():
                messages.error(request, pickle.dumps({key: value}))

            redirection = exception.get_redirect()
            return HttpResponseNotModifiedRedirect(resolve_url(redirection['name'], **redirection['vars']))