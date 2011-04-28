window.canvas = (function(Raphael, undefined) {

    var paper = null,
        sets = {},
        visible;

    var styles = {
        background: { fill: '#F2F2F2', stroke: 'none' },
        header: { fill: '#CCC', stroke: 'none' },
        frame: { stroke: '#BBB', 'stroke-width': 1 },
        day: { fill: 'black', font: '12px Arial', 'font-weight': 'bold' },
        month: { fill: 'black', font: '6px Arial' }
    };

    var months = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];

    var createCanvas = function(element) {
        if (paper === null) {
            paper = Raphael(element, dimensions.canvas.w, dimensions.canvas.h);
        } else {
            paper.clear();
        }

        sets.world = paper.set(),
        sets.world.push(
            sets.avatars = paper.set(),
            sets.branches = paper.set(),
            sets.dates = paper.set()
        );
        visible = [];
    };

    var renderBackdrop = function() {
        // Cavas background
        var background = paper.rect(0, 0, dimensions.canvas.w, dimensions.canvas.h)
            .attr(styles.background);

        // Dates header
        var header = paper.rect(0, 0, dimensions.canvas.w, dimensions.header.h)
            .attr(styles.header);

        // Frame
        var frame = paper.path(paths.create(
            ['M', 0, 0],
            ['L', dimensions.canvas.w, 0], ['L', dimensions.canvas.w, dimensions.canvas.h],
            ['L', 0, dimensions.canvas.h], ['L', 0, 0]
        )).attr(styles.frame);
    };

    var drawDate = function(date, x, time) {
        var day = paper.text(
            x, dimensions.day.h, date.getDate()
        ).attr(styles.day);
        sets.dates.push(day);

        var month = paper.text(
            x, dimensions.month.h, months[date.getMonth()]
        ).attr(styles.month);
        sets.dates.push(month);

        visible.push({
            time: time,
            parents: [
                { connection: day },
                { connection: month },
            ]
        });
    };

    return {
        create: function(element) {
            element = element || 'canvas';
            createCanvas(element);
        },
        drawBackdrop: function() {
            this.create();
            renderBackdrop();
        },
        drawDate: function(date, x, time) {
            drawDate(date, x, time);
        },
        addAvatar: function(avatar) {
            sets.avatars.push(avatar);
        },
        addBranch: function(branch) {
            sets.branches.push(branch);
        },
        addVisible: function(v) {
            visible.push(v);
        },
        getVisible: function() {
            return visible;
        },
        getWorld: function() {
            return sets.world;
        },
        newPath: function(path) {
            return paper.path(path);
        },
        newImage: function(image, x, y, w, h) {
            return paper.image(image, x, y, w, h);
        }
    };

})(window.Raphael);
