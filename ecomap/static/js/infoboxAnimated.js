var toggleFixedHeight = function($el, isFixed) {
    if (isFixed) {
        $el.height($el.height()+'px');
        $el.css('overflow','hidden');
    } else {
        $el.css('height','');
        $el.css('overflow','auto');
    }
}

var InfoBoxAnimated = function() {
    InfoBox.apply(this, arguments);
}
InfoBoxAnimated.prototype = new InfoBox();
InfoBoxAnimated.prototype.switchContent = function($container, $hide, $show, speed, final) {
    var self = this;
    var $infoWindowContentContainer = $(this.div_);
    toggleFixedHeight($container, true)
    $container.animateContentSwitch($hide, $show, speed, {
        beforeShow: function (show) {
            // do stuff when both slides are hidden
            show();
        },
        step: function(width, meta) {
            if (meta.prop!='width') return;
            self.pixelOffset_ = new google.maps.Size(-width/2, 0);
            $infoWindowContentContainer.css('width', width)
            self.boxStyle_.width =  width;
            self.draw();
        },
        final: function () {
            toggleFixedHeight($container, false)
            if ($.isFunction( final )) {
                final()
            }
            // scroll window if needed
    //      var $resizeContainer = (window.opera) ? (document.compatMode=="CSS1Compat"? $('html') : $('body')) : $('html,body')
    //      $resizeContainer.animate({scrollTop: 300},300);
        }
    });
}
