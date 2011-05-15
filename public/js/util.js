window.util = (function(undefined) {

    var createStyles = function(num) {
        var colors = [];
        for (var i = 0; i < num; i++) {
            colors[i] = {
                stroke: 'rgb(' +
                    i * Math.random() * 100 % 255 + ',' +
                    i * Math.random() * 100 % 255 + ',' +
                    i * Math.random() * 100 % 255 + ')',
                'stroke-width': 2,
                'stroke-linejoin': 'round',
                'stroke-linecap': 'round',
                'stroke-opacity': 0
            };
        }
        return colors;
    };

    var isValidRepoUrl = function(url) {
        return url && /\w+\/\w+/.test(url) && url !== 'user/repo';
    };

    return {
        createBranchStyles: function(num) {
            num = num || 100;
            return createStyles(num);
        },
        isValidRepo: function(url) {
            return isValidRepoUrl(url);
        }
    };

})();
