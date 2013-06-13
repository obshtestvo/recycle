var Map = function()
{
	var _self = this;
	_self.$elements = {}
	_self.map = new google.maps.Map(document.getElementById('map-canvas'),  { 
		zoom: 12,
        minZoom: 7,
        center: new google.maps.LatLng(42.693413, 23.322601),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            }
        ]});
	
	var html = '<div id="add-new">' +
					'Тука ще е първа стъпка от Wizard-а за добавяне' +
					'<div id="step1">' +
						'<div id="streetview">' +
						'</div>' +
					'</div>' +
				'</div>';

	_self.infowindow = new google.maps.InfoWindow({
		content: html
	});
	
	_self.streetview = null;
	google.maps.event.addListener(infowindow, 'domready', function () {
        _self.streetview = new google.maps.StreetViewPanorama(document.getElementById("streetview"), {
            navigationControl: true,
            navigationControlOptions: {style: google.maps.NavigationControlStyle.ANDROID},
            enableCloseButton: false,
            addressControl: false,
            linksControl: false
        });

		_self.$elements.streetview = $('#streetview');
        _self.streetview.bindTo("position", _self.marker);
		_self.checkStreetview(_self.marker.getPosition());

    });

    google.maps.event.addListener(infowindow, 'closeclick', function () {
        _self.streetview.unbind("position");
        _self.streetview.setVisible(false);
        _self.streetview = null;
		_self.marker.setMap(null);
        _self.marker = null;
    });
	
	_self.marker = null;
	_self.add_marker = function(location)
	{
        if (_self.marker != null) 
		{
            _self.marker.animateTo(location, {
                easing: "easeOutCubic",
                duration: 300
            });
            return;
        }
        _self.marker = new google.maps.Marker({
            position: location,
            animation: google.maps.Animation.b,
            draggable: true,
//            title: "My new marker",
            icon: {
                url: '/img/pointer.png',
                size: new google.maps.Size(64, 64),
                // The origin for this image is 0,0.
                origin: new google.maps.Point(0, 0),
                // The anchor for this image is the base of the flagpole at 0,32.
                anchor: new google.maps.Point(23, 63)
            },
            map: _self.map
        });

        setTimeout(function () 
		{

 			infowindow.open(_self.map, _self.marker);

        }, 200);
	}
	_self.filtered_markers = [];
	_self.markerCluster = null;
	_self.populateMarkers = function(data, filters)
	{	

 		while(_self.filtered_markers.length)
		{
        	filtered_markers.pop().setMap(null);
        }

		if(_self.markerCluster)
		{
			_self.markerCluster.clearMarkers();
		}

		if(typeof filters == "undefined")
		{
			filters = [];
			for(i in data)
			{
				filters.push(i);
			}
		}
		var filtered_data = [];
		for(i in filters)
		{
			for (d in data[filters[i]])
			{
				filtered_data.push(data[filters[i]][d]);
			}
		}

        $.each(filtered_data, function(i, loc) {
            m = new google.maps.Marker({
                position: new google.maps.LatLng(loc.lat, loc.lng),
                animation: google.maps.Animation.b,
                draggable: false,
                map: map
            });
			_self.filtered_markers.push(m);
			
		});

        _self.markerCluster = new MarkerClusterer(_self.map, _self.filtered_markers);

	}
	_self.streetview_service = new google.maps.StreetViewService();
	_self.checkStreetview = function(latLng)
	{
		_self.streetview_service.getPanoramaByLocation(latLng, 100, function(result, status)
		{
		    if (status == google.maps.StreetViewStatus.OK)
			{
				_self.$elements.streetview.show();
				_self.streetview.setVisible(true);
		    }
			else
			{
				_self.$elements.streetview.hide();
	        	_self.streetview.setVisible(false);
			}
      	});
	}
	google.maps.event.addListener(_self.map, 'click', function (event) 
	{
	    _self.add_marker(event.latLng);
		//this is how we access the streetview params _self.streetview.pov
		
		if(_self.marker != null)
		{
			_self.checkStreetview(_self.marker.getPosition());
			console.log(_self.marker.getPosition().toUrlValue())
		}
		
	});

}

google.maps.event.addDomListener(window, 'load', Map);

$(function () {
    var $triggerAddNew = $('.floater a.add-new');

    // Once the "Add new spot" mode has been activated
    $triggerAddNew.click(function () {
        map.setOptions({draggableCursor: 'pointer'});
    })

    var $filter = $('.floater select');
    var $filterForm = $filter.closest('form');
    $filter.select2({
    })
	
    var spotInfoWindow = new google.maps.InfoWindow();
    var recyclables = $filter.data('recyclables');
	
	var all_markers;
    $.get($filterForm.data('action'), {}, function (data) {
		all_markers = data;
		populateMarkers(data);
    }, 'json');

    $filter.change(function (e) {
        var tags = []
        $.each(e.val, function (i, tag) {
            tag = recyclables[tag]
            if ($.inArray(tag, tags) == -1) tags.push(tag)
        });
		populateMarkers(all_markers, tags);
//                google.maps.event.addListener(marker, 'click', (function (marker, i) {
//                    return function () {
//                        spotInfoWindow.setContent(locations[i][0]);
//                        spotInfoWindow.open(map, marker);
//                    }
//                })(marker, i));
    })
});
