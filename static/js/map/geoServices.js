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
            convertToAddress: function(latLng, callback) {
                geoServices.coder.geocode({
                    "latLng": latLng
                }, function (results, status) {
                    if (status == gMap.GeocoderStatus.OK) {
                        var address = {
                            full: results[0]['formatted_address'],
                            city: null
                        }
                        $.each(results, function(i, token) {
                            if ($.inArray('locality', token.types)>-1) {
                                address.city = token.formatted_address
                                return false;
                            }
                        })
                        callback(null, address);
                    } else {
                        callback(status, results);
                    }
                });
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