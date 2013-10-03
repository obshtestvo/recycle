/**
 * Export
 */
var LocationManager;

(function (gMap) {
    LocationManager = function (map, recycleService) {
        this.map = map;
        this.recycle = recycleService;
        this.infoWindow = new gMap.InfoWindow();
    }
    LocationManager.prototype = {
        map: null,
        infoWindow: null,
        recycle: null,
        filteredMarkers: [],
        markerCluster: null,
        /**
         * Loads new loations based on criteria
         * @param criteria
         * @param callback {Function}
         */
        loadLocations: function(criteria, callback) {
            var _self = this;
            _self.recycle.find(criteria, function(markerData) {
                var locations = _self.populateMarkers(markerData);
                _self._decorate(locations);
                if ($.isFunction(callback))
                    callback(locations)
            });
        },

        /**
         * Helper of loadLocations where the passed criteria is the centere of the map and chosen tags
         */
        filterLocations: function (callback) {
            var _self = this;
            _self.loadLocations({
                "coords": _self.map.getCenter().toUrlValue(),
                "tags": _self.recycle.tags()
            }, callback);
        },

        /**
         * Tries to show more markers on the map based on current map center and chosen tags
         */
        topUp: function (callback) {
            var _self = this;
            var tags = _self.recycle.tags()
            _self.recycle.find({
                "coords": _self.map.getCenter().toUrlValue(),
                "tags": tags
            }, function (markerData) {
                var locations = _self.populateMarkers(markerData, tags);
                _self._decorate(locations);
                callback(locations)
            });
        },

        /**
         * Removes old markers and plots new markers
         * @param markerData {Object} Returned data from server
         * @param filters {Array} Filters or otherwise called tags
         * @returns {{markers: Array, data: Array}}
         */
        populateMarkers: function (markerData, filters) {
            var _self = this;

            // Remove markers from map and memory
            while (_self.filteredMarkers.length)
                _self.filteredMarkers.pop().setMap(null);

            // Clear clustering
            if (_self.markerCluster)
                _self.markerCluster.clearMarkers();

            // Guarantee filters if none provided
            if ($.type(filters) == "undefined") {
                filters = [];
                for (var i in markerData) {
                    filters.push(i);
                }
            }

            // Filter data
            var filteredMarkerData = [];
            $.each(markerData, function (filter, points) {
                if (!$.inArray(filter, filters) < 0) return;
                $.each(points, function (i, data) {
                    filteredMarkerData.push(data);
                })
            })

            // Create markers
            $.each(filteredMarkerData, function (i, data) {
                var m = new gMap.Marker({
                    position: new gMap.LatLng(data.lat, data.lng),
                    animation: gMap.Animation.b,
                    draggable: false,
                    map: _self.map
                });
                _self.filteredMarkers.push(m);
            });

            // Display markers on map as cluster
            _self.markerCluster = new MarkerClusterer(_self.map, _self.filteredMarkers);

            return {
                markers: _self.filteredMarkers,
                data: filteredMarkerData
            };
        },
        /**
         * Enriches functionality of locations
         * @param locations
         * @private
         */
        _decorate: function (locations) {
            var _self = this;
            $.each(locations.markers, function (i, marker) {
                gMap.event.addListener(marker, 'click', (function (marker, i) {
                    return function () {
                        _self.infoWindow.setContent(locations.data[i].name);
                        _self.infoWindow.open(_selfmap, marker);
                    }
                })(marker, i));
            })
        }
    }
})(google.maps)