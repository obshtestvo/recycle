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
    AddressSearch = function($el, map, centerTransformation) {
        var _self = this;
        _self.events = {};
        _self.map = map;
        _self.$el = $el;
        var googleOptions = {
            types: ['geocode'],
            componentRestrictions: {country: 'BG'}
        };
        _self.autocompleteService = new gMap.places.AutocompleteService();
        _self.geocoder = new gMap.Geocoder();
        _self.placesService = new google.maps.places.PlacesService(_self.map);
        var lastResults = {}
        var GoogleMapAjaxTransport = function(options) {
            var googleXhr = {
                abort: function() {
                    console.log('pff aborting, yeah right')
                    //@todo remove timeout for displaying results
                }
            }
            _self.autocompleteService.getPlacePredictions($.extend({}, googleOptions, {
                'input': options.data.q
            }), function (list, status) {
                    if (list == null || list.length == 0) {
                        _self.geocoder.geocode({
                            address: options.data.q,
                            componentRestrictions: googleOptions.componentRestrictions
                        }, function (list, status) {
                            lastResults = {};
                            var results = [];
                            $.each(list, function (i, loc) {
                                results.push({id: loc.geometry.location.toUrlValue(), text: loc.formatted_address})
                                lastResults[loc.formatted_address] = loc
                            })
                            options.success(results)
                        })
                    } else {
                        var results = []
                        $.each(list, function (i, loc) {
                            results.push({id: loc.reference, text: loc.description})
                        })
                        options.success(results)
                    }
                }
            );


            return googleXhr;
        }
        $el.select2({
            minimumInputLength: 1,
            ajax: {
                transport: GoogleMapAjaxTransport,
                results: function (data) {
                    return {
                        more: false,
                        results: data
                    }
                },
                data: function(term) {
                    return {q: term}
                },
                quietMillis: 100
            }
        })

        $el.change(function(changes) {
            var text = $el.select2('data').text;
            var val = changes.val;
            var loc = null;
            var center = function(place) {
                if (place.geometry.viewport) {
                    loc = place.geometry.viewport.getCenter();
                    _self.map.fitBounds(place.geometry.viewport);
                } else {
                    loc = place.geometry.location;
                    _self.map.setZoom(17);  // Why 17? Because it looks good.
                }
                var centerLoc = loc;
                if ($.isFunction(centerTransformation)) {
                    centerLoc = centerTransformation(loc)
                }
                _self.map.setCenter(centerLoc);
                $el.trigger('found', [text, loc])
            }
            if (val.indexOf(',')<0) {
                _self.placesService.getDetails({
                    reference: val
                }, function(result, status) {
                    center(result);
                })
            } else {
                center(lastResults[text])
            }
        })
    }

    AddressSearch.prototype = {
        $el: null,
        map: null,
        autocomplete: null,
        focus: function() {
            this.$el.select2('open')
        },
        destroy: function() {
            var _self = this;
            _self.autocomplete.unbind("bounds");
            gMap.event.removeListener(_self.events.autocompleteChange);
        }
    }
})(google.maps)