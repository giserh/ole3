var http = require('http');
var fs = require('fs');
var p = require('path');
var resolve = p.resolve.bind(p, __dirname);
var opts = require('./config.js').getServerOptions();
var mime = require('mime');
var writeDeps = require('./deps-writer.js').writer;

var handleIndex = function(res, isDebug) {
    fs.readFile(resolve('../index.html'), {
                encoding: 'utf-8'
            }, function(err, index) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found!\n' + err);
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(includes(index, isDebug));
    });
};

var includes = function(index, isDebug) {
    var css = opts.css.map(function(css) {
        return '$1  <link rel="stylesheet" href="' + css + '">\n';
    });
    var js = opts.dynamic;
    js = isDebug ? js.concat(writeDeps(opts.statics)) : js.concat(opts.dist);
    js = js.map(function(js) {
        return '$1<script src="' + js + '"></script>\n';
    });
    index = index.replace(/( *)(\<\/head\>)/, css.join('') + '$1$2');
    index = index.replace(/( *)(\<\/body\>)/, js.join('') +
            (isDebug ? '<script>goog.require("' + opts.main + '");</script>\n' :
                ''));
    return index;
};

var handleFile = function(file, res) {
    var path = resolve('..' + file);
    fs.readFile(path, function(err, content) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found!\n' + err);
            return;
        }
        res.writeHead(200, {'Content-Type': mime.lookup(path)});
        res.end(content);
    });
};

var handler = function(req, res) {
    if (req.url == '/') {
        handleIndex(res, false);
    } else if (req.url == '/?debug') {
        handleIndex(res, true);
    } else {
        handleFile(req.url, res);
    }
    return;
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
};

http.createServer(handler).listen(3000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:3000/');

