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
    $filter.select2({
        formatNoMatches: function(searchTerm) {
            return $filter.data('noMatches').replace('__material__', "'"+searchTerm+"'")
        },
        formatSelection: function(item) {
            return item.id
        }
    })

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
    $.when(initialisingMap).then(function(map) {
        app.userAddress = new UserAddress($('div.change-address'), geoServices, map, {
            ignoredAddressParts: addressIgnore
        })
        app.userAddress
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

    // When map is panned calcualte width and height
    $.when(initialisingMap).then(function(map) {
        var layer = new gMap.StreetViewCoverageLayer()
        layer.setMap(map)
        gMap.event.addListener(map, 'drag', function () {
            var mapBounds = map.getBounds();
            var diagonalDistance = gMap.geometry.spherical.computeDistanceBetween(
                mapBounds.getNorthEast(),
                mapBounds.getSouthWest()
            )
            var humanFriendly = Math.round(diagonalDistance)+'meters';
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
            //@todo standartise this with the merge of markers after a topup
            app.map.markers = locations.markers;
        })

        // Filter spots down to selected tags
        $filter.change(function () {
            app.map.locationManager.filterLocations()
        })
    })

    // app.locationWizard: "Add new location" wizard
    $.when(initialisingMap).then(function(map) {
        app.locationWizard = new LocationWizard($('div.add-new'), geoServices, map, {
            ignoredAddressParts: addressIgnore,
            template: LocationWizard.extractTemplateFrom('.infowindow-add-template', true)
        })
        app.locationWizard
            .on('move', function() {
                if (!app.map.hasVisibleMarkers()) {
                    app.map.locationManager.topUp(function(locations) {
                        //@todo merge with markers registry in app.map.markers
                    })
                }
            })
            .on('show', function() {
                $search.addClass('hide')
                app.map.locationManager.close()
                app.map.locationManager.pause()
            })
            .on('hide', function() {
                $search.removeClass('hide')
                app.map.locationManager.resume()
            })
    })
});
