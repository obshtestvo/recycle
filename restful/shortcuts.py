import pickle

from django.contrib.messages.api import get_messages, constants

def errors(request):
    errors = {}
    for message in get_messages(request):
        if message.level == constants.ERROR:
            errors = dict(errors,**pickle.loads(message.message))
    return errors