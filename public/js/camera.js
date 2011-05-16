window.camera = (function(_, undefined) {

    var camera = { x: 0, y: 0 },
        world = { x: 0, y: 0 };

    var moveCamera = function(xDelta, yDelta, callback) {
        camera.x += xDelta;
        camera.y += yDelta;
        if (camera.y < 0) { camera.y = 0; }

        if (!animate.running || animate.paused) {
            moveWorld(callback);
        }
    };

    var moveWorld = function(callback) {
        var xDelta = camera.x - world.x;
        var yDelta = camera.y - world.y;
        world.x = camera.x;
        world.y = camera.y;

        canvas.getWorld().translate(-xDelta, -yDelta);
        canvas.getDates().translate(-xDelta, 0);
        canvas.getHeader().toFront();
        canvas.getDates().toFront();

        // Remove elements not visible
        // checking the x-axis should be enough
        var minTime = (camera.x - 10) / dimensions.cell.w;
        var maxTime = minTime + dimensions.canvas.w / dimensions.cell.w;

        _.each(canvas.getVisible(), function(commit) {
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
        moveHor: function(delta, callback) {
            moveCamera(delta, 0, callback);
        },
        moveVer: function(delta, callback) {
            moveCamera(0, delta, callback);
        },
        move: function(xDelta, yDelta, callback) {
            moveCamera(xDelta, yDelta, callback);
        },
        moveWorld: function(callback) {
            moveWorld(callback);
        },
        reset: function() {
            camera = { x: 0, y: 0 },
            world = { x: 0, y: 0 };
        }
    };

})(window._);
