// Shortcut/alias
var gMap = google.maps;

// Enable the visual refresh
gMap.visualRefresh = true;

// App context
var app = {
    map: null,
    userAddress: null,
    locationWizard: null
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
    var addressIgnore = $map.data('addressIgnore');

    app.map = new Map( $map, geoServices, {
        callback: function(map) {initialisingMap.resolve(map)}
    });

    // Get current human-friendly address of the center of the map and display the city
    initialisingMap.then(function(map) {
        geoServices.human.convertToAddress(map.getCenter(), function(err, address) {
            if (!err) {
                var city = address.city == null ? '': address.city;
                app.userAddress.turnOffChange(city)
                retrievingFirstMapAddress.resolve();
            }
        })
    });


    // User Address
    var $userAddressArea = $('div.change-address');
    $.when(initialisingMap).then(function(map) {
        app.userAddress = new UserAddress($userAddressArea, geoServices, map, {
            ignoredAddressParts: addressIgnore
        })
        $userAddressArea
            .on('show', function() {
                $search.addClass('hide')
            })
            .on('hide', function() {
                $search.removeClass('hide')
            })
            .on('found', function() {
                if (!app.map.hasVisibleMarkers()) {
                    app.map.locationManager.topUp(function(locations) {
                        //@todo merge with markers registry in app.map.markers
                    })
                }
            })
    })

    // Detect location if allowed and move map to new coordinates
    $.when(initialisingMap, retrievingGeoDetection, retrievingFirstMapAddress).then(function(map, loc) {
        map.setCenter(loc);
        if (!app.map.hasVisibleMarkers()) {
            app.map.locationManager.topUp(function(locations) {
                //@todo merge with markers registry in app.map.markers
            })
        }
        geoServices.human.convertToAddress(loc, function(err, address) {
            if (!err) {
                var city = address.city == null ? '': address.city;
                app.userAddress.turnOffChange(city)
                app.userAddress.update(loc.toUrlValue(), address.full)
            }
        })
    })

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

    // app.locationWizard: "Add new location" wizard
    var $newLocationArea = $('div.add-new');
    $.when(initialisingMap).then(function(map) {
        app.locationWizard = new LocationWizard($newLocationArea, geoServices, map, {
            ignoredAddressParts: addressIgnore,
            template: LocationWizard.extractTemplateFrom('.infowindow-add-template', true)
        })
        $newLocationArea
            .on('found', function(e, text, loc, addressInfo) {
                if (!app.map.hasVisibleMarkers()) {
                    app.map.locationManager.topUp(function(locations) {
                        //@todo merge with markers registry in app.map.markers
                    })
                }
            })
            .on('show', function(e, text, loc, addressInfo) {
                $search.addClass('hide')
                app.map.locationManager.close()
                app.map.locationManager.pause()
            })
            .on('hide', function(e, text, loc, addressInfo) {
                $search.removeClass('hide')
                app.map.locationManager.resume()
            })
    })
});
