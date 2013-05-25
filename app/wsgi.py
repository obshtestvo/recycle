import os, sys
sys.path.append('/home/kris/Work/python/Django/mysite/')
sys.path.append('/home/kris/Work/python/Django/mysite/app')


os.environ['DJANGO_SETTINGS_MODULE'] = 'app.settings'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()
