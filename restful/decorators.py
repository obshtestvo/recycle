import inspect
from functools import wraps

from django.template.response import TemplateResponse
from django.utils.decorators import available_attrs
from django.views.generic.base import View

def restful_template(dirname, name, func=None):
    def decorator(action):
        # maintain correct stacktrace name and doc
        @wraps(action, assigned=available_attrs(action))
        def _restful(obj, request, *args, **kwargs):
            template = dirname + '/' + name
            data = action(obj, request, *args, **kwargs)
            if not (isinstance(data, tuple) or isinstance(data, dict)):
                return data
            status = 200
            if isinstance(data, tuple):
                status = data[1]
                data = data[0]
            return TemplateResponse(request, template, data, status=status)
        return _restful

    if func:
        return decorator(func)

    return decorator

def restful_view_templates(dirname):
  def dectheclass(cls):
    for name, m in inspect.getmembers(cls, inspect.ismethod):
        if name in View.http_method_names:
            setattr(cls, name, restful_template(dirname, name, func=m))
    return cls
  return dectheclass