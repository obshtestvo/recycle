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
    /**
     * Check for visible markers on the map
     * @returns {boolean}
     */
    hasVisibleMarkers: function() {
        var _self = this;
        var markers = _self.markers;
        var bounds = _self.google.getBounds();
        var contain = false;
        $.each(markers, function(i, m) {
            if (m.getVisible() && bounds.contains(m.getPosition())) {
                contain = true;
                return false;
            }
        })
        return contain;
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
// Wait for Map
var initialisingMap = $.Deferred();
// When both DOM and Geo-loc are ready
$.when(GeoDetection, DOM).then(function(coords) {
    // Materials tags
    var $search = $('#search');
    var $filter = $search.find('select');
    var $filterForm = $filter.closest('form');
    $filter.select2({})

    // Map
    var $map = $('#map-canvas');
    var $changeAddress = $('div.change-address');
    var $addressSearch = $('input.address');
    var $addressDisplay = $('div.address');
    var addressDisplayAutocompleteEvent = null;
    var addressAddNewAutocompleteEvent = null;
    var addressIgnore = $map.data('addressIgnore');
    var $addNewInfo = $('div.add-new');
    var $addressNewSearch = $addNewInfo.find('input.new-address');
    app.map = new Map($map, coords, geoServices, function(map) {initialisingMap.resolve(map)});
    var turnOffAddressChange = function() {
        $changeAddress.addClass('hide')
        $addressDisplay.find('em').text(geoServices.human.cleanAddress($addressSearch.val(), addressIgnore))
        $search.removeClass('hide')
    }
    initialisingMap.then(function(map) {
        geoServices.human.convertToAddress(map.getCenter(), function(err, address) {
            if (!err) {
                var city = address.city == null ? '': address.city;
                $addressDisplay.find('em').text(geoServices.human.cleanAddress(city, addressIgnore))
            }
            app.addressSearch = new AddressSearch($addressSearch, map)
            addressDisplayAutocompleteEvent = gMap.event.addListener(app.addressSearch.autocomplete, 'place_changed', turnOffAddressChange)
        })
    });
    $changeAddress.find('a.close').click(function(e) {
        e.preventDefault();
        turnOffAddressChange()
    })
    initialisingMap.then(function(map) {
        app.addressNewSearch = new AddressSearch($addressNewSearch, map)
        addressAddNewAutocompleteEvent = gMap.event.addListener(app.addressNewSearch.autocomplete, 'place_changed', function() {
            app.map.addNewPopup.marker.setPosition(geoServices.map.getProportionallyRelativeLocation(app.map.map, {bottom: 10, left:50}))
        })
    })
    var $addressChangeTrigger = $addressDisplay.find('a.change');
    $addressChangeTrigger.click(function(e) {
        e.preventDefault();
        $search.addClass('hide')
        $changeAddress.removeClass('hide')
        $addressSearch.focus()
    })

    // "Add new" infowindow template
    var infoTemplate = $('.infowindow-add-template');
    infoTemplate.find('.step.hide').css('display', 'none').removeClass('hide')
    var infoContent = infoTemplate.html();
    infoTemplate.remove();

    // Triggers for "Add new" popup
    var $triggerAddNew = $('.floater a.add-new');
    var infoWindowCloseListener = null;
    var cancelAddNew = function() {
        gMap.event.removeListener(infoWindowCloseListener)
        infoWindowCloseListener = null;
        app.map.addNewPopup.destroy()
        app.map.addNewPopup = null;
        $triggerAddNew.removeClass('active');
        $addressNewSearch.blur()
        $addNewInfo.addClass('hide')
        $search.removeClass('hide')
    }
    // Once the "Add new spot" mode has been activated
    $triggerAddNew.click(function (e) {
        e.preventDefault();
        if ($triggerAddNew.hasClass('active')) {
            cancelAddNew();
            return;
        }
        $triggerAddNew.addClass('active');
        $addNewInfo.removeClass('hide')
        $search.addClass('hide')
        app.map.addNewPopup = new PopupAddNew({ map: app.map.map, content: infoContent, geo: geoServices}, function() {
            infoWindowCloseListener = gMap.event.addListener(app.map.addNewPopup.infowindow, 'closeclick', function () {
                $triggerAddNew.removeClass('active')
                $addressNewSearch.blur()
                $addNewInfo.addClass('hide')
                $search.removeClass('hide')
            });
        });
    })
    $addNewInfo.find('a.close').click(function(e) {
        e.preventDefault();
        cancelAddNew();
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
