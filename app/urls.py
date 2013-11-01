from django.conf.urls import patterns, include, url

from ecomap.views import spots, home

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', home.HomeView.as_view(), name='home'),
    url(r'^spots/(?P<spot_id>\d+)/$', spots.RecycleSpotsView.as_view()),
    url(r'^spots/$', spots.RecycleSpotsView.as_view(), name='spots'),
	url(r'^static/(?P<path>.*)$', 'django.contrib.staticfiles.views.serve'),

    # url(r'^mysite/', include('mysite.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)



    
