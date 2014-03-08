/**
 * Export
 */
var RecycleServices;

(function(gMap) {

    RecycleServices = function(endpoint, $el, recyclables) {
        this.endpoint = endpoint;
        this.$el = $el;
        this.recyclables = recyclables;
    }
    RecycleServices.prototype = {
        endpoint: null,
        $el: null,
        find: function(data, callback) {
            $.get(this.endpoint, data, callback, 'json');
        },
        tags: function() {
            var tags = []
            var _self = this;
            var services = []
            $.each(this.$el.select2("data"), function (i, serviceObj) {
                services.push(serviceObj.id);
            });

            if ($.isArray(services)) {
                $.each(services, function (i, tag) {
                    tag = _self.recyclables[tag]
                    if ($.inArray(tag, tags) < 0) tags.push(tag)
                });
            }
            return tags;
        }
    }
})(google.maps)