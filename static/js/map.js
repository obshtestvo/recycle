// Enable the visual refresh
google.maps.visualRefresh = true;
// Shortcut/alias
var gMap = google.maps;
// App context
var app = {
    map: null
}


var Map = function($el, centerLoc, geoServices,  callback)
{
    // Init vars
	var _self = this;
	_self.filtered_markers = [];
	_self.geo = geoServices;

    // Init map
    var centerLoc = centerLoc || $el.data('center');
    centerLoc = new gMap.LatLng(centerLoc.lat, centerLoc.lng);
	_self.map = _self._createMap($el.get(0), {
        center: centerLoc
    })
    callback = callback || $.noop;
    callback(_self.map);
}

Map.prototype = {
    map: null,
    addNewPopup: null,
    markerCluster: null,
    geo: null,
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

	}
}

/**
 * Boot...
 */
// Wait for DOM
var DOM = $.Deferred()
$(function() {DOM.resolve()})
// Wait for HTML5 Geo-loc
var GeoDetection = $.Deferred();
geoServices.human.detectUser(GeoDetection.resolve)

// When both DOM and Geo-loc are ready
$.when(GeoDetection, DOM).then(function(coords) {
    // Init infowindow
    var infoTemplate = $('.infowindow-add-template');
    var infoContent = infoTemplate.html();
    infoTemplate.remove();
    var $map = $('#map-canvas');
    var $addressSearch = $('#addressSearch');
    app.map = new Map($map, coords, geoServices, function(map) {
        var addressIgnore = $map.data('addressIgnore');
        geoServices.human.convertToAddress(map.getCenter(), function(err, address) {
            if (!err) {
                var city = []
                if (address.city) {
                    $.each(address.city.split(','), function(i, cityPart) {
                    if ($.inArray($.trim(cityPart), addressIgnore)==-1)
                        city.push(cityPart)
                    })
                }
                $addressSearch.val(city.join(', '))
            }
            new AddressSearch($addressSearch, map)
        })
    });

    var $triggerAddNew = $('.floater a.add-new');
    var infoWindowCloseListener = null;
    // Once the "Add new spot" mode has been activated
    $triggerAddNew.click(function (e) {
        e.preventDefault();
        if ($triggerAddNew.hasClass('active')) {
            gMap.event.removeListener(infoWindowCloseListener);
            app.map.addNewPopup.destroy()
            app.map.addNewPopup = null;
            infoWindowCloseListener = null;
            $triggerAddNew.removeClass('active');
            return;
        }
        $triggerAddNew.addClass('active');
        app.map.addNewPopup = new PopupAddNew({ map: app.map.map, content: infoContent, geo: geoServices});
        infoWindowCloseListener = gMap.event.addListener(app.map.addNewPopup.infowindow, 'closeclick', function () {
            $triggerAddNew.removeClass('active')
        });
    })

    var $filter = $('.floater select');
    var $filterForm = $filter.closest('form');
    $filter.select2({})

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
