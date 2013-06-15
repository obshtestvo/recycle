// Enable the visual refresh
google.maps.visualRefresh = true;
// Shortcut/alias
var gMap = google.maps;
// App context
var app = {
    map: null
}

var Map = function($el, centerLoc)
{
    // Init vars
	var _self = this;
    _self.geocoder = new gMap.Geocoder();
	_self.streetview_service = new gMap.StreetViewService();
	_self.filtered_markers = [];
	_self.$elements = {}

    // Init map
    var centerLoc = centerLoc || $el.data('center');
	_self.map = _self._createMap($el.get(0), {
        center: new gMap.LatLng(centerLoc.lat, centerLoc.lng)
    })
    // Init infowindow
    var infoTemplate = $('.infowindow-add-template');
    var infoContent = infoTemplate.html();
    infoTemplate.remove();
	_self.infowindow = _self._createInfoWindow({
		content: infoContent
    }, function() {
        _self.$elements.streetview = $('#streetview');
        _self.streetview = _self._createStreetView(_self.$elements.streetview.get(0), {})
        _self.streetview.bindTo("position", _self.marker);
		_self.checkStreetView(_self.marker.getPosition());
    })

    gMap.event.addListener(this.infowindow, 'closeclick', function () {
        _self.streetview.unbind("position");
        _self.streetview.setVisible(false);
        _self.streetview = null;
		_self.marker.setMap(null);
        _self.marker = null;
    });

	gMap.event.addListener(_self.map, 'click', function (event)
	{
        if (_self.marker == null) return;
		//this is how we access the streetview params _self.streetview.pov
        _self._animateMarker(_self.marker, event.latLng, function() {
                _self.checkStreetView(_self.marker.getPosition());
//                console.log(_self.marker.getPosition().toUrlValue(), _self.marker.getPosition())
        });
	});
    _self._createAutoComplete($('#addressSearch').get(0))
}

