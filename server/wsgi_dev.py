import os
import uwsgi
from uwsgidecorators import timer
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

from django.utils import autoreload

@timer(2)
def change_code_gracefull_reload(sig):
    if autoreload.code_changed():
        uwsgi.reload()

from django.contrib.staticfiles.handlers import StaticFilesHandler
from django.core.wsgi import get_wsgi_application

application = StaticFilesHandler(get_wsgi_application())

