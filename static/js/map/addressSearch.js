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
                    // remove timeout for displaying results
                }
            }
            _self.autocompleteService.getPlacePredictions($.extend({}, googleOptions, {
                'input': options.data.q
            }),
                function listentoresult(list, status) {
                    if (list == null || list.length == 0) {
                        _self.geocoder.geocode({
                            address: options.data.q,
                            componentRestrictions: googleOptions.componentRestrictions
                        }, function(list, status) {
                            lastResults = {};
                            var results = [];
                            $.each(list, function(i, loc) {
                                results.push({id: loc.geometry.location.toUrlValue(), text: loc.formatted_address})
                                lastResults[loc.formatted_address] = loc
                            })
                            options.success(results)
                        })
                    } else {
                        var results = []
                        $.each(list, function(i, loc) {
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
                console.log(place.geometry.viewport)
                if (place.geometry.viewport) {
                    loc = place.geometry.viewport.getCenter()
                    _self.map.fitBounds(place.geometry.viewport);
                } else {
                    loc = place.geometry.location
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


//        _self.autocomplete.bindTo('bounds', map);
//        _self.events.autocompleteChange = gMap.event.addListener(_self.autocomplete, 'place_changed', function() {
//            $el.removeClass('notfound');
//            var place = _self.autocomplete.getPlace();
//            // Inform the user if the place was not found.
//            if (!place.geometry) {
//                _self.autocompleteService.getPlacePredictions($.extend({}, options, {
//                    'input': $el.val()
//                }),
//                function listentoresult(list, status) {
//                    console.log(list, status)
//                    if(list == null || list.length == 0) {
//                        // There are no suggestions available.
//                        // The user saw an empty list and hit enter.
//                        console.log("No results");
//                    } else {
//                        // Here's the first result that the user saw
//                        // in the list. We can use it and it'll be just
//                        // as if the user actually selected it
//                        // themselves. But first we need to get its details
//                        // to receive the result on the same format as we
//                        // do in the AutoComplete.
//                        placesService = new google.maps.places.PlacesService(document.getElementById('placesAttribution'));
//                        placesService.getDetails(
//                            {'reference': list[0].reference},
//                            function detailsresult(detailsResult, placesServiceStatus) {
//                                // Here's the first result in the AutoComplete with the exact
//                                // same data format as you get from the AutoComplete.
//                                console.log("We selected the first item from the list automatically because the user didn't select anything");
//                                console.log(detailsResult);
//                            }
//                        );
//                    }
//                }
//            );
//                $el.addClass('notfound')
//                console.log('notfound')
//                return;
//            }
//            // If the place has a geometry, then present it on a map.
//            if (place.geometry.viewport) {
//                map.fitBounds(place.geometry.viewport);
//            } else {
//                map.setCenter(place.geometry.location);
//                map.setZoom(17);  // Why 17? Because it looks good.
//            }
//            // Ahmm?... building up address from address components instead of formatted_address?
//            if (place.address_components) {
//    //            console.log([
//    //                (place.address_components[0] && place.address_components[0].short_name || ''),
//    //                (place.address_components[1] && place.address_components[1].short_name || ''),
//    //                (place.address_components[2] && place.address_components[2].short_name || '')
//    //            ].join(' '));
//            }
//
//        })
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