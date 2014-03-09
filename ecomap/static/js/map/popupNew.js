/**
 * Export
 */
var PopupAddNew;

(function(gMap) {
    /**
     * Popup dialogue used for submitting a new recycling spot
     *
     * @param options
     * @param callback
     * @constructor
     */
    PopupAddNew = function(options) {
        this.eventCache = {}
        var o = $.extend({
            map: undefined,
            location: undefined,
            content: "Heyyy!",
            geo: undefined
        }, options);

        var _self = this;
        _self.map = o.map;
        _self.geo = o.geo;
        var locationLookUp = $.Deferred();
        if (!o.location) {
            o.location = _self.geo.map.getProportionallyRelativeLocation(_self.map, {bottom: 10, left:50})
            _self.geo.panorama.getPanoramaByLocation(o.location, 500, function(result, status) {
                if (status == gMap.StreetViewStatus.OK) {
                    o.location = result.location.latLng
                }

                locationLookUp.resolve()
            });
        } else {
            locationLookUp.resolve()
        }
        locationLookUp.then(function() {
            _self.marker = _self._createMarker(o.location);
            _self.infowindow = _self._createInfoWindow({"content": o.content})
            _self.marker.setVisible(true);
            _self.infowindow.open(_self.map, _self.marker);
            _self.events = {
                // The infowindow DOM is ready
                infoWindowReady: gMap.event.addListener(_self.infowindow, 'domready', function() {
                    _self.$infoWindowContainer = $('#add-new');
                    _self.trigger('ready');
                    var $close = _self.$infoWindowContainer.find('a.close')

                    // Custom close link on the infowindow
                    $close.click(function(e){
                        e.preventDefault();
                        gMap.event.trigger(_self.infowindow, "closeclick");
                    })
                }),

                // When the infowindow is closed
                infoClose: gMap.event.addListener(_self.infowindow, 'closeclick', function() {
                    _self.map.setOptions({draggableCursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur),default'});
                    _self.destroy();
                }),

                // When the marker is dragged
                markerDragStart: gMap.event.addListener(_self.marker, "dragstart", function () {
                    _self.markerPositionChangedRecently = true;
                }),

                // When the marker is dragged or address is changed
                markerPositionChange: gMap.event.addListener(_self.marker, "position_changed", function () {
                    if (!_self.markerPositionChangedRecently) {
                        _self.trigger('move', [_self.marker.getPosition()]);
                        _self.timeoutMarkerPositionChange();
                    }
                })
            }
            _self.enableMoving()
        })
    }

    PopupAddNew.prototype = $.extend({}, EventEmitter(), {
        map: null,
        addressInfo: null,
        marker: null,
        markerPositionChangedRecently: false,
        markerPositionChangedTimeout: false,
        $infoWindowContainer: null,
        infowindow: null,
        geo: null,
        events: null,

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
                draggable: true,
                icon: {
                    url: '#',
                    size: new gMap.Size(64, 64),
                    // The origin for this image is 0,0.
                    origin: new gMap.Point(0, 0),
                    // The anchor for this image is the base of the flagpole at 0,32.
                    anchor: new gMap.Point(23, 63)
                },
                map: _self.map
            }, options)
            return new gMap.Marker(options);
        },

        /**
         * Creates an infowindow
         *
         * @param options Infowindow options
         * @returns {gMap.InfoWindow}
         * @private
         */
        _createInfoWindow: function(options) {
            var $content = $(options.content).hide()
            $(this.map.getDiv()).append($content)
            var options = $.extend({
                pixelOffset: new google.maps.Size(-$content.outerWidth()/2, 0),
                zIndex: null,
    			alignBottom: true,
                infoBoxClearance: new google.maps.Size(1, 1),
                pane: "floatPane",
                enableEventPropagation: false
            }, options)
            $content.remove();
            var infoWindow = new InfoBoxAnimated(options);
            return infoWindow;
        },

        /**
         * Move marker smoothly
         * @param location
         * @param callback
         * @private
         */
        _animateMarker: function(location, callback) {
            this.marker.animateTo(location, {
                easing: "easeOutCubic",
                duration: 300,
                complete: callback
            });
        },

        /**
         * Enable moving the marker
         */
        enableMoving: function() {
            var _self = this;
            var listener = gMap.event.addListener(_self.map, 'click', function (event) {
                _self.markerPositionChangedRecently = true;
                if (_self.markerPositionChangedTimeout) {
                    clearTimeout(_self.markerPositionChangedTimeout);
                }
                _self._animateMarker(event.latLng, function () {
                    _self.trigger('move', [_self.marker.getPosition()]);
                    _self.timeoutMarkerPositionChange();
                });
            })
            _self.marker.setDraggable(true);
            _self.events.mapClick = listener;
            _self.map.setOptions({draggableCursor: 'pointer'});
            _self.marker.setOptions({cursor: 'pointer'});

            return listener;
        },

        /**
         * Disable moving the marker
         */
        disableMoving: function() {
            this.map.setOptions({draggableCursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur),default'});
            this.marker.setOptions({cursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur),default'});
            this.marker.setDraggable(false);
            gMap.event.removeListener(this.events.mapClick);
        },

        /**
         * Clean after the popup is not in use
         */
        destroy: function() {
            var _self = this;
            if (_self.infowindow == null) return;
            gMap.event.removeListener(_self.events.infoWindowReady);
            gMap.event.removeListener(_self.events.markerDragStart);
            gMap.event.removeListener(_self.events.markerPositionChange);
            gMap.event.removeListener(_self.events.mapClick);
            gMap.event.removeListener(_self.events.infoClose);
            if (_self.infowindow.getMap() instanceof gMap.Map)
                _self.infowindow.close()
            _self.infowindow = null;
            _self.marker.setMap(null);
        },

        /**
         * Delays marker position change by certain milliseconds.
         */
        timeoutMarkerPositionChange: function() {
            var _self = this;
            _self.markerPositionChangedRecently = true;
            _self.markerPositionChangedTimeout = setTimeout(function() {_self.markerPositionChangedRecently = false;}, 200)
        }
    });
})(google.maps)
