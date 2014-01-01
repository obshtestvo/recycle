from django.conf.urls import patterns, include, url

from ecomap.views import spots, spot, home

# Uncomment the next two lines to enable the admin:
from ecomap.admin import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', home.HomeView.as_view(), name='home'),
    url(r'^spots/$', spots.RecycleSpotsView.as_view(), name='spots'),
    url(r'^spot/$', spot.RecycleSpotView.as_view(), name='spot'),

    # url(r'^mysite/', include('mysite.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
