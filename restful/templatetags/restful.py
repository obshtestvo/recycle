import json

from django.core.serializers import serialize
from django.db.models.query import QuerySet
from django import template
from django.utils import safestring

register = template.Library()

@register.filter(name='jsonify')
def jsonify(object):
    if isinstance(object, QuerySet):
        return serialize('json', object)
    return safestring.mark_safe(json.dumps(object))