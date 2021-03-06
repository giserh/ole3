var opts = require('./config.js').getServerOptions();
var sp = require('spawn-sync');
var p = require('path');
var resolve = p.resolve.bind(p, __dirname);
var utils = require('./utils.js');
var depswriter = sp.bind(null, utils.relInPackage('google-closure-library', '../bin/build/depswriter.py'));
var fs = require('fs');


var writeDeps = function(statics) {
    var ind = -1;
    statics.map(function(js, i) {
        if (~js.indexOf('goog/base.js') && !~ind) {
            ind = i;
        }
    });
    var staticsSansBase = statics.slice();
    var base = staticsSansBase.splice(ind, 1).concat(opts.deps);
    staticsSansBase = staticsSansBase.map(function(f) {
        return '--path_with_depspath=' + f + ' ' + p.join(p.relative(utils.relInPackage('google-closure-library', '.'), resolve('../')), f);
    });
    res = depswriter(staticsSansBase, {cwd: resolve('..')});
    if (res.status !== 0) {
        return statics;
    }
    fs.writeFileSync(resolve(p.join('..', opts.deps)), res.stdout, {flag: 'w'});
    return base;
};

writeDeps(opts.statics);

module.exports = {
    writer: writeDeps
};
