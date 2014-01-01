from django.http.response import HttpResponseRedirectBase

class HttpResponseNotModifiedRedirect(HttpResponseRedirectBase):
    status_code = 303