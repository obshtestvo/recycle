/**
 * Export
 */
var AddressSearch;

(function(gMap) {
    /**
     * Places autocomplete
     * @param $el
     * @param map
     * @param [centerTransformation]
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
        $el.selectize({
            searchConjunction: 'or',
            create: false,
            options: [],
            plugins: ['restore_on_backspace'],
            score: function(search) {
                return function(item) {
                    var score = 0;
                    if (item.source && item.source.pos) {
                        score = 1+item.source.pos
                    }
                    return score;
                };
            },
            load: function (query, callback) {
                if (!query.length) return callback();
                this.clearOptions()
                this.refreshOptions()
                _self.autocompleteService.getPlacePredictions($.extend({}, googleOptions, {
                    'input': query
                }), function (list, status) {
                    if (list == null || list.length == 0) {
                        _self.geocoder.geocode({
                            address: query,
                            componentRestrictions: googleOptions.componentRestrictions
                        }, function (list, status) {
                            lastResults = {};
                            var results = [];
                            var length = list.length;
                            $.each(list, function (i, loc) {
                                var value = loc.geometry.location.toUrlValue();
                                var text = loc.formatted_address;
                                if (!_self.pickerAPI.getOption(value).length) {
                                    results.push({value: value, text: text, source: {term: query, pos: length-i}})
                                }
                                lastResults[loc.formatted_address] = loc
                            })
                            callback(results)
                        })
                    } else {
                        var results = []
                        $.each(list, function (i, loc) {
                            var value = loc.place_id;
                            var text = loc.description;
                            var length = list.length;
                            if (!_self.pickerAPI.getOption(value).length) {
                                results.push({value: value, text: text, source: {term: query, pos: length-i}})
                            }
                        })
                        callback(results)
                    }
                });
            }
        });
        _self.pickerAPI = $el[0].selectize;
        customSelectizeScrollbars($el)

        _self.pickerAPI.on('change', function(val) {
            if (!val.length) return;
            var text = _self.pickerAPI.getOption(val).text()
            var loc = null;
            var finish = function(place) {
                if (typeof place != 'object') return;
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
                $el.trigger('found', [text, loc, place.address_components])
            }
            if (val.indexOf(',')<0) {
                _self.placesService.getDetails({
                    placeId: val
                }, function(result, status) {
                    finish(result);
                })
            } else {
                finish(lastResults[text])
            }
        })
    }

    AddressSearch.prototype = {
        $el: null,
        pickerAPI: null,
        map: null,
        autocomplete: null,

        focus: function() {
            this.$el[0].selectize.open()
        },

        update: function(id, text) {
            var pickerAPI = this.pickerAPI;
            pickerAPI.addOption({"value": id , "text": text })
            pickerAPI.setValue(id)
        },

        destroy: function() {
            var _self = this;
            _self.autocomplete.unbind("bounds");
            gMap.event.removeListener(_self.events.autocompleteChange);
        }
    }
})(google.maps)