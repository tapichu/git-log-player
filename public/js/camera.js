window.camera = (function(_, undefined) {

    var camera = { x: 0, y: 0 },
        world = { x: 0, y: 0 };

    var moveCamera = function(delta, callback) {
        camera.x += delta;
        if (!animate.running || animate.paused) {
            moveWorld(callback);
        }
    };

    // This should probably be in canvas.js so sets is not global
    var moveWorld = function(callback) {
        var delta = camera.x - world.x;
        world.x = camera.x;

        canvas.sets().world.translate(-delta, 0);

        var minTime = (camera.x - 10) / dimensions.cell.w;
        var maxTime = minTime + dimensions.canvas.w / dimensions.cell.w;

        _.each(canvas.visible(), function(commit) {
            var notVisible = commit.time < minTime || commit.time > maxTime;
            if (notVisible) {
                if (commit.avatar) {
                    commit.avatar.remove();
                }
                _.each(commit.parents, function(parent) {
                    parent.connection.remove(); 
                });
            }
            // TODO: we're not cleaning up the visible array
        });

        if (callback) { callback(); }
    };

    return {
        x: function() {
            return camera.x;
        },
        y: function() {
            return camera.y;
        },
        move: function(delta, callback) {
            moveCamera(delta, callback);
        },
        moveWorld: function(callback) {
            moveWorld(callback);
        }
    };

})(window._);
