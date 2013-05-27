from django.utils.datastructures import MultiValueDict

class HttpMergeParameters(object):
    def process_request(self, request):
        if request.method.lower() == 'GET':
            base = request.POST
            override = request.GET
        else:
            base = request.GET
            override = request.POST

        request.params = MultiValueDict(dict(base, **override))


class HttpMethodOverride(object):
    def process_request(self, request):
        if 'HTTP_X_HTTP_METHOD' in request.META:  # (Microsoft)
            request.method = request.META['HTTP_X_HTTP_METHOD']
            return
        elif 'HTTP_X_HTTP_METHOD_OVERRIDE' in request.META:  # (Google/GData)
            request.method = request.META['HTTP_X_HTTP_METHOD_OVERRIDE']
            return
        elif 'X_METHOD_OVERRIDE' in request.META:  # (IBM)
            request.method = request.META['X_METHOD_OVERRIDE']
            return
        elif 'X-Method' in request.params:  # custom
            request.method = request.params.get('X-Method')
            return


class ResponseFormatDetection(object):
    def _expected_types(self, request):
        header = request.META.get('HTTP_ACCEPT', '*/*')
        header = request.params.get('X-Accept', header)
        header_types = header.split(',')
        clean_types = []
        for type in header_types:
            type = type.strip()
            if type.find(';') > 0:
                type = type[0:type.find(';')]
            clean_types.append(type)

        return clean_types

    def process_template_response(self, request, response):
        expected = self._expected_types(request)
        json_types = ['application/json']
        csv_types = ['text/comma-separated-values', 'text/csv', 'application/csv']

        # todo think of adding Content-Disposition: like
        # Content-Disposition: attachment; filename="download.csv"
        if len(filter(set(expected).__contains__, json_types)) > 0:
            ext = '.json'
            response['Content-Type'] = 'application/json; charset='+response._charset
        elif len(filter(set(expected).__contains__, csv_types)) > 0:
            ext = '.csv'
            response['Content-Type'] = 'text/csv; charset='+response._charset
        else:
            ext = '.html'

        response.template_name += ext
        return response