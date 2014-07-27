/**
 * Export
 */
var LocationManager;

(function (gMap) {
    LocationManager = function (map, geoServices, recycleService, infoContent) {
        this.map = map;
        this.geo = geoServices;
        this.recycle = recycleService;
        this.coverage = new Coverage({
            boundTransformation: googleBoundsTransformation,
            multiplier: 1000
        });
        this.locations = {};
        this.infoWindow = this._createInfoWindow({"content": infoContent})
        this.markerCluster = new MarkerClusterer(this.map, undefined, {
            averageCenter: true,
            styles: [{
                url: '/static/img/pin-cluster.png',
                height: 34,
                width: 37
            }]
        });
    }
    LocationManager.prototype = {
        coverage: false,
        isPaused: false,
        map: null,
        infoWindow: null,
        recycle: null,
        geo: null,
        markerCluster: null,
        locations: null,

        /**
         * Loads new loations based on criteria
         * @param criteria
         * @param callback {Function}
         */
        loadLocations: function(criteria, callback) {
            var _self = this;
            if (criteria["bounds"] && criteria["bounds"] instanceof gMap.LatLngBounds) {
                _self.coverage.add(criteria["bounds"])
                var ne = criteria["bounds"].getNorthEast()
                var sw = criteria["bounds"].getSouthWest()
                criteria = $.extend(criteria, {
                    "bounds-ne_lat": ne.lat(),
                    "bounds-ne_lng": ne.lng(),
                    "bounds-sw_lat": sw.lat(),
                    "bounds-sw_lng": sw.lng()
                })
                delete criteria["bounds"];
            }
            _self.recycle.find(criteria, function(markerData) {
                _self.refreshLocaitons(markerData, criteria, callback)
            });
        },

        /**
         * Helper of loadLocations where the passed criteria is the chosen tags and twice the current map bounds
         */
        fixLocations: function (callback, forceFilter) {
            var _self = this;

            // Check if have coverage
            if (!_self.coverage.contains(_self.map.getBounds())) {

                // If not query server
                _self.loadLocations({
                    "tags": _self.recycle.tags(),
                    "bounds": _self.geo.map.scaleBounds(_self.map.getBounds(), 2)
                }, callback);

            } else if (forceFilter) {

                // If we have it but filtering is triggered then only filter
                _self.refreshLocaitons(null, {
                    "tags": _self.recycle.tags()
                }, callback)

            } else if ($.isFunction(callback)) {

                // otherwise just execute callback
                callback(_self.locations)
            }
        },

        refreshLocaitons: function(data, criteria, callback) {
            var locations = this.populateMarkers(data, criteria);
            this._decorate(locations);
            if ($.isFunction(callback))
                callback(locations)
        },

        /**
         * Close info dialog
         */
        close: function() {
            this.infoWindow.close();
        },


        /**
         * Temporarily disable the ability to click on info windows
         */
        pause: function() {
            this.isPaused = true;
        },


        /**
         * Re-enable the ability to click on info windows
         */
        resume: function() {
            this.isPaused = false;
        },

        /**
         * Removes old markers and plots new markers
         * @param markerData {Object} Returned data from server
         * @param criteria {Object} Filters or otherwise called tags
         * @returns {{markers: Array, data: Array}}
         */
        populateMarkers: function (markerData, criteria) {
            var _self = this;

            // Add new markers if any
            if (markerData) {
                $.each(markerData, function (i, data) {
                    if (_self.locations[data.id]) return;
                    _self.locations[data.id] = {
                        "data": data,
                        "marker": _self._createMarker(new gMap.LatLng(data.lat, data.lng))
                    }
                })
            }

            // Filter visible markers
            var tags = criteria.tags || []
            var clusterMarkers = []
            $.each(_self.locations, function (id, location) {
                var matches = 0;
                for (var j = 0; j < location.data.tags.length; j++) {
                    if (tags.indexOf(location.data.tags[j]) > -1) matches++;
                }
                location.data.visible = (matches > 0) || (tags.length == 0)
                location.data.fullMatch = matches == tags.length;

                if (!location.data.visible) {
//                    location.marker.setMap(null)
                    location.marker.setVisible(false)
                    _self.markerCluster.removeMarker(location.marker)
                    location.data.inCluster = false;
                } else {
//                    location.marker.setMap(_self.map)
                    if (!location.data.inCluster) {
                        _self.markerCluster.addMarker(location.marker)
                        location.data.inCluster = true;
                    }
                }
            })

            return _self.locations;
        },

        /**
         * Enriches functionality of locations
         * @param locations
         * @private
         */
        _decorate: function (locations) {
            var _self = this;
            $.each(locations, function (id, location) {
                var marker = location.marker;
                var data   = location.data
                if (!data.fullMatch) {
                    marker.setIcon(_self._createIcon('/static/img/pin_faded.png'));
                } else {
                    marker.setIcon(_self._createIcon('/static/img/pin.png'));
                }
                if (data.visible) {
                    marker.setVisible(true)
                }
                if (data.decorated) return;
                data.decorated = true;
                gMap.event.addListener(marker, 'click', (function (marker, data) {
                    return function () {
                        if (_self.isPaused) {
                            return;
                        }
                        // Add info window
                        var eventChangingContent = gMap.event.addListener(_self.infoWindow, 'domready', function () {
                            var $infoWindow = $(_self.infoWindow.div_);
                            //$infoWindow.find('h2').html(data.name);

                            var $tagContainer = $infoWindow.find('.tags');
                            $infoWindow.find('.street').html(data.address + ' '+data.number);
                            $infoWindow.find('.area').html(data.area + ' '+data.post_code);
                            $infoWindow.find('.type').html(data.type);
                            if (data.description) {
                                $infoWindow.find('.more-info p').html(data.description);
                            } else {
                                $infoWindow.find('.more-info').remove()
                            }
                            for (var i = 0; i < data.tags.length; i++) {
                                $('<li>').append(data.tags[i]).appendTo($tagContainer)
                            }
                            var streetview_params = data.streetview_params;
                            var src = _self.geo.streetview.getStaticUrl(500, 200, data.lat+',' + data.lng, streetview_params.fov, streetview_params);
                            $infoWindow.find('.streetview-thumb img').attr('src', src);
                            var $close = $infoWindow.find('a.close');

                            // Custom close link on the infowindow
                            $close.click(function(e) {
                                e.preventDefault();
                                gMap.event.trigger(_self.infoWindow, "closeclick");
                                _self.infoWindow.close();
                            })

                            gMap.event.removeListener(eventChangingContent);
                        })
                        _self.infoWindow.open(_self.map, marker);
                    }
                })(marker, data));
            })
        },

        /**
         * Create icon config
         * @param path
         */
        _createIcon: function(path) {
//            http://mapicons.nicolasmollet.com/
//            svg: https://developers.google.com/maps/documentation/javascript/examples/marker-symbol-custom
            return {
                url: path,
                size: new gMap.Size(13, 32),
                // The origin for this image is 0,0.
                origin: new gMap.Point(0, 0),
                // The anchor for this image is the base of the flagpole at 0,32.
                anchor: new gMap.Point(6, 29)
            }
        },

        /**
         * Add a marker
         * @param location LatLng location
         * @param options (optional)
         */
        _createMarker: function(location, options) {
            var _self = this;
            options = $.extend({
                visible: false,
                position: location,
                animation: gMap.Animation.b,
                draggable: false,
                icon: _self._createIcon('/static/img/pin.png'),
                map: _self.map
            }, options)
            return new gMap.Marker(options);
        },

        /**
         * Creates an infowindow
         *
         * @param options Infowindow options
         * @returns {InfoBoxAnimated}
         * @private
         */
        _createInfoWindow: function(options) {
            var $content = $(options.content).hide()
            $(this.map.getDiv()).append($content)
            options = $.extend({
			    pixelOffset: new google.maps.Size(-$content.outerWidth()/2, -37),
                zIndex: null,
    			alignBottom: true,
                infoBoxClearance: new google.maps.Size(1, 1),
                pane: "floatPane",
                enableEventPropagation: false
            } , options);
            $content.remove();
            var infoWindow = new InfoBoxAnimated(options);
            return infoWindow;
        }
    }
})(google.maps)
