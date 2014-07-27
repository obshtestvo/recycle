Selectize.define('no_results', function( options ) {
	var KEY_LEFT      = 37;
	var KEY_UP        = 38;
	var KEY_RIGHT     = 39;
	var KEY_DOWN      = 40;
	var KEY_RETURN    = 13;
    var ignoreKeys = [KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_RETURN]
    var self = this;

    options = $.extend({
        message: 'No results found.',
        html: function(data) {
            return '<div class="dropdown-empty-message">' + data.message + '</div>';
        }
    }, options );


    self.on('type', function(str) {
        if (!self.hasOptions) {
            self.$empty_results_container.show();
        } else {
            self.$empty_results_container.hide();
        }
    });

    self.onKeyUp = (function() {
        var original = self.onKeyUp;

        return function ( e ) {
            if (ignoreKeys.indexOf(e.keyCode) > -1) return;
            self.isOpen = false;
            original.apply( self, arguments );
        }
    })();

    self.onBlur = (function () {
        var original = self.onBlur;

        return function () {
            original.apply( self, arguments );
            self.$empty_results_container.hide();
        };
    })();

    self.setup = (function() {
        var original = self.setup;
        return function() {
            original.apply( self, arguments);
            self.$empty_results_container = $(
                options.html($.extend({
                    classNames: self.$input.attr( 'class' )
                }, options))
            );
            self.$empty_results_container.hide();
            self.$dropdown.append(self.$empty_results_container);
        };
    })();
});