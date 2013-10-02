/**
 * Export
 */
var RecycleServices;

(function(gMap) {

    RecycleServices = function(endpoint) {
        this.endpoint = endpoint;
    }
    RecycleServices.prototype = {
        endpoint: null,
        find: function(coords, callback) {
            $.get(this.endpoint, {
                "coords": coords
            }, callback, 'json');
        }
    }
})(google.maps)