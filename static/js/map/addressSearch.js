/**
 * Export
 */
var AddressSearch;

(function(gMap) {
    /**
     * Places autocomplete
     * @param $el
     * @param map
     * @constructor
     */
    AddressSearch = function($el, map) {
        var _self = this;
        _self.events = {};
        _self.map = map;
        _self.$el = $el;
        var options = {
            types: ['geocode'],
            componentRestrictions: {country: 'BG'}
        };
        _self.autocomplete = new gMap.places.Autocomplete($el.get(0), options);
        _self.autocomplete.bindTo('bounds', map);
        _self.events.autocompleteChange = gMap.event.addListener(_self.autocomplete, 'place_changed', function() {
            $el.removeClass('notfound');
            var place = _self.autocomplete.getPlace();
            // Inform the user if the place was not found.
            if (!place.geometry) {
                $el.addClass('notfound')
                console.log('notfound')
                return;
            }
            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(17);  // Why 17? Because it looks good.
            }
            // Ahmm?... building up address from address components instead of formatted_address?
            if (place.address_components) {
    //            console.log([
    //                (place.address_components[0] && place.address_components[0].short_name || ''),
    //                (place.address_components[1] && place.address_components[1].short_name || ''),
    //                (place.address_components[2] && place.address_components[2].short_name || '')
    //            ].join(' '));
            }
            //@todo ajax query for new points
        })
    }
    AddressSearch.prototype = {
        $el: null,
        map: null,
        autocomplete: null,
        destroy: function() {
            var _self = this;
            _self.autocomplete.unbind("bounds");
            gMap.event.removeListener(_self.events.autocompleteChange);
        }
    }
})(google.maps)