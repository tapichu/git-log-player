window.paths = (function(_, undefined) {

    var borderRadius = 5;
    var arrow = { w: 4, h: 10 };

    var createPath = function() {
        return _(arguments).chain()
            .map(function(move) {
                return [ move[0], move.slice(1).join(',') ];
            }).flatten().value().join('');
    };

    var branchPath = function(px, py, cx, cy, upDown) {
        return [
            ['L', px, cy + borderRadius * upDown],
            ['S', px, cy, px + borderRadius, cy],
            ['L', cx, cy]
        ];
    };

    var mergePath = function(px, py, cx, cy, upDown) {
        return [
            ['L', cx - borderRadius, py],
            ['S', cx, py, cx, py + borderRadius * upDown],
            ['L', cx, cy]
        ];
    };

    var arrowPath = function(x, y, avatarHeight, upDown) {
        var result = [];
        // Horizontal
        if (_.isUndefined(upDown)) {
            result.push(
                ['M', x, y, x - arrow.h, y - arrow.w / 2,
                    x - arrow.h, y + arrow.w / 2],
                ['Z']
            );

        // Vertical
        } else {
            result.push(
                ['M', x, y + avatarHeight / 2 * upDown,
                    x - arrow.w / 2, y +
                        (avatarHeight / 2 + arrow.h) * upDown,
                    x + arrow.w / 2, y +
                        (avatarHeight / 2 + arrow.h) * upDown],
                ['Z']
            );
        }
        return result;
    };

    return {
        create: function() {
            return createPath.apply(null, arguments);
        },
        branch: function(px, py, cx, cy, upDown) {
            return branchPath(px, py, cx, cy, upDown);
        },
        merge: function(px, py, cx, cy, upDown) {
            return mergePath(px, py, cx, cy, upDown);
        },
        arrow: function(x, y, avatarHeight, upDown) {
            return arrowPath(x, y, avatarHeight, upDown);
        }
    };

})(window._);