Map.prototype = {
    streetview_service: null,
    geocoder: null,
    streetview: null,
    $elements: null,
    map: null,
    marker: null,
    markerCluster: null,
    /**
     * Creates a map
     *
     * @param el DOM element
     * @param options Google map options
     * @returns {gMap.Map}
     * @private
     */
    _createMap: function(el, options) {
        var options = $.extend({
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL
            },
            zoom: 13,
            minZoom: 7,
            streetViewControl: false,
            backgroundColor: '#B2F7A6',
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }, options);
        var map = new google.maps.Map(el,options);
        var styles = [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            },
            {
                featureType: "road",
                elementType: "all",
                stylers: [
                    { visibility: "on" }
                ]
            }
        ];
        var mapType = new google.maps.StyledMapType(styles, {name: "Recycle Style"});
        map.mapTypes.set("Recycle Style", mapType);
        map.setMapTypeId("Recycle Style");
        return map;
    },
    /**
     * Creates an infowindow
     *
     * @param options Infowindow options
     * @param callback (optional)
     * @returns {gMap.InfoWindow}
     * @private
     */
    _createInfoWindow: function(options, callback) {
        var options = $.extend({}, options)
        var infoWindow = new gMap.InfoWindow(options);
        if ($.isFunction(callback)) {
	        gMap.event.addListener(infoWindow, 'domready', callback);
        }
        return infoWindow;
    },
    /**
     * Creates a streetview obj
     *
     * @param el DOM el
     * @param options
     * @returns {gMap.StreetViewPanorama}
     * @private
     */
    _createStreetView: function(el, options) {
        var options = $.extend({
            navigationControl: false,
            enableCloseButton: false,
            addressControl: false,
            linksControl: false
        }, options)
        return new gMap.StreetViewPanorama(el, options);
    },
    showAddNew: function(location) {
        var _self = this;
        _self.addMarker(location);
        gMap.event.addListener(_self.marker, "dragend", function (event) {
            _self.checkStreetView(_self.marker.getPosition());
        });
    },
    /**
     * Add a marker
     * @param location LatLng location
     * @param options (optional)
     */
    addMarker: function(location, options)
	{
        var _self = this;
        var options = $.extend({
            position: location,
            animation: gMap.Animation.b,
            draggable: true,
            icon: {
                url: '/img/pointer.png',
                size: new gMap.Size(64, 64),
                // The origin for this image is 0,0.
                origin: new gMap.Point(0, 0),
                // The anchor for this image is the base of the flagpole at 0,32.
                anchor: new gMap.Point(23, 63)
            },
            map: _self.map
        }, options)
        _self.marker = new gMap.Marker(options);
        _self.infowindow.open(_self.map, _self.marker);
	},
    _animateMarker: function(marker, location, callback) {
        marker.animateTo(location, {
            easing: "easeOutCubic",
            duration: 300,
            complete: callback
        });
    },
    populateMarkers: function(data, filters)
	{
        var _self = this;

 		while(_self.filtered_markers.length)
        	filtered_markers.pop().setMap(null);

		if(_self.markerCluster)
			_self.markerCluster.clearMarkers();

		if($.type(filters) == "undefined")
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
            var m = new gMap.Marker({
                position: new gMap.LatLng(loc.lat, loc.lng),
                animation: gMap.Animation.b,
                draggable: false,
                map: _self.map
            });
			_self.filtered_markers.push(m);

		});

        _self.markerCluster = new MarkerClusterer(_self.map, _self.filtered_markers);

	},
    checkStreetView: function(location)
	{
        var _self = this;
		_self.streetview_service.getPanoramaByLocation(location, 50, function(result, status)
		{
		    if (status == gMap.StreetViewStatus.OK)
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
	},
    /**
     * Get address based on coordinates
     *
     * @param latLng
     * @param callback In the form callback(err, data)
     */
    fetchAddress: function(latLng, callback) {
        geocoder.geocode({
            latLng: event.latLng
        }, function (results, status) {
            if (status == gMap.GeocoderStatus.OK) {
                callback(null, results[0]['formatted_address']);
            } else {
                callback(status, results);
            }
        });
    },

    _createAutoComplete: function(el, options) {
        var _self = this;
        var autocomplete = new google.maps.places.Autocomplete(el);
        autocomplete.bindTo('bounds', _self.map);
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            el.className = '';
            var place = autocomplete.getPlace();
            // Inform the user if the place was not found.
            if (!place.geometry) {
                el.className = 'notfound';
                console.log('notfound')
                return;
            }
            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
                _self.map.fitBounds(place.geometry.viewport);
            } else {
                _self.map.setCenter(place.geometry.location);
                _self.map.setZoom(17);  // Why 17? Because it looks good.
            }
            // Ahhh... building up address from address components instead of formatted_address?
            var address = '';
            if (place.address_components) {
                console.log([
                    (place.address_components[0] && place.address_components[0].short_name || ''),
                    (place.address_components[1] && place.address_components[1].short_name || ''),
                    (place.address_components[2] && place.address_components[2].short_name || '')
                ].join(' '));
            }
            //@todo ajax query for new points
        })
    }
}
// Wait for DOM
var DOM = $.Deferred()
$(function() {DOM.resolve()})
// Wait for HTML5 Geo-loc
var GeoDetection = $.Deferred();
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(loc){
        GeoDetection.resolve({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude
        })
    }, function() {
        GeoDetection.resolve();
    });
} else {
    GeoDetection.resolve();
}

// When both DOM and Geo-loc are ready
$.when(GeoDetection, DOM).then(function(coords) {
    app.map = new Map($('#map-canvas'), coords);

    var $triggerAddNew = $('.floater a.add-new');
    // Once the "Add new spot" mode has been activated
    $triggerAddNew.click(function (e) {
        e.preventDefault();
        $triggerAddNew.addClass('active');
        app.map.map.setOptions({draggableCursor: 'pointer'});
        var mapBounds = app.map.map.getBounds();
        var latPortion = (mapBounds.getNorthEast().lat()- mapBounds.getSouthWest().lat())/10;
        app.map.showAddNew(new gMap.LatLng(mapBounds.getSouthWest().lat() + latPortion, app.map.map.getCenter().lng()));
    })

    var $filter = $('.floater select');
    var $filterForm = $filter.closest('form');
    $filter.select2({
    })

    var spotInfoWindow = new gMap.InfoWindow();
    var recyclables = $filter.data('recyclables');

	var all_markers;
    $.get($filterForm.data('action'), {
        coords: coords
    }, function (data) {
		all_markers = data;
		app.map.populateMarkers(data);
    }, 'json');

//    $filter.change(function (e) {
//        var tags = []
//        $.each(e.val, function (i, tag) {
//            tag = recyclables[tag]
//            if ($.inArray(tag, tags) == -1) tags.push(tag)
//        });
//		populateMarkers(all_markers, tags);
//                gMap.event.addListener(marker, 'click', (function (marker, i) {
//                    return function () {
//                        spotInfoWindow.setContent(locations[i][0]);
//                        spotInfoWindow.open(map, marker);
//                    }
//                })(marker, i));
//    })
});
