// Enable the visual refresh
google.maps.visualRefresh = true;
// Shortcut/alias
var gMap = google.maps;
// App context
var app = {
    map: null
}


var Map = function($el, centerLoc, geoServices, callback)
{
    // Init vars
	var _self = this;
	_self.geo = geoServices;

    // Init map
    centerLoc = centerLoc || $el.data('center');
    centerLoc = new gMap.LatLng(centerLoc.lat, centerLoc.lng);
	_self.map = _self._createMap($el.get(0), {
        center: centerLoc
    })
    callback = callback || $.noop;
    var onReady = gMap.event.addListener(_self.map, 'idle', function(){
        callback(_self.map);
        gMap.event.removeListener(onReady);
    })
}

Map.prototype = {
    map: null,
    addNewPopup: null,
    markerCluster: null,
    locationManager: null,
    geo: null,
    markers: [],
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
        var bounds = _self.map.getBounds();
        var contain = false;
        $.each(markers, function(i, m) {
            if (m.getVisible() && bounds.contains(m.getPosition())) {
                contain = true;
                return false;
            }
        })
        return contain;
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
    var addressIgnore = $map.data('addressIgnore');
    var $addNewInfo = $('div.add-new');
    var $addressNewSearch = $addNewInfo.find('input.new-address');
    app.map = new Map($map, coords, geoServices, function(map) {initialisingMap.resolve(map)});


    // Locations on the map
    initialisingMap.then(function(map) {
        // "Add new location" infowindow template
        var infoTemplate = $('.infowindow-show-template');
        var infoContent = infoTemplate.html();
        infoTemplate.remove();

        var recyclables = $filter.data('recyclables');
        var recycle = new RecycleServices($filterForm.data('action'), $filter, recyclables);
        app.map.locationManager = new LocationManager(map, recycle, infoContent);
        console.log(coords, 'ha! undefined')
        // Find all spots in radius of 20km from the center of the map
        app.map.locationManager.loadLocations({
            "coords": coords
        }, function(locations) {
            app.map.markers = locations.markers;
        })

        // Filter spots down to selected tags
        $filter.change(function () {
            app.map.locationManager.filterLocations()
        })
    })


    // User address search
    var turnOffAddressChange = function(text) {
        if (text) {
            $addressDisplay.find('em').text(geoServices.human.cleanAddress(text, addressIgnore))
        }
        $changeAddress.addClass('hide')
        $search.removeClass('hide')
    }
    initialisingMap.then(function(map) {
        geoServices.human.convertToAddress(map.getCenter(), function(err, address) {
            if (!err) {
                var city = address.city == null ? '': address.city;
                $addressDisplay.find('em').text(geoServices.human.cleanAddress(city, addressIgnore))
            }
            app.addressSearch = new AddressSearch($addressSearch, map)
            $addressSearch.bind('found', function(e, text) {
                turnOffAddressChange(text);
                if (!app.map.hasVisibleMarkers()) {
                    app.map.locationManager.topUp(function(locations) {
                        //@todo merge with markers registry in app.map.markers
                    })
                }
            })
        })
    });
    $changeAddress.find('a.close').click(function(e) {
        e.preventDefault();
        turnOffAddressChange()
    })
    var $addressChangeTrigger = $addressDisplay.find('a.change');
    $addressChangeTrigger.click(function(e) {
        e.preventDefault();
        $search.addClass('hide')
        $changeAddress.removeClass('hide')
        app.addressSearch.focus()
    })

    // "Add new location"

    // "Add new location" Address search
    initialisingMap.then(function(map) {
        app.addressNewSearch = new AddressSearch($addressNewSearch, map, function(loc) {
            return geoServices.map.makeProportionallyRelativeLocation(map, loc, {height:30, width:0})
        })
        $addressNewSearch.bind('found', function(e, text, loc) {
            app.map.addNewPopup.marker.setPosition(loc)
            if (!app.map.hasVisibleMarkers()) {
                app.map.locationManager.topUp(function(locations) {
                    //@todo merge with markers registry in app.map.markers
                })
            }
        })
    })

    // "Add new location" infowindow template
    var infoTemplate = $('.infowindow-add-template');
    infoTemplate.find('.step.hide').css('display', 'none').removeClass('hide')
    var infoContent = infoTemplate.html();
    infoTemplate.remove();

    // "Add new location" Triggers for popup
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
    // Once the "Add new location" mode has been activated
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
});
