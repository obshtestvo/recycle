// Enable the visual refresh
google.maps.visualRefresh = true;

var map;
function initialize() {
    var mapOptions = {
        zoom: 12,
        minZoom: 7,
        center: new google.maps.LatLng(42.693413, 23.322601),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false
    };


    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    var styles = [
//        {
//            "stylers": [
//                { "saturation": 31 },
//                { "gamma": 0.64 },
//                { "hue": "#99ff00" }
//            ]
//        },
        {
            "featureType": "poi.business",
            "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "featureType": "poi.sports_complex",
            "stylers": [
                { "visibility": "off" }
            ]
        }
    ];

    map.setOptions({styles: styles});
    var contentString = '<div id="add-new">' +
        'Тука ще е първа стъпка от Wizard-а за добавяне' +
        '<div id="step1">' +
        '<div id="streetview">' +
        '</div>' +
        '</div>' +
        '</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    var pano = null;
    var newMarker = null;

    google.maps.event.addListener(infowindow, 'domready', function () {
//        if (pano != null) {
//            pano.unbind("position");
//            pano.setVisible(false);
//        }
        pano = new google.maps.StreetViewPanorama(document.getElementById("streetview"), {
            navigationControl: true,
            navigationControlOptions: {style: google.maps.NavigationControlStyle.ANDROID},
            enableCloseButton: false,
            addressControl: false,
            linksControl: false
        });
        pano.bindTo("position", newMarker);
        pano.setVisible(true);
    });

    google.maps.event.addListener(infowindow, 'closeclick', function () {
        pano.unbind("position");
        pano.setVisible(false);
        pano = null;
    });


    function addMarker(location) {
        if (newMarker != null) {
            // or with callback and options for easing and duration in milliseconds. Needs jQuery Easing Plugin.
            newMarker.animateTo(location, {
                easing: "easeOutCubic",
                duration: 300
            });
            return;
        }
        newMarker = new google.maps.Marker({
            position: location,
            animation: google.maps.Animation.b,
            draggable: true,
//            title: "My new marker",
            icon: {
                url: '/img/pointer.png',
                size: new google.maps.Size(64, 64),
                // The origin for this image is 0,0.
                origin: new google.maps.Point(0, 0),
                // The anchor for this image is the base of the flagpole at 0,32.
                anchor: new google.maps.Point(23, 63)
            },
            map: map
        });
        setTimeout(function () {
            infowindow.open(map, newMarker);
        }, 200)
    }

    google.maps.event.addListener(map, 'click', function (event) {
        addMarker(event.latLng);
    });
}

google.maps.event.addDomListener(window, 'load', initialize);

$(function () {
    var $triggerAddNew = $('.floater a.add-new');

    // Once the "Add new spot" mode has been activated
    $triggerAddNew.click(function () {
        map.setOptions({draggableCursor: 'pointer'});
    })

    var $filter = $('.floater select');
    var $filterForm = $filter.closest('form');
    $filter.select2({
    })

    var recyclables = $filter.data('recyclables');
    $filter.change(function (e) {
        var tags = []
        $.each( e.val, function(i, tag){
            tag = recyclables[tag]
            if ($.inArray(tag, tags)==-1) tags.push(tag)
        });
        $.get($filterForm.data('action'), {'tags': tags}, function (data) {
            console.log(data)
        }, 'json')
    })
})