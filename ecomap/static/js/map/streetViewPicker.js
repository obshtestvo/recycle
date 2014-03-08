/**
 * Export
 */
var StreetViewPicker;

(function(gMap) {

    StreetViewPicker = function ($el, geo, options) {
        var _self = this;

        options = $.extend({
            closedPlaceholderSelector: undefined,
            unavailablePlaceholderSelector: undefined,
            closeSelector: undefined,
            triggerSelector: undefined,
            availabilityRange: 50 // meters
        }, options);

        _self.$container = $el;
        _self.$closedPlaceholder = $(options.closedPlaceholderSelector);
        _self.$unavailablePlaceholder = $(options.unavailablePlaceholderSelector);
        _self.$close = $(options.closeSelector);
        _self.$trigger = $(options.triggerSelector);
        _self.availabilityRange = options.availabilityRange;
        _self.geo = geo;

        _self.streetview = new gMap.StreetViewPanorama(_self.$container.get(0), {
            navigationControl: false,
            enableCloseButton: false,
            addressControl: false,
            linksControl: false
        })

        // Cancel streetview
        _self.$close.click(function(e) {
            e.preventDefault();
            _self.cancel()
            _self.$close.addClass('hide')
            _self.$trigger.removeClass('hide')
        })

        // Reactivate streetview
        _self.$trigger.click(function(e) {
            e.preventDefault();
            _self.handleAvailability(_self.streetview.getPosition());
        })

    }

    StreetViewPicker.prototype = {
        $container: null,
        $closedPlaceholder: null,
        $unavailablePlaceholder: null,
        $trigger: null,
        $close: null,
        streetview: null,
        availabilityRange: null,

        /**
         * Cancels streetview picker
         * @private
         */
        cancel: function() {
            var _self = this;
            if (_self.$closedPlaceholder.is(':visible')) return;
            _self.$unavailablePlaceholder.hide();
            _self.$container.hide();
            _self.streetview.setVisible(false);
            _self.$closedPlaceholder.show();
        },
        /**
         * Check if streetview is out of range
         * @param location LatLng
         */
        handleAvailability: function(location){
            var _self = this;
            _self.geo.panorama.getPanoramaByLocation(location, _self.availabilityRange, function(result, status) {
                _self.$closedPlaceholder.hide()
                if (status == gMap.StreetViewStatus.OK) {
                    _self.$container.show();
                    _self.streetview.setVisible(true);
                    _self.$unavailablePlaceholder.hide();
                    _self.$trigger.addClass('hide')
                    _self.$close.removeClass('hide')
                } else {
                    _self.$container.hide();
                    _self.streetview.setVisible(false);
                    _self.$unavailablePlaceholder.show()
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
        getSnapshotUrl: function(width, height) {
            var pov = this.streetview.getPov()
            var loc = this.streetview.getPosition()
            var values = [120, 90, 53.5, 28.3, 14.3, 10];
            var fov = values[Math.round(pov.zoom)];
            return 'http://maps.googleapis.com/maps/api/streetview?size='+width+'x'+height+'&location='+loc.toUrlValue()+'&fov='+fov+'&heading='+pov.heading+'&pitch='+pov.pitch+'&sensor=false';
        },

        /**
         * Bind streetview position to marker's position
         * @param {gMap.Marker} marker
         */
        bindToMarker: function(marker) {
            this.streetview.bindTo("position", marker);
        },

        /**
         * Whether the streetview panorama is visible
         * @returns boolean
         */
        isActive: function() {
            return this.$container.is(':visible');
        }
    }
})(google.maps)