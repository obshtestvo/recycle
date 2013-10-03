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
            var val = this.$el.val();
            if ($.isArray(val)) {
                $.each(this.$el.val(), function (i, tag) {
                    tag = _self.recyclables[tag]
                    if ($.inArray(tag, tags) < 0) tags.push(tag)
                });
            }
            return tags;
        }
    }
})(google.maps)