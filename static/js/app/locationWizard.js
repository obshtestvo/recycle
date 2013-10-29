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
            _self.popup.checkStreetView(loc);
            _self.popup.addressInfo = addressInfo;
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
            }, function(popup) {
                _self._integratePopup(popup)
            });

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
        search: null,
        ignoredAddressParts: null,
        gMapListeners: [],

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
        },

        _updateAddress: function(loc) {
            var _self = this;
            _self.geo.human.convertToAddress(loc, function(err, address) {
                if (!err) {
                    _self.popup.addressInfo = address.components;
                    _self.search.update(loc.toUrlValue(), address.full)
                }
            }, true)
        },

        _integratePopup: function(popup) {
            var _self = this;
            var markerMoveListener = gMap.event.addListener(popup.marker, 'position_changed_custom', function () {
                _self._updateAddress(popup.marker.getPosition());
            });
            _self.gMapListeners.push(markerMoveListener)
            var infoWindowCloseListener = gMap.event.addListener(popup.infowindow, 'closeclick', function() {_self.cancel()});
            _self.gMapListeners.push(infoWindowCloseListener)
        }
    }
})(AddressSearch, PopupAddNew, google.maps)