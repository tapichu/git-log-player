window.animations = (function(undefined) {

    var timeUnit = 200,
        speed = 1,
        delta = 1.5;

    var duration = function() {
        return timeUnit / speed;
    };

    var faster = function(factor) {
        speed = speed * delta;
    };

    var slower = function(factor) {
        speed = speed / delta;
    };

    return {
        duration: function() {
            return duration();
        },
        faster: function() {
            faster();
        },
        slower: function() {
            slower();
        }
    };

})();
