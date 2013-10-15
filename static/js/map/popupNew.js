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
    PopupAddNew = function(options, callback) {
        var o = $.extend({
            addressInputSelector: ".floater div.add-new .new-address",
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
            _self.map.setOptions({draggableCursor: 'pointer'});
            _self.$elements = {}
            var createMapClickListener = function() {
                return gMap.event.addListener(_self.map, 'click', function (event) {
                    //this is how we access the streetview params _self.streetview.pov
                    _self.markerPositionChangedRecently = true;
                    if (_self.markerPositionChangedTimeout) {
                        clearTimeout(_self.markerPositionChangedTimeout);
                    }
                    _self._animateMarker(event.latLng, function () {
                        _self.checkStreetView(_self.marker.getPosition());
                        gMap.event.trigger(_self.marker, 'position_changed_custom');
                        _self.timeoutMarkerPositionChange();
                    });
                })
            }
            _self.events = {
                // The infowindow DOM is ready
                infoWindowReady: gMap.event.addListener(_self.infowindow, 'domready', function() {
                    var $content = $('#add-new');
                    _self.$elements.close = $content.find('a.close')
                    _self.$elements.streetview = $content.find('.streetview')
                    _self.$elements.step1 = $content.find('#step1');
                    _self.$elements.streetviewCancelTrigger = _self.$elements.step1.find('a.cancel-streetview');
                    _self.$elements.streetviewReactivateTrigger = _self.$elements.step1.find('a.reactivate');
                    _self.$elements.step1DoneTrigger = _self.$elements.step1.find('a.accept');
                    _self.$elements.streetviewCancelled = $content.find('.cancelled-streetview');


                    // Custom close link on the infowindow
                    _self.$elements.close.click(function(e){
                        e.preventDefault();
                        gMap.event.trigger(_self.infowindow, "closeclick");
                        _self.infowindow.close();
                    })

                    // Cancel streetview
                    _self.$elements.streetviewCancelTrigger.click(function(e) {
                        e.preventDefault();
                        _self._cancelStreetView()
                        $(this).addClass('hide')
                        _self.$elements.streetviewReactivateTrigger.removeClass('hide')
                    })

                    // Reactivate streetview
                    _self.$elements.streetviewReactivateTrigger.click(function(e) {
                        e.preventDefault();
                        _self.checkStreetView(_self.marker.getPosition());
                        $(this).addClass('hide')
                        _self.$elements.streetviewCancelTrigger.removeClass('hide')
                    })
                    _self.$elements.streetviewHolding = $content.find('.missing-streetview')

                     // Create streetview and sync its location with the marker
                    _self.streetview = _self._createStreetView(_self.$elements.streetview.get(0));
                    _self.streetview.bindTo("position", _self.marker);
                    _self.checkStreetView(_self.marker.getPosition());

                    // Step 1 is complete
                    _self.$elements.step1DoneTrigger.click(function(e){
                        e.preventDefault();
                        var src = 'http://placehold.it/300x100';
                        var $step2img = _self.$elements.step2.find('.street img');
                        if (_self.$elements.streetview.is(':visible')) {
                            src = _self._getPhotoUrl($step2img.width(), $step2img.height())
                        }
                        $step2img.attr('src',src)
                        _self.infowindow.switchContent($content, _self.$elements.step1, _self.$elements.step2, 100)
                        _self.map.setOptions({draggableCursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur),default'});
                        _self.marker.setOptions({cursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur),default'});
                        _self.marker.setDraggable(false);
                        gMap.event.removeListener(_self.events.mapClick);
                    })

                    // Step 2
                    _self.$elements.step2 = $content.find('#step2');

                    // Go back to step1
                    _self.$elements.step2backTrigger = _self.$elements.step2.find('a.back');
                    _self.$elements.step2backTrigger.click(function(e) {
                        e.preventDefault();
                        _self.infowindow.switchContent($content, _self.$elements.step2, _self.$elements.step1, 100)
                        _self.marker.setDraggable(true);
                        _self.events.markerDrag = createMapClickListener();
                        _self.map.setOptions({draggableCursor: 'pointer'});
                        _self.marker.setOptions({cursor: 'pointer'});
                    });
                    _self.$elements.step2DoneTrigger = _self.$elements.step2.find('a.accept');
                    _self.$elements.step2DoneTrigger.click(function(e){
                        e.preventDefault();
                        _self.$elements.step2.block({
                            message: null,
                            overlayCSS: {
                                backgroundColor:'rgba(255, 255, 255, 0.6)',
                                opacity:1
                            }
                        });
                        var $veil = _self.$elements.step2.find('.blockOverlay');
                        new Spinner({
                            top: 'auto',
                            left: 'auto',
                            lines: 15, // The number of lines to draw
                            length: 0, // The length of each line
                            width: 5, // The line thickness
                            radius: 4, // The radius of the inner circle
                            corners: 1, // Corner roundness (0..1)
                            color: '#65E034', // #rgb or #rrggbb
                            speed: 1, // Rounds per second
                            trail: 31, // Afterglow percentage
                            shadow: false, // Whether to render a shadow
                            hwaccel: true // Whether to use hardware acceleration
                        }).spin($veil.get(0));

                        // simulate ajax
                        setTimeout(function() {
                            _self.$elements.step2.unblock();
                            _self.infowindow.switchContent($content, _self.$elements.step2, _self.$elements.step3, 100)
                        },2000)
                    })

                    _self.$elements.step3 = $content.find('#step3');


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

                // When the marker is dragged
                markerDrag: gMap.event.addListener(_self.marker, "dragend", function () {
                    _self.markerPositionChangedRecently = false;
                    _self.checkStreetView(_self.marker.getPosition());
                }),

                // When the marker is dragged
                markerPositionChange: gMap.event.addListener(_self.marker, "position_changed", function () {
                    if (!_self.markerPositionChangedRecently) {
                        gMap.event.trigger(_self.marker, 'position_changed_custom');
                        _self.timeoutMarkerPositionChange();
                    }
                }),

                // When the map is clicked
                mapClick: createMapClickListener()
            }
            callback(_self);
        })
    }
    PopupAddNew.prototype = {
        map: null,
        addressInfo: null,
        marker: null,
        markerPositionChangedRecently: false,
        markerPositionChangedTimeout: false,
        infowindow: null,
        streetview: null,
        geo: null,
        events: null,
        $elements: null,
        /**
         * Add a marker
         * @param location LatLng location
         * @param options (optional)
         */
        _createMarker: function(location, options) {
            var _self = this;
            var options = $.extend({
                visible: false,
                position: location,
                animation: gMap.Animation.b,
                draggable: true,
                icon: {
                    url: '/img/pointer.png',
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
                pixelOffset: new google.maps.Size(-$content.outerWidth()/2, 0)
                ,zIndex: null
    //			,alignBottom: true
                ,boxStyle: {
                  background: "transparent url('/img/532px-TriangleArrow-Up.png') no-repeat center top"
                 }
                ,infoBoxClearance: new google.maps.Size(1, 1)
                ,pane: "floatPane"
                ,enableEventPropagation: false
            }, options)
            $content.remove();
            var infoWindow = new InfoBoxAnimated(options);
//            var options = $.extend({}, options)
//            var infoWindow = new gMap.InfoWindow(options);
            return infoWindow;
        },
        /**
         * Cancels streetview picker
         * @private
         */
        _cancelStreetView: function() {
            var _self = this;
            if (_self.$elements.streetviewCancelled.is(':visible')) return;
            _self.$elements.streetviewHolding.hide();
            _self.$elements.streetview.hide();
            _self.streetview.setVisible(false);
            _self.$elements.streetviewCancelled.show();
        },
        /**
         * Creates a streetview obj
         *
         * @param el DOM el
         * @param options
         * @returns {gMap.StreetViewPanorama}
         * @private
         */
        _createStreetView: function(el, options) {
            var options = $.extend({
                navigationControl: false,
                enableCloseButton: false,
                addressControl: false,
                linksControl: false
            }, options)
            return new gMap.StreetViewPanorama(el, options);
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
         * Check if streetview is out of range
         * @param location LatLng
         */
        checkStreetView: function(location){
            var _self = this;
            _self.geo.panorama.getPanoramaByLocation(location, 50, function(result, status) {
                _self.$elements.streetviewCancelled.hide()
                if (status == gMap.StreetViewStatus.OK) {
                    _self.$elements.streetview.show();
                    _self.streetview.setVisible(true);
                    _self.$elements.streetviewHolding.hide();
                } else {
                    _self.$elements.streetview.hide();
                    _self.streetview.setVisible(false);
                    _self.$elements.streetviewHolding.show()
                }
            });
        },

        /**
         * Get url to static image representing Google Street View
         * @param height
         * @param width
         * @returns {string} Url to image
         * @private
         */
        _getPhotoUrl: function(width, height) {
            var pov = this.streetview.getPov()
            var loc = this.marker.getPosition()
            var values = [120, 90, 53.5, 28.3, 14.3, 10];
            var fov = values[Math.round(pov.zoom)];
            return 'http://maps.googleapis.com/maps/api/streetview?size='+width+'x'+height+'&location='+loc.toUrlValue()+'&fov='+fov+'&heading='+pov.heading+'&pitch='+pov.pitch+'&sensor=false';
        },
        /**
         * Clean after the popup is not in use
         */
        destroy: function() {
            var _self = this;
            gMap.event.removeListener(_self.events.markerDrag);
            gMap.event.removeListener(_self.events.markerDragStart);
            gMap.event.removeListener(_self.events.markerPositionChange);
            gMap.event.removeListener(_self.events.mapClick);
            gMap.event.removeListener(_self.events.infoWindowReady);
            gMap.event.removeListener(_self.events.infoClose);
            if (_self.infowindow.getMap() instanceof gMap.Map)
                _self.infowindow.close()
            _self.streetview.unbind("position");;
            _self.marker.setMap(null);
        },
        /**
         * Delays marker position change by ceratin milliseconds.
         */
        timeoutMarkerPositionChange: function() {
            var _self = this;
            _self.markerPositionChangedRecently = true;
            _self.markerPositionChangedTimeout = setTimeout(function() {_self.markerPositionChangedRecently = false;}, 200)
        }
    }
})(google.maps)