/**
 * Export
 */
var geoServices;

(function(gMap) {
    /**
     * Location, Camera, Panorama, User detection... all the services
     */
    geoServices = {
        panorama: new gMap.StreetViewService(),
        coder: new gMap.Geocoder(),
        map: {
            /**
             * Get dimensions in coordinates difference
             * @returns {{height: number, width: number}}
             */
            getDimensions: function(map) {
                var mapBounds = map.getBounds();
                var latDiff = mapBounds.getNorthEast().lat() - mapBounds.getSouthWest().lat();
                var lngDiff = mapBounds.getNorthEast().lng() - mapBounds.getSouthWest().lng();
                return {
                    height: latDiff,
                    width: lngDiff
                }
            },
            /**
             * Get a location on the map relative to the bounds by proportion of the map size (in percentages)
             * @returns {gMap.LatLng}
             */
            getProportionallyRelativeLocation: function(map, offset) {
                var defaultOffset = {
                    top: 50,
                    left:50
                }
                offset = offset || defaultOffset;
                var mapDim = geoServices.map.getDimensions(map)
                var mapBounds = map.getBounds();
                var latBase = null;
                var latPercentage = null;
                var lngBase = null;
                var lngPercentage = null;
                if (offset.bottom) {
                    latBase = mapBounds.getSouthWest().lat();
                    latPercentage = offset.bottom;
                } else {
                    latBase = mapBounds.getNorthEast().lat();
                    latPercentage = offset.top;
                }
                if (offset.left) {
                    lngBase = mapBounds.getSouthWest().lng();
                    lngPercentage = offset.left;
                } else {
                    lngBase = mapBounds.getNorthEast().lng();
                    lngPercentage = offset.right;
                }
                return new gMap.LatLng(latBase + mapDim.height*(latPercentage/100), lngBase + mapDim.width*(lngPercentage/100));
            },
            /**
             * Transforms a location (assuming it will be a center of the map) by a proportion of the map size
             * @param loc {gMap.LatLng}
             * @param Proportion {Object} Height and Width percentage, each ranging from 100 to -100
             * @returns {gMap.LatLng}
             */
            makeProportionallyRelativeLocation: function(map, loc, proportion) {
                var mapDim = geoServices.map.getDimensions(map)
                return new gMap.LatLng(loc.lat() + mapDim.height*(proportion.height/100), loc.lng() + mapDim.width*(proportion.width/100));
            }
        },
        human: {
            /**
             * Fetch coordinates of the user via WC3 geolocation service
             * @param callback
             */
            detectUser: function(callback){
                if (false) {//navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(loc){
                        callback({
                            lat: loc.coords.latitude,
                            lng: loc.coords.longitude
                        })
                    }, function() {
                        callback();
                    });
                } else {
                    callback();
                }
            },
            /**
             * Get address based on coordinates
             *
             * @param latLng
             * @param callback In the form callback(err, data )
             */
            convertToAddress: function(latLng, callback, mustBeStreetAddress) {
                var _self = this;
                geoServices.coder.geocode({
                    "latLng": latLng
                }, function (results, status) {
                    if (status == gMap.GeocoderStatus.OK) {
                        var match = results[0];
                        if (mustBeStreetAddress) {
                            $.each(results, function(i, result) {
                                if ($.inArray("street_address", result.types)>-1) {
                                    match = result;
                                    return false;
                                }
                            })
                        }
                        var address = {
                            full: match['formatted_address'],
                            city: _self.getCity(match.address_components),
                            components: match.address_components
                        }
                        callback(null, address);
                    } else {
                        callback(status, results);
                    }
                });
            },
            /**
             * Extract city from address components
             * @param addressComponents
             * @returns {*}
             */
            getCity: function(addressComponents) {
                var city = null;
                $.each(addressComponents, function(i, component) {
                    if ($.inArray('locality', component.types)>-1) {
                        city = component.long_name;
                        return false;
                    }
                })
                return city;
            },
            /**
             * Clean address from tokens
             *
             * @param address
             * @param tokens
             */
            cleanAddress: function(address, tokens) {
                var cleanAddress = [];
                $.each(address.split(','), function(i, cityPart) {
                if ($.inArray($.trim(cityPart), tokens)==-1)
                    cleanAddress.push(cityPart)
                })
                return cleanAddress.join(', ')
            }
        }
    }
})(google.maps)