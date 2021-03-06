var p = require('path');
var pjson = require(p.resolve('./package.json'));
var glob = require('glob');
var resolve = p.resolve.bind(p, __dirname);
var utils = require('./utils.js');

var getCss = function() {
    var css = [];
    return Object.keys(pjson.config.libs).map(function(key) {
        return utils.resolvePath(pjson.config.libs[key].css);
    }).filter(function(css) {return !!css; });
};

var globArray = function(arr) {
    if (arr && arr.map) {
        arr = arr.map(function(g) {
            return glob.sync(g, {
                cwd: resolve(p.join(__dirname, '..'))
            });
        });
        arr = flatten(arr);
    }
    return arr;
};

var flatten = function(arr) {
    var flat = [];
    arr.map(function(el) {
        if (el && el.map) {
            flat = flat.concat(flatten(el));
        } else {
            flat.push(el);
        }
    });
    return flat;
};

var getStatics = function() {
    var statics = getRelativeDistJs(pjson.config.compile.statics);
    statics.push.apply(statics, resolveGlobsRelative(pjson.config.js.map(utils.resolvePath)));
    return statics;
};

var getDynamics = function() {
    return getRelativeDistJs(pjson.config.compile.externs);
};

var getRelativeDistJs = function(libs) {
    jsGlobs = libs.map(function(key) {
        var lib = pjson.config.libs[key];
        var res = lib.distjs || lib.js;
        return utils.resolvePath(res);
    });
    return resolveGlobsRelative(jsGlobs);
};

var getAbsoluteJs = function(libs) {
    jsGlobs = libs.map(function(key) {
        lib = pjson.config.libs[key];
        return utils.resolvePath(lib.js);
    });
    return globArray(jsGlobs);
};

var getAbsoluteExtern = function(libs) {
    jsGlobs = libs.map(function(key) {
        lib = pjson.config.libs[key];
        return lib.externs.map(utils.resolvePath);
    });
    return globArray(flatten(jsGlobs));
};

var resolveGlobsRelative = function(globs) {
    return globArray(globs).map(function(absPath) {
        return p.relative(resolve('../'), absPath);
    });
};

var getServerOptions = function() {
    var opts = {
        dynamic: getDynamics(),
        statics: getStatics(),
        css: getCss(),
        dist: utils.resolvePath(pjson.config.dist),
        deps: utils.resolvePath(pjson.config.deps),
        main: utils.resolvePath(pjson.config.main)
    };
    return opts;
};

var getCompileOptions = function() {
    var opt = pjson.config.compile;
    statics = opt.statics;
    delete opt.statics;
    externs = opt.externs;
    delete opt.externs;
    opt.js = getAbsoluteJs(statics);
    opt.js.push.apply(opt.js, globArray(pjson.config.js.map(utils.resolvePath)));
    opt.externs = getAbsoluteExtern(externs.map(utils.resolvePath));
    opt.js_output_file = resolve(p.join('..', utils.resolvePath(pjson.config.dist)));
    return opt;
};

module.exports = {
    getServerOptions: getServerOptions,
    getCompileOptions: getCompileOptions
};
