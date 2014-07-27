


$(function() {
    $(document).on('mousedown', '.mCSB_scrollTools', function(e) {
        e.preventDefault()
        e.stopImmediatePropagation();
    })
})



var scrollUpdate = function($active) {
    var $scroller = $('.results-scroller:visible');
    var $cont = $scroller.find('.mCSB_container');

    var containerTopLine = Math.abs($cont.position().top);
    var containerHeight = $scroller.height()
    var containerBottomLine = containerTopLine + containerHeight;

    var optionHeight = $active.outerHeight()
    var activeTopLine   = $active.position().top
    var activeBottomLine   = activeTopLine + optionHeight

    var scrollTo;
    if (containerTopLine > activeTopLine) {
        scrollTo = $active
    }
    if (containerBottomLine < activeBottomLine) {
        scrollTo = activeTopLine-(containerHeight-optionHeight);
    }
    if (scrollTo) {
        $('.results-scroller').mCustomScrollbar('scrollTo', scrollTo, {
            scrollInertia:200
        })
    }
}


var customSelectizeScrollbars = function($el) {
    var selectize = $el[0].selectize;
    var $dropdown = selectize.$dropdown
    $dropdown.find(".selectize-dropdown-content").wrap('<div class="results-scroller"></div>')
    var $customScrollCont = $dropdown.find('.results-scroller');
    $customScrollCont.mCustomScrollbar({
        mouseWheel: true,
        advanced: {
            updateOnContentResize: true
        }
    });
    var KEY_UP   = 38;
    var KEY_DOWN = 40;
    selectize.$control_input.on('keydown', function(e) {
        if (!(e.keyCode == KEY_UP || e.keyCode == KEY_DOWN)) return;
        scrollUpdate(selectize.$activeOption)
    })
}




// Currently unused:

var safeCustomScroll = function(selector) {
    $(selector).wrap('<div class="results-scroller"></div>')
    $('.results-scroller').mCustomScrollbar({
        mouseWheel: true,
        advanced: {
            updateOnContentResize: true
        }
    });
}

var customSelect2Scrollbars = function($el) {
    $el.select2({
        formatNoMatches: function(searchTerm) {
            return $el.data('noMatches').replace('__material__', "'"+searchTerm+"'")
        },
        formatSelection: function(item) {
            return item.id
        }
    });
    safeCustomScroll(".select2-results")

    $el.on('select2-highlight', function (e) {
        scrollUpdate($('.select2-highlighted'))
    })
}