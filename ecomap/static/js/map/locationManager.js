/**
 * Export
 */
var LocationManager;

(function (gMap) {
    LocationManager = function (map, geoServices, recycleService, infoContent) {
        this.map = map;
        this.geo = geoServices;
        this.recycle = recycleService;
        this.coverage = new Coverage();
        this.locations = {}
        this.infoWindow = this._createInfoWindow({"content": infoContent})
        this.markerCluster = new MarkerClusterer(this.map, undefined, {
            averageCenter: true
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
                console.log(markerData)
                var locations = _self.populateMarkers(markerData, criteria);
                _self._decorate(locations);
                if ($.isFunction(callback))
                    callback(locations)
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
                var locations = _self.populateMarkers(null, {
                    "tags": _self.recycle.tags()
                });
                _self._decorate(locations);
                if ($.isFunction(callback))
                    callback(locations)


            } else if ($.isFunction(callback)) {

                // otherwise just execute callback
                callback(_self.locations)
            }
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

                            $infoWindow.find('.address').html(data.address);
                            $infoWindow.find('.more-info p').html(data.description);

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




    //http://jsfiddle.net/ZpN6L/13/
    //http://jsfiddle.net/ZpN6L/17/
    var Coverage = function() {}
    Coverage.prototype = {
        coveragePaths: null,
        scale: 100,
        lib: ClipperLib,
        fillType: ClipperLib.PolyFillType.pftNonZero,

        /**
         * Set google bounds as coverage
         * @param bounds
         */
        set: function(bounds){
            this.coveragePaths = this.toPaths(bounds)
        },

        /**
         * Add google bounds to coverage
         * @param bounds
         */
        add: function(bounds){
            this._add(this.toPaths(bounds))
        },

        /**
         * Check if bounds are in our coverage
         *
         * @param bounds
         * @returns {boolean}
         */
        contains: function(bounds) {
            if (!this.coveragePaths) return false;
            var paths = this.toPaths(bounds);
            return this._getArea(this._intersect(paths)) == this._getArea(paths)
        },

        /**
         * Convert Google Bounds object to Clipper paths
         * @param bounds
         * @returns {*[]}
         */
        toPaths: function(bounds) {
            var ne = bounds.getNorthEast()
            var sw = bounds.getSouthWest()
            var points = [
                new gMap.LatLng(ne.lat(), sw.lng()),
                ne,
                new gMap.LatLng(sw.lat(), ne.lng()),
                sw
            ]
            var path = []
            for (var i = 0; i < points.length; i++) {
                path.push({X: points[i].lat()*10000, Y: points[i].lng()*10000})
            }
            var paths = [path]
            this.lib.JS.ScaleUpPaths(paths, this.scale);
            return paths
        },

        /**
         * Calculate Area
         * @param paths
         */
        _getArea: function(paths) {
            return this.lib.JS.AreaOfPolygons(paths, this.scale)
        },

        /**
         * Add paths to coverage
         * @param paths
         * @private
         */
        _add: function(paths){
            if (!this.coveragePaths) {
                this.coveragePaths = paths;
            }
            var cpr = this._getClipper();
            cpr.AddPaths(paths, this.lib.PolyType.ptClip, true);

            var union = new this.lib.Paths();
            cpr.Execute(this.lib.ClipType.ctUnion, union, this.fillType, this.fillType);
            this.coveragePaths = union
        },

        /**
         * Get intersection
         * @param paths
         * @private
         */
        _intersect: function(paths){
            var cpr = this._getClipper();
            cpr.AddPaths(paths, this.lib.PolyType.ptClip, true);

            var intersection = new this.lib.Paths();
            cpr.Execute(this.lib.ClipType.ctIntersection, intersection, this.fillType, this.fillType);
            return intersection;
        },

        /**
         * Init Clipper and add coverage as subject
         * @returns {ClipperLib.Clipper}
         * @private
         */
        _getClipper: function(){
            var cpr = new ClipperLib.Clipper()
            cpr.AddPaths(this.coveragePaths, this.lib.PolyType.ptSubject, true);
            return cpr;
        }
    }
})(google.maps)
