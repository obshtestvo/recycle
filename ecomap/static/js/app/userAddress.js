/**
 * Export
 */
var UserAddress;

(function(AddressSearch) {

    UserAddress = function ($el, geo, map, options) {
        this.eventCache = {}
        var _self = this;

        options = $.extend({
            ignoredAddressParts: [],
            inputSelector: 'div.change-address input.address',
            displaySelector: 'div.auto-location em',
            closeSelector: 'div.change-address a.close',
            triggerSelector: 'div.address a.change'
        }, options);

        _self.$container = $el;
        _self.$input = $(options.inputSelector);
        _self.$display = $(options.displaySelector);
        _self.$close = $(options.closeSelector);
        _self.$trigger = $(options.triggerSelector);
        _self.geo = geo;
        _self.map = map;


        _self.search = new AddressSearch(_self.$input, map)
        _self.$input.bind('found', function(e, text, loc, addressComponents) {
            _self.turnOffChange(_self.geo.human.getCity(addressComponents));
            _self.trigger('found');
        })

        _self.$trigger.click(function(e) {
            e.preventDefault();
            _self.trigger('show')
            _self.$container.removeClass('hide')
            _self.search.focus()
        })

        _self.$close.click(function(e) {
            e.preventDefault();
            _self.turnOffChange();
        })
    }

    UserAddress.prototype = $.extend({}, EventEmitter(), {
        $container: null,
        $input: null,
        $trigger: null,
        $close: null,
        $display: null,
        geo: null,
        map: null,
        search: null,
        ignoredAddressParts: null,

        turnOffChange: function(text) {
            var _self = this;
            if (text) {
                _self.$display.text(_self.geo.human.cleanAddress(text, _self.ignoredAddressParts))
            }
            _self.$container.addClass('hide');
            _self.trigger('hide');
        },

        update: function(id, text) {
            this.search.update(id, text);
        }
    });
})(AddressSearch)