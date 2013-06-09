// Enable the visual refresh
google.maps.visualRefresh = true;

var map;
function initialize() {
    var mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(42.693413, 23.322601),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    var contentString = '<div id="content">' +
        'Тука ще е първа стъпка от Wizard-а за добавяне' +
        '</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    function addMarker(location) {
        var marker = new google.maps.Marker({
            position: location,
            animation: google.maps.Animation.b,
            draggable: true,
            title: "My new marker",
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
        setTimeout(function() {
            infowindow.open(map, marker);
        },200)
    }

    google.maps.event.addListener(map, 'click', function (event) {
        addMarker(event.latLng);
    });
}

google.maps.event.addDomListener(window, 'load', initialize);

$(function () {
    $('.floater select').select2()
})
