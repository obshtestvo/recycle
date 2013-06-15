var MapService = function() {

}
MapService.prototype = {

}

var PopupAddNew = function(options) {
    var o = $.extend({
        map: undefined,
        location: undefined,
        content: "Heyyy!",
        geo: undefined
    }, options);

    var _self = this;
    _self.map = o.map;
    _self.geo = o.geo;
    if (!o.location) {
        var mapBounds = _self.map.getBounds();
        var latPortion = (mapBounds.getNorthEast().lat() - mapBounds.getSouthWest().lat())/10;
        o.location = new gMap.LatLng(mapBounds.getSouthWest().lat() + latPortion, _self.map.getCenter().lng());
    }
    _self.marker = _self._createMarker(o.location);
	_self.infowindow = _self._createInfoWindow({"content": o.content})
    _self.marker.setVisible(true);
    _self.infowindow.open(_self.map, _self.marker);
    _self.map.setOptions({draggableCursor: 'pointer'});
    _self.$elements = {}
    _self.events = {
        infoWindowReady: gMap.event.addListener(_self.infowindow, 'domready', function() {
            _self.$elements.streetview = $('#add-new .streetview')
            _self.$elements.streetviewHolding = $('#add-new .missing-streetview')
            _self.streetview = _self._createStreetView(_self.$elements.streetview.get(0));
            _self.streetview.bindTo("position", _self.marker);
            _self.checkStreetView(_self.marker.getPosition());
        }),
        infoClose: gMap.event.addListener(_self.infowindow, 'closeclick', function() {
            _self.map.setOptions({draggableCursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur),default'});
            _self.destroy();
        }),
        markerDrag: gMap.event.addListener(_self.marker, "dragend", function () {
            _self.checkStreetView(_self.marker.getPosition());
        }),
        mapClick: gMap.event.addListener(_self.map, 'click', function (event) {
            //this is how we access the streetview params _self.streetview.pov
            _self._animateMarker(event.latLng, function () {
                _self.checkStreetView(_self.marker.getPosition());
//                console.log(_self.marker.getPosition().toUrlValue(), _self.marker.getPosition())
            });
        })
    }
}

PopupAddNew.prototype = {
    map: null,
    marker: null,
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
        var options = $.extend({}, options)
        var infoWindow = new gMap.InfoWindow(options);
        return infoWindow;
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
     * Clean after the popup is not in use
     */
    destroy: function() {
        var _self = this;
        google.maps.event.removeListener(_self.events.markerDrag);
        google.maps.event.removeListener(_self.events.mapClick);
        google.maps.event.removeListener(_self.events.infoWindowReady);
        google.maps.event.removeListener(_self.events.infoClose);
        if (_self.infowindow.getMap() instanceof google.maps.Map)
            _self.infowindow.close()
        _self.streetview.unbind("position");;
        _self.marker.setMap(null);
    }
}
