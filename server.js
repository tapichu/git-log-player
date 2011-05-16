var express = require('express'),
    https = require('https');

var app = express.createServer();

// Configuration
app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);

    app.set('view engine', 'ejs');
    app.set('view options', {
        layout: false
    });
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

app.get('/static/*', function(req, res) {
    res.sendfile(__dirname + '/public/' + req.params[0]);
});

app.get('/', function(req, res) {
    res.render('index', {
        title: '',
        user: 'user',
        repo: 'repo'
    });
});

var githubRequest = function(path, req, res) {
    console.log('Making request to GitHub: %s', path);

    res.contentType('application/json');

    https.get({ host: 'github.com', path: path }, function(response) {
        console.log('GitHub replied with status code: %s', response.statusCode);

        response.on('data', function(data) {
            res.write(data);
        }).on('end', function() {
            res.end();
        });

    }).on('error', function(e) {
        console.log('Got error from GitHub: %s', e.message);
    });
};

app.get('/:user/:repo', function(req, res) {
    res.render('index', {
        title: ' - ' + req.params.user + '/' + req.params.repo,
        user: req.params.user,
        repo: req.params.repo
    });
});

app.get('/api/meta/:user/:repo', function(req, res) {
    console.log('Making network meta request to GitHub: %s/%s',
        req.params.user, req.params.repo
    );

    githubRequest(
        '/' + req.params.user + '/' + req.params.repo + '/network_meta',
        req, res
    );
});

app.get('/api/data/:user/:repo/:nethash/:commits', function(req, res) {
    console.log('Making network data request to GitHub: %s/%s',
        req.params.user, req.params.repo
    );

    githubRequest(
        '/' + req.params.user + '/' + req.params.repo +
            '/network_data_chunk?nethash=' + req.params.nethash +
            '&start=0&end=' + req.params.commits,
        req, res
    );
});

app.listen(process.env.PORT || 8000);
console.log('Express server started on port %s', app.address().port);
