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

    // Wait map to be idle/ready and trigger callback
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
                style: gMap.ZoomControlStyle.SMALL
            },
            zoom: 13,
            minZoom: 7,
            streetViewControl: false,
            backgroundColor: '#B2F7A6',
            mapTypeId: gMap.MapTypeId.ROADMAP
        }, options);

        var map = new gMap.Map(el,options);
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
 * Booting application.
 *
 * Waiting for various processes or services to finish loading and then trigger the correct actions
 */

// Wait for DOM
var initialisingDOM = $.Deferred()
$(function() {initialisingDOM.resolve()})

// Wait for HTML5 Geo-loc
var retrievingGeoDetection = $.Deferred();
geoServices.human.detectUser(retrievingGeoDetection.resolve)

// Wait for Map
var initialisingMap = $.Deferred();

// Wait for initial human friendly address of the center of the map
var retrievingFirstMapAddress = $.Deferred();


// When DOM is ready
$.when(initialisingDOM).then(function() {
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
    app.map = new Map($map, undefined, geoServices, function(map) {initialisingMap.resolve(map)});

    // User address search
    var turnOffAddressChange = function(text) {
        if (text) {
            $addressDisplay.find('em').text(geoServices.human.cleanAddress(text, addressIgnore))
        }
        $changeAddress.addClass('hide')
        $search.removeClass('hide')
    }

    // Get current human-friendly address of the center of the map and display the city
    initialisingMap.then(function(map) {
        geoServices.human.convertToAddress(map.getCenter(), function(err, address) {
            if (!err) {
                var city = address.city == null ? '': address.city;
                turnOffAddressChange(city)
                retrievingFirstMapAddress.resolve();
            }
        })
    });

    // Add the user address search
    initialisingMap.then(function(map) {
        app.addressSearch = new AddressSearch($addressSearch, map)
        $addressSearch.bind('found', function(e, text) {
            turnOffAddressChange(text);
            if (!app.map.hasVisibleMarkers()) {
                app.map.locationManager.topUp(function(locations) {
                    //@todo merge with markers registry in app.map.markers
                })
            }
        })
    });

    // Take care of showing locations on the map
    $.when(initialisingMap).then(function(map) {
        // "Show location details" infowindow template
        var infoTemplate = $('.infowindow-show-template');
        var infoContent = infoTemplate.html();
        infoTemplate.remove();

        var recyclables = $filter.data('recyclables');
        var recycle = new RecycleServices($filterForm.data('action'), $filter, recyclables);
        app.map.locationManager = new LocationManager(map, recycle, infoContent);

        // Find all spots in radius of 20km from the center of the map
        app.map.locationManager.loadLocations({
            "coords": map.getCenter().toUrlValue()
        }, function(locations) {
            app.map.markers = locations.markers;
        })

        // Filter spots down to selected tags
        $filter.change(function () {
            app.map.locationManager.filterLocations()
        })
    })


    // Detect location if allowed and move map to new coordinates
    $.when(initialisingMap, retrievingGeoDetection, retrievingFirstMapAddress).then(function(map, loc) {
        map.setCenter(loc);
        //@todo load locations if none on map
        geoServices.human.convertToAddress(loc, function(err, address) {
            if (!err) {
                var city = address.city == null ? '': address.city;
                turnOffAddressChange(city)
                $addressSearch.select2("data", {id: loc.toUrlValue(), text: address.full});
            }
        })
    })

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
        $addressNewSearch.bind('found', function(e, text, loc, addressInfo) {
            app.map.addNewPopup.marker.setPosition(loc);
            app.map.addNewPopup.checkStreetView(loc);
            app.map.addNewPopup.addressInfo = addressInfo;
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
    var markerMoveListener = null;
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
        var initialLocation = geoServices.map.getProportionallyRelativeLocation(app.map.map, {bottom: 10, left:50});
        var updateAddNewAddressFromMap = function(loc) {
            geoServices.human.convertToAddress(loc, function(err, address) {
                if (!err) {
                    app.map.addNewPopup.addressInfo = address.components;
                    $addressNewSearch.select2("data", {id: initialLocation.toUrlValue(), text: address.full});
                }
            }, true)
        }

        $triggerAddNew.addClass('active');
        $addNewInfo.removeClass('hide')
        $search.addClass('hide')
        app.map.addNewPopup = new PopupAddNew({ map: app.map.map, content: infoContent, geo: geoServices, location: initialLocation}, function(popup) {
            markerMoveListener = gMap.event.addListener(popup.marker, 'position_changed_custom', function () {
                console.log('check',Math.random())
                updateAddNewAddressFromMap(popup.marker.getPosition());
            });
            infoWindowCloseListener = gMap.event.addListener(popup.infowindow, 'closeclick', function () {
                $triggerAddNew.removeClass('active')
                $addressNewSearch.blur()
                $addNewInfo.addClass('hide')
                $search.removeClass('hide')
                gMap.event.removeListener(infoWindowCloseListener);
                gMap.event.removeListener(markerMoveListener);

            });
        });
    })
    $addNewInfo.find('a.close').click(function(e) {
        e.preventDefault();
        cancelAddNew();
    })
});
