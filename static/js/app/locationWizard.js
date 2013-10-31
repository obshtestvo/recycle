/**
 * Export
 */
var LocationWizard;

(function(AddressSearch, PopupAddNew, gMap) {

    LocationWizard = function ($el, geo, map, options) {
        var _self = this;

        options = $.extend({
            ignoredAddressParts: [],
            searchInputSelector: 'div.add-new input.new-address',
            displaySelector: 'div.add-new',
            closeSelector: 'div.add-new a.close',
            triggerSelector: '.floater a.add-new',
            template: ''
        }, options);

        _self.$container = $el;
        _self.$searchInput = $(options.searchInputSelector);
        _self.$display = $(options.displaySelector);
        _self.$close = $(options.closeSelector);
        _self.$trigger = $(options.triggerSelector);
        _self.geo = geo;
        _self.map = map;

        _self.search = new AddressSearch(_self.$searchInput, map, function(loc) {
            return geo.map.makeProportionallyRelativeLocation(map, loc, {height:30, width:0})
        })

        _self.$searchInput.bind('found', function(e, text, loc, addressComponents) {
            _self.popup.marker.setPosition(loc);
            _self.streetviewPicker.handleAvailability(loc);
            _self.popup.addressInfo = addressComponents;
            _self.$container.trigger('found');
        })

        _self.$trigger.click(function(e) {
            e.preventDefault();
            if (_self.$trigger.hasClass('active')) {
                _self.cancel();
                return;
            }
            _self.$container.trigger('show');
            _self.$trigger.addClass('active')
            _self.$container.removeClass('hide')
            var initialLocation = geo.map.getProportionallyRelativeLocation(map, {bottom: 10, left:50});

            _self.popup = new PopupAddNew({
                map: map,
                content: options.template,
                geo: geo,
                location: initialLocation
            });

            _self.popup.on('ready', function() {
                _self._integratePopup(_self.popup)
                _self.streetviewPicker = new StreetViewPicker($('.streetview'), _self.geo, {
                    closedPlaceholderSelector: '#step1 .cancelled-streetview',
                    unavailablePlaceholderSelector: '#step1 .missing-streetview',
                    closeSelector: '#step1 a.cancel-streetview',
                    triggerSelector: '#step1 a.reactivate',
                    availabilityRange: 50 // meters
                });
                _self._integrateStreetViewPicker(_self.streetviewPicker, _self.popup)

                var step1 = new Step1();
                var step2 = new Step2();
                var step3 = new Step3();

                step1.on('done', function() {
                //    var placeholderBase = 'http://placehold.it';
                //    var photoSize = {
                //        width: 300,
                //        height: 100
                //    };
                //    var placeholderSuffix = '';
                    var src = 'http://placehold.it/300x100';
                    if (_self.streetviewPicker.isActive()) {
                        src = _self.streetviewPicker.getSnapshotUrl(step2.$photo.width(), step2.$photo.height())
                    }
                    step2.refresh(src)
                    _self.popup.infowindow.switchContent(_self.popup.$infoWindowContainer, step1.$container, step2.$container, 100)
                    _self.popup.disableMoving();
                })

                step2.on('back', function() {
                    _self.popup.infowindow.switchContent(_self.popup.$infoWindowContainer, step2.$container, step1.$container, 100)
                    _self.popup.enableMoving();
                })

                step2.on('done', function() {
                    step2.block();

                    var location_data = _self.getMapInput();
                    data = {
                        'object_type'       : _self.popup.$infoWindowContainer.find("#object_type").val(),
                        'object_services'   : _self.popup.$infoWindowContainer.find("#object_services").val(),
                        'object_description': _self.popup.$infoWindowContainer.find("#object_description").val(),
                        'lat'               : location_data['loc']['lat'],
                        'lng'               : location_data['loc']['lng'],
                        'address'           : location_data['address']['simple']['street'],
                        'streetview_params' : JSON.stringify(location_data['streetview'])
                    }
                    $.ajax({
                      url: '/spots/',
                      type: 'PUT',
                      data: data,
                      success: function() {
                        step2.unblock();
                        _self.popup.infowindow.switchContent(_self.popup.$infoWindowContainer, step2.$container, step3.$container, 100);
                      }
                    });
                })

            })


        })

        _self.$close.click(function(e) {
            e.preventDefault();
            _self.cancel();
        })
    }

    LocationWizard.extractTemplateFrom = function(selector, removeNode) {
        var infoTemplate = $(selector);
        infoTemplate.find('.step.hide').css('display', 'none').removeClass('hide')
        var infoContent = infoTemplate.html();
        if (removeNode) {
            infoTemplate.remove();
        }
        return infoContent;
    }

    LocationWizard.prototype = {
        $container: null,
        $searchInput: null,
        $trigger: null,
        $close: null,
        $display: null,
        geo: null,
        map: null,
        popup: null,
        streetviewPicker: null,
        search: null,
        ignoredAddressParts: null,
        gMapListeners: [],

        /**
         * Cancels wizard
         */
        cancel: function() {
            var _self = this;
            $.each(_self.gMapListeners, function(i, listener) {
                gMap.event.removeListener(listener)
            })
            _self.gMapListeners = [];
            _self.popup.destroy()
            _self.popup = null;
            _self.$trigger.removeClass('active');
            _self.$searchInput.blur()
            _self.$container.addClass('hide')
            _self.$container.trigger('hide');
            _self.streetviewPicker.streetview.unbind("position");;
        },

        /**
         * Updates address based on passed location
         * @param loc
         * @private
         */
        _updateAddress: function(loc) {
            var _self = this;
            _self.geo.human.convertToAddress(loc, function(err, address) {
                if (!err) {
                    _self.popup.addressInfo = address.components;
                    _self.search.update(loc.toUrlValue(), address.full)
                }
            }, true)
        },

        /**
         * Integrates popup with other elements
         * @param popup
         * @private
         */
        _integratePopup: function(popup) {
            var _self = this;
            popup.on('move', function(loc) {
                _self._updateAddress(loc);
            })
            var infoWindowCloseListener = gMap.event.addListener(popup.infowindow, 'closeclick', function() {_self.cancel()});
            _self.gMapListeners.push(infoWindowCloseListener)
        },

        /**
         * Integrates streeti view with other elements
         * @param streetviewPicker
         * @private
         */
        _integrateStreetViewPicker: function(streetviewPicker, popup) {
            streetviewPicker.bindToMarker(popup.marker);
            popup.on('move', function(loc) {
                streetviewPicker.handleAvailability(loc);
            })
            streetviewPicker.handleAvailability(popup.marker.getPosition());
        },

        /**
         * Retrieves map-related input
         * @returns {{loc: {lat: *, lng: *}, streetview: {fov: *, heading: (*|Number), pitch: (*|CSSStyleDeclaration.pitch)}, address: {simple: {city: *, street: *, number: *}}}}
         */
        getMapInput: function() {
            var addressInfo = this.popup.addressInfo;
            var pov = this.streetviewPicker.streetview.getPov()
            var loc = this.popup.marker.getPosition()
            var values=[120, 90, 53.5, 28.3, 14.3, 10];
            var fov=values[Math.round(pov.zoom)];
            return {
                loc: {
                    lat: loc.lat(),
                    lng: loc.lng()
                },
                streetview: {
                    fov: fov,
                    heading: pov.heading,
                    pitch: pov.pitch
                },
                address: {
                    simple: {
                        city: this.geo.human.getCity(addressInfo),
                        street: this.geo.human.getStreetOrArea(addressInfo),
                        number: this.geo.human.getStreetNumber(addressInfo)
                    }
                }
            }
        }
    }


    var Step1 = function() {
        var _self = this;
        _self.$container = $('#step1');
        _self.$finishTrigger = _self.$container.find('a.accept');

        _self.$finishTrigger.click(function(e){
            e.preventDefault();
            _self.trigger('done');
        })
    }

    Step1.prototype = $.extend({}, EventEmitter(), {
        $container: null,
        $finishTrigger: null
    });

    var Step2 = function() {
        var _self = this;
        _self.$container = $('#step2');
        _self.$photo = _self.$container.find('.street img');
        _self.$back = _self.$container.find('a.back');
        _self.$finishTrigger = _self.$container.find('a.accept');

        _self.$back.click(function(e) {
            e.preventDefault();
            _self.trigger('back')
        });

        _self.$finishTrigger.click(function(e) {
            e.preventDefault();
            _self.trigger('done')
        });
    }

    Step2.prototype = $.extend({}, EventEmitter(), {
        $container: null,
        $photo: null,
        $back: null,
        $finishTrigger: null,

        refresh: function(photoUrl) {
            var _self = this;
            _self.$photo.attr('src', photoUrl);
        },

        block: function() {
            this.$container.block({
                message: null,
                overlayCSS: {
                    backgroundColor:'rgba(255, 255, 255, 0.6)',
                    opacity:1
                }
            });
            var $veil = this.$container.find('.blockOverlay');
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
            }).spin($veil.get(0))
        },

        unblock: function() {
            this.$container.unblock();
        }
    });

    var Step3 = function() {
        var _self = this;
        _self.$container = $('#step3');
    }

    Step3.prototype = $.extend({}, EventEmitter(), {
        $container: null
    })



})(AddressSearch, PopupAddNew, google.maps)


