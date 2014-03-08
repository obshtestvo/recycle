/**
 * Export
 */
var Map;

(function(gMap) {

    Map = function($el, geo, options) {

        options = $.extend({
            center: $el.data('center'),
            callback: undefined
        }, options);

        // Init vars
        var _self = this;
        _self.geo = geo;

        // Init map
        centerLoc = new gMap.LatLng(options.center.lat, options.center.lng);

        _self.map = _self._createMap($el.get(0), {
            center: centerLoc
        })

        // Wait map to be idle/ready and trigger callback
        var callback = options.callback || $.noop;
        var onReady = gMap.event.addListener(_self.map, 'idle', function(){
            callback(_self.map);
            gMap.event.removeListener(onReady);
        })
    }

    Map.prototype = {
        map: null,
        addNewPopup: null,
        markerCluster: null,
        locationManager: null,
        geo: null,
        markers: [],

        /**
         * Creates a map
         *
         * @param el DOM element
         * @param options Google map options
         * @returns {gMap.Map}
         * @private
         */
        _createMap: function(el, options) {

            options = $.extend({
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: {
                    style: gMap.ZoomControlStyle.SMALL
                },
                zoom: 13,
                minZoom: 7,
                streetViewControl: false,
                backgroundColor: '#B2F7A6',
                mapTypeId: gMap.MapTypeId.ROADMAP
            }, options);

            var map = new gMap.Map(el,options);
            var styles = [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [
                        { visibility: "off" }
                    ]
                },
                {
                    featureType: "road",
                    elementType: "all",
                    stylers: [
                        { visibility: "on" }
                    ]
                }
            ];
            var mapType = new google.maps.StyledMapType(styles, {name: "Recycle Style"});
            map.mapTypes.set("Recycle Style", mapType);
            map.setMapTypeId("Recycle Style");
            return map;
        },

        /**
         * Check for visible markers on the map
         * @returns {boolean}
         */
        hasVisibleMarkers: function() {
            var _self = this;
            var markers = _self.markers;
            var bounds = _self.map.getBounds();
            var contain = false;
            $.each(markers, function(i, m) {
                if (m.getVisible() && bounds.contains(m.getPosition())) {
                    contain = true;
                    return false;
                }
            })
            return contain;
        }
    }

})(google.maps)