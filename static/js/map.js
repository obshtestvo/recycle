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
    var contentString = '<div id="content">' +
        'Тука ще е първа стъпка от Wizard-а за добавяне' +
        '</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    var newMarker = null;


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
    var $filter = $('.floater select');
    var $filterForm = $filter.closest('form');
    $filter.select2()

    $filter.change(function(e){
        $.get($filterForm.data('action'), {'tags':e.val}, function(data) {
            console.log(data)
        }, 'json')
    })
})
