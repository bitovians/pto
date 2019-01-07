/*[system-bundles-config]*/
System.bundles = {"bundles/pto-tracker/app.css!":["styles.less!steal-less@1.3.4#less"],"bundles/pto-tracker/components/dashboard/dashboard":["lodash@4.17.11#lodash","xml-js@1.6.8#dist/xml-js","moment@2.23.0#moment","pto-tracker@0.1.0#models/time-entries","pto-tracker@0.1.0#components/dashboard/dashboard.stache!steal-stache@4.1.2#steal-stache","pto-tracker@0.1.0#components/dashboard/dashboard"],"bundles/pto-tracker/components/authenticate/authenticate":["pto-tracker@0.1.0#components/authenticate/authenticate.stache!steal-stache@4.1.2#steal-stache","pto-tracker@0.1.0#components/authenticate/authenticate"]};
/*npm-utils*/
define('npm-utils', function (require, exports, module) {
    (function (global, require, exports, module) {
        var slice = Array.prototype.slice;
        var npmModuleRegEx = /.+@.+\..+\..+#.+/;
        var conditionalModuleRegEx = /#\{[^\}]+\}|#\?.+$/;
        var gitUrlEx = /(git|http(s?)):\/\//;
        var supportsSet = typeof Set === 'function';
        var utils = {
            extend: function (d, s, deep, existingSet) {
                var val;
                var set = existingSet;
                if (deep) {
                    if (!set) {
                        if (supportsSet) {
                            set = new Set();
                        } else {
                            set = [];
                        }
                    }
                    if (supportsSet) {
                        if (set.has(s)) {
                            return s;
                        } else {
                            set.add(s);
                        }
                    } else {
                        if (set.indexOf(s) !== -1) {
                            return s;
                        } else {
                            set.push(s);
                        }
                    }
                }
                for (var prop in s) {
                    val = s[prop];
                    if (deep) {
                        if (utils.isArray(val)) {
                            d[prop] = slice.call(val);
                        } else if (utils.isPlainObject(val)) {
                            d[prop] = utils.extend({}, val, deep, set);
                        } else {
                            d[prop] = s[prop];
                        }
                    } else {
                        d[prop] = s[prop];
                    }
                }
                return d;
            },
            map: function (arr, fn) {
                var i = 0, len = arr.length, out = [];
                for (; i < len; i++) {
                    out.push(fn.call(arr, arr[i]));
                }
                return out;
            },
            filter: function (arr, fn) {
                var i = 0, len = arr.length, out = [], res;
                for (; i < len; i++) {
                    res = fn.call(arr, arr[i]);
                    if (res) {
                        out.push(arr[i]);
                    }
                }
                return out;
            },
            forEach: function (arr, fn) {
                var i = 0, len = arr.length;
                for (; i < len; i++) {
                    fn.call(arr, arr[i], i);
                }
            },
            flow: function (fns) {
                return function () {
                    var res = fns[0].apply(this, arguments);
                    for (var i = 1; i < fns.length; i++) {
                        res = fns[i].call(this, res);
                    }
                    return res;
                };
            },
            isObject: function (obj) {
                return typeof obj === 'object';
            },
            isPlainObject: function (obj) {
                return utils.isObject(obj) && (!obj || obj.__proto__ === Object.prototype);
            },
            isArray: Array.isArray || function (arr) {
                return Object.prototype.toString.call(arr) === '[object Array]';
            },
            isEnv: function (name) {
                return this.isEnv ? this.isEnv(name) : this.env === name;
            },
            isGitUrl: function (str) {
                return gitUrlEx.test(str);
            },
            warnOnce: function (msg) {
                var w = this._warnings = this._warnings || {};
                if (w[msg])
                    return;
                w[msg] = true;
                this.warn(msg);
            },
            warn: function (msg) {
                if (typeof steal !== 'undefined' && typeof console !== 'undefined' && console.warn) {
                    steal.done().then(function () {
                        if (steal.dev && steal.dev.warn) {
                        } else if (console.warn) {
                            console.warn('steal.js WARNING: ' + msg);
                        } else {
                            console.log(msg);
                        }
                    });
                }
            },
            relativeURI: function (baseURL, url) {
                return typeof steal !== 'undefined' ? steal.relativeURI(baseURL, url) : url;
            },
            moduleName: {
                create: function (descriptor, standard) {
                    if (standard) {
                        return descriptor.moduleName;
                    } else {
                        if (descriptor === '@empty') {
                            return descriptor;
                        }
                        var modulePath;
                        if (descriptor.modulePath) {
                            modulePath = descriptor.modulePath.substr(0, 2) === './' ? descriptor.modulePath.substr(2) : descriptor.modulePath;
                        }
                        var version = descriptor.version;
                        if (version && version[0] !== '^') {
                            version = encodeURIComponent(decodeURIComponent(version));
                        }
                        return descriptor.packageName + (version ? '@' + version : '') + (modulePath ? '#' + modulePath : '') + (descriptor.plugin ? descriptor.plugin : '');
                    }
                },
                isNpm: function (moduleName) {
                    return npmModuleRegEx.test(moduleName);
                },
                isConditional: function (moduleName) {
                    return conditionalModuleRegEx.test(moduleName);
                },
                isFullyConvertedNpm: function (parsedModuleName) {
                    return !!(parsedModuleName.packageName && parsedModuleName.version && parsedModuleName.modulePath);
                },
                isScoped: function (moduleName) {
                    return moduleName[0] === '@';
                },
                parse: function (moduleName, currentPackageName, global, context) {
                    var pluginParts = moduleName.split('!');
                    var modulePathParts = pluginParts[0].split('#');
                    var versionParts = modulePathParts[0].split('@');
                    if (!modulePathParts[1] && !versionParts[0]) {
                        versionParts = ['@' + versionParts[1]];
                    }
                    if (versionParts.length === 3 && utils.moduleName.isScoped(moduleName)) {
                        versionParts.splice(0, 1);
                        versionParts[0] = '@' + versionParts[0];
                    }
                    var packageName, modulePath;
                    if (currentPackageName && utils.path.isRelative(moduleName)) {
                        packageName = currentPackageName;
                        modulePath = versionParts[0];
                    } else if (currentPackageName && utils.path.isInHomeDir(moduleName, context)) {
                        packageName = currentPackageName;
                        modulePath = versionParts[0].split('/').slice(1).join('/');
                    } else {
                        if (modulePathParts[1]) {
                            packageName = versionParts[0];
                            modulePath = modulePathParts[1];
                        } else {
                            var folderParts = versionParts[0].split('/');
                            if (folderParts.length && folderParts[0][0] === '@') {
                                packageName = folderParts.splice(0, 2).join('/');
                            } else {
                                packageName = folderParts.shift();
                            }
                            modulePath = folderParts.join('/');
                        }
                    }
                    modulePath = utils.path.removeJS(modulePath);
                    return {
                        plugin: pluginParts.length === 2 ? '!' + pluginParts[1] : undefined,
                        version: versionParts[1],
                        modulePath: modulePath,
                        packageName: packageName,
                        moduleName: moduleName,
                        isGlobal: global
                    };
                },
                parseFromPackage: function (loader, refPkg, name, parentName) {
                    var packageName = utils.pkg.name(refPkg), parsedModuleName = utils.moduleName.parse(name, packageName, undefined, { loader: loader }), isRelative = utils.path.isRelative(parsedModuleName.modulePath);
                    if (isRelative && !parentName) {
                        throw new Error('Cannot resolve a relative module identifier ' + 'with no parent module:', name);
                    }
                    if (isRelative) {
                        var parentParsed = utils.moduleName.parse(parentName, packageName);
                        if (parentParsed.packageName === parsedModuleName.packageName && parentParsed.modulePath) {
                            var makePathRelative = true;
                            if (name === '../' || name === './' || name === '..') {
                                var relativePath = utils.path.relativeTo(parentParsed.modulePath, name);
                                var isInRoot = utils.path.isPackageRootDir(relativePath);
                                if (isInRoot) {
                                    parsedModuleName.modulePath = utils.pkg.main(refPkg);
                                    makePathRelative = false;
                                } else {
                                    parsedModuleName.modulePath = name + (utils.path.endsWithSlash(name) ? '' : '/') + 'index';
                                }
                            }
                            if (makePathRelative) {
                                parsedModuleName.modulePath = utils.path.makeRelative(utils.path.joinURIs(parentParsed.modulePath, parsedModuleName.modulePath));
                            }
                        }
                    }
                    var mapName = utils.moduleName.create(parsedModuleName), refSteal = utils.pkg.config(refPkg), mappedName;
                    if (refPkg.browser && typeof refPkg.browser !== 'string' && mapName in refPkg.browser && (!refSteal || !refSteal.ignoreBrowser)) {
                        mappedName = refPkg.browser[mapName] === false ? '@empty' : refPkg.browser[mapName];
                    }
                    var global = loader && loader.globalBrowser && loader.globalBrowser[mapName];
                    if (global) {
                        mappedName = global.moduleName === false ? '@empty' : global.moduleName;
                    }
                    if (mappedName) {
                        return utils.moduleName.parse(mappedName, packageName, !!global);
                    } else {
                        return parsedModuleName;
                    }
                },
                nameAndVersion: function (parsedModuleName) {
                    return parsedModuleName.packageName + '@' + parsedModuleName.version;
                },
                isBareIdentifier: function (identifier) {
                    return identifier && identifier[0] !== '.' && identifier[0] !== '@';
                }
            },
            pkg: {
                name: function (pkg) {
                    var steal = utils.pkg.config(pkg);
                    return steal && steal.name || pkg.name;
                },
                main: function (pkg) {
                    var main;
                    var steal = utils.pkg.config(pkg);
                    if (steal && steal.main) {
                        main = steal.main;
                    } else if (typeof pkg.browser === 'string') {
                        if (utils.path.endsWithSlash(pkg.browser)) {
                            main = pkg.browser + 'index';
                        } else {
                            main = pkg.browser;
                        }
                    } else if (typeof pkg.jam === 'object' && pkg.jam.main) {
                        main = pkg.jam.main;
                    } else if (pkg.main) {
                        main = pkg.main;
                    } else {
                        main = 'index';
                    }
                    return utils.path.removeJS(utils.path.removeDotSlash(main));
                },
                rootDir: function (pkg, isRoot) {
                    var root = isRoot ? utils.path.removePackage(pkg.fileUrl) : utils.path.pkgDir(pkg.fileUrl);
                    var lib = utils.pkg.directoriesLib(pkg);
                    if (lib) {
                        root = utils.path.joinURIs(utils.path.addEndingSlash(root), lib);
                    }
                    return root;
                },
                isRoot: function (loader, pkg) {
                    var root = utils.pkg.getDefault(loader);
                    return pkg && pkg.name === root.name && pkg.version === root.version;
                },
                homeAlias: function (context) {
                    return context && context.loader && context.loader.homeAlias || '~';
                },
                getDefault: function (loader) {
                    return loader.npmPaths.__default;
                },
                findByModuleNameOrAddress: function (loader, moduleName, moduleAddress) {
                    if (loader.npm) {
                        if (moduleName) {
                            var parsed = utils.moduleName.parse(moduleName);
                            if (parsed.version && parsed.packageName) {
                                var name = parsed.packageName + '@' + parsed.version;
                                if (name in loader.npm) {
                                    return loader.npm[name];
                                }
                            }
                        }
                        if (moduleAddress) {
                            var startingAddress = utils.relativeURI(loader.baseURL, moduleAddress);
                            var packageFolder = utils.pkg.folderAddress(startingAddress);
                            return packageFolder ? loader.npmPaths[packageFolder] : utils.pkg.getDefault(loader);
                        } else {
                            return utils.pkg.getDefault(loader);
                        }
                    }
                },
                folderAddress: function (address) {
                    var nodeModules = '/node_modules/', nodeModulesIndex = address.lastIndexOf(nodeModules), nextSlash = address.indexOf('/', nodeModulesIndex + nodeModules.length);
                    if (nodeModulesIndex >= 0) {
                        return nextSlash >= 0 ? address.substr(0, nextSlash) : address;
                    }
                },
                findDep: function (loader, refPkg, name) {
                    if (loader.npm && refPkg && !utils.path.startsWithDotSlash(name)) {
                        var nameAndVersion = name + '@' + refPkg.resolutions[name];
                        var pkg = loader.npm[nameAndVersion];
                        return pkg;
                    }
                },
                findDepWalking: function (loader, refPackage, name) {
                    if (loader.npm && refPackage && !utils.path.startsWithDotSlash(name)) {
                        var curPackage = utils.path.depPackageDir(refPackage.fileUrl, name);
                        while (curPackage) {
                            var pkg = loader.npmPaths[curPackage];
                            if (pkg) {
                                return pkg;
                            }
                            var parentAddress = utils.path.parentNodeModuleAddress(curPackage);
                            if (!parentAddress) {
                                return;
                            }
                            curPackage = parentAddress + '/' + name;
                        }
                    }
                },
                findByName: function (loader, name) {
                    if (loader.npm && !utils.path.startsWithDotSlash(name)) {
                        return loader.npm[name];
                    }
                },
                findByNameAndVersion: function (loader, name, version) {
                    if (loader.npm && !utils.path.startsWithDotSlash(name)) {
                        var nameAndVersion = name + '@' + version;
                        return loader.npm[nameAndVersion];
                    }
                },
                findByUrl: function (loader, url) {
                    if (loader.npm) {
                        var fullUrl = utils.pkg.folderAddress(url);
                        return loader.npmPaths[fullUrl];
                    }
                },
                directoriesLib: function (pkg) {
                    var steal = utils.pkg.config(pkg);
                    var lib = steal && steal.directories && steal.directories.lib;
                    var ignores = [
                            '.',
                            '/'
                        ], ignore;
                    if (!lib)
                        return undefined;
                    while (!!(ignore = ignores.shift())) {
                        if (lib[0] === ignore) {
                            lib = lib.substr(1);
                        }
                    }
                    return lib;
                },
                hasDirectoriesLib: function (pkg) {
                    var steal = utils.pkg.config(pkg);
                    return steal && steal.directories && !!steal.directories.lib;
                },
                findPackageInfo: function (context, pkg) {
                    var pkgInfo = context.pkgInfo;
                    if (pkgInfo) {
                        var out;
                        utils.forEach(pkgInfo, function (p) {
                            if (pkg.name === p.name && pkg.version === p.version) {
                                out = p;
                            }
                        });
                        return out;
                    }
                },
                saveResolution: function (context, refPkg, pkg) {
                    var npmPkg = utils.pkg.findPackageInfo(context, refPkg);
                    npmPkg.resolutions[pkg.name] = refPkg.resolutions[pkg.name] = pkg.version;
                },
                config: function (pkg) {
                    return pkg.steal || pkg.system;
                }
            },
            path: {
                makeRelative: function (path) {
                    if (utils.path.isRelative(path) && path.substr(0, 1) !== '/') {
                        return path;
                    } else {
                        return './' + path;
                    }
                },
                removeJS: function (path) {
                    return path.replace(/\.js(!|$)/, function (whole, part) {
                        return part;
                    });
                },
                removePackage: function (path) {
                    return path.replace(/\/package\.json.*/, '');
                },
                addJS: function (path) {
                    if (/\.m?js(on)?$/.test(path)) {
                        return path;
                    } else {
                        return path + '.js';
                    }
                },
                isRelative: function (path) {
                    return path.substr(0, 1) === '.';
                },
                isInHomeDir: function (path, context) {
                    return path.substr(0, 2) === utils.pkg.homeAlias(context) + '/';
                },
                joinURIs: function (baseUri, rel) {
                    function removeDotSegments(input) {
                        var output = [];
                        input.replace(/^(\.\.?(\/|$))+/, '').replace(/\/(\.(\/|$))+/g, '/').replace(/\/\.\.$/, '/../').replace(/\/?[^\/]*/g, function (p) {
                            if (p === '/..') {
                                output.pop();
                            } else {
                                output.push(p);
                            }
                        });
                        return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
                    }
                    var href = parseURI(rel || '');
                    var base = parseURI(baseUri || '');
                    return !href || !base ? null : (href.protocol || base.protocol) + (href.protocol || href.authority ? href.authority : base.authority) + removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : href.pathname ? (base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname : base.pathname) + (href.protocol || href.authority || href.pathname ? href.search : href.search || base.search) + href.hash;
                },
                startsWithDotSlash: function (path) {
                    return path.substr(0, 2) === './';
                },
                removeDotSlash: function (path) {
                    return utils.path.startsWithDotSlash(path) ? path.substr(2) : path;
                },
                endsWithSlash: function (path) {
                    return path[path.length - 1] === '/';
                },
                addEndingSlash: function (path) {
                    return utils.path.endsWithSlash(path) ? path : path + '/';
                },
                depPackage: function (parentPackageAddress, childName) {
                    var packageFolderName = parentPackageAddress.replace(/\/package\.json.*/, '');
                    return (packageFolderName ? packageFolderName + '/' : '') + 'node_modules/' + childName + '/package.json';
                },
                peerPackage: function (parentPackageAddress, childName) {
                    var packageFolderName = parentPackageAddress.replace(/\/package\.json.*/, '');
                    return packageFolderName.substr(0, packageFolderName.lastIndexOf('/')) + '/' + childName + '/package.json';
                },
                depPackageDir: function (parentPackageAddress, childName) {
                    return utils.path.depPackage(parentPackageAddress, childName).replace(/\/package\.json.*/, '');
                },
                peerNodeModuleAddress: function (address) {
                    var nodeModules = '/node_modules/', nodeModulesIndex = address.lastIndexOf(nodeModules);
                    if (nodeModulesIndex >= 0) {
                        return address.substr(0, nodeModulesIndex + nodeModules.length - 1);
                    }
                },
                parentNodeModuleAddress: function (address) {
                    var nodeModules = '/node_modules/', nodeModulesIndex = address.lastIndexOf(nodeModules), prevModulesIndex = address.lastIndexOf(nodeModules, nodeModulesIndex - 1);
                    if (prevModulesIndex >= 0) {
                        return address.substr(0, prevModulesIndex + nodeModules.length - 1);
                    }
                },
                pkgDir: function (address) {
                    var nodeModules = '/node_modules/', nodeModulesIndex = address.lastIndexOf(nodeModules), nextSlash = address.indexOf('/', nodeModulesIndex + nodeModules.length);
                    if (address[nodeModulesIndex + nodeModules.length] === '@') {
                        nextSlash = address.indexOf('/', nextSlash + 1);
                    }
                    if (nodeModulesIndex >= 0) {
                        return nextSlash >= 0 ? address.substr(0, nextSlash) : address;
                    }
                },
                basename: function (address) {
                    var parts = address.split('/');
                    return parts[parts.length - 1];
                },
                relativeTo: function (modulePath, rel) {
                    var parts = modulePath.split('/');
                    var idx = 1;
                    while (rel[idx] === '.') {
                        parts.pop();
                        idx++;
                    }
                    return parts.join('/');
                },
                isPackageRootDir: function (pth) {
                    return pth.indexOf('/') === -1;
                }
            },
            json: {
                transform: function (loader, load, data) {
                    data.steal = utils.pkg.config(data);
                    var fn = loader.jsonOptions && loader.jsonOptions.transform;
                    if (!fn)
                        return data;
                    return fn.call(loader, load, data);
                }
            },
            includeInBuild: true
        };
        function parseURI(url) {
            var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@\/]*(?::[^:@\/]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
            return m ? {
                href: m[0] || '',
                protocol: m[1] || '',
                authority: m[2] || '',
                host: m[3] || '',
                hostname: m[4] || '',
                port: m[5] || '',
                pathname: m[6] || '',
                search: m[7] || '',
                hash: m[8] || ''
            } : null;
        }
        module.exports = utils;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*npm-extension*/
define('npm-extension', [
    'require',
    'exports',
    'module',
    '@steal',
    './npm-utils'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'format cjs';
        var steal = require('@steal');
        var utils = require('./npm-utils');
        exports.includeInBuild = true;
        var isNode = typeof process === 'object' && {}.toString.call(process) === '[object process]';
        var isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        var isElectron = isNode && !!process.versions.electron;
        var isBrowser = typeof window !== 'undefined' && (!isNode || isElectron) && !isWorker;
        exports.addExtension = function addNpmExtension(System) {
            if (System._extensions) {
                System._extensions.push(addNpmExtension);
            }
            var oldNormalize = System.normalize;
            System.normalize = function (identifier, parentModuleName, parentAddress, pluginNormalize) {
                var name = identifier;
                var parentName = parentModuleName;
                if (parentName && this.npmParentMap && this.npmParentMap[parentName]) {
                    parentName = this.npmParentMap[parentName];
                }
                var hasNoParent = !parentName;
                var nameIsRelative = utils.path.isRelative(name);
                var parentIsNpmModule = utils.moduleName.isNpm(parentName);
                var identifierEndsWithSlash = utils.path.endsWithSlash(name);
                if (parentName && nameIsRelative && !parentIsNpmModule) {
                    return oldNormalize.call(this, name, parentName, parentAddress, pluginNormalize);
                }
                if (utils.moduleName.isConditional(name)) {
                    return oldNormalize.call(this, name, parentName, parentAddress, pluginNormalize);
                }
                var hasContextualMap = typeof this.map[parentName] === 'object' && this.map[parentName][name];
                if (hasContextualMap) {
                    return oldNormalize.call(this, name, parentName, parentAddress, pluginNormalize);
                }
                var refPkg = utils.pkg.findByModuleNameOrAddress(this, parentName, parentAddress);
                if (!refPkg) {
                    return oldNormalize.call(this, name, parentName, parentAddress, pluginNormalize);
                }
                var isPointingAtParentFolder = name === '../' || name === './';
                if (parentIsNpmModule && isPointingAtParentFolder) {
                    var parsedParentModuleName = utils.moduleName.parse(parentName);
                    var parentModulePath = parsedParentModuleName.modulePath || '';
                    var relativePath = utils.path.relativeTo(parentModulePath, name);
                    var isInRoot = utils.path.isPackageRootDir(relativePath);
                    if (isInRoot) {
                        name = refPkg.name + '#' + utils.path.removeJS(utils.path.removeDotSlash(refPkg.main));
                    } else {
                        name = name + 'index';
                    }
                }
                var parsedModuleName = utils.moduleName.parseFromPackage(this, refPkg, name, parentName);
                var isRoot = utils.pkg.isRoot(this, refPkg);
                var parsedPackageNameIsReferringPackage = parsedModuleName.packageName === refPkg.name;
                var isRelativeToParentNpmModule = parentIsNpmModule && nameIsRelative && parsedPackageNameIsReferringPackage;
                var depPkg, wantedPkg;
                if (isRelativeToParentNpmModule) {
                    depPkg = refPkg;
                }
                var context = this.npmContext;
                var crawl = context && context.crawl;
                var isDev = !!crawl;
                if (!depPkg) {
                    if (crawl) {
                        var parentPkg = nameIsRelative ? null : crawl.matchedVersion(context, refPkg.name, refPkg.version);
                        if (parentPkg) {
                            var depMap = crawl.getFullDependencyMap(this, parentPkg, isRoot);
                            wantedPkg = depMap[parsedModuleName.packageName];
                            if (wantedPkg) {
                                var wantedVersion = refPkg.resolutions && refPkg.resolutions[wantedPkg.name] || wantedPkg.version;
                                var foundPkg = crawl.matchedVersion(this.npmContext, wantedPkg.name, wantedVersion);
                                if (foundPkg) {
                                    depPkg = utils.pkg.findByUrl(this, foundPkg.fileUrl);
                                }
                            }
                        }
                    } else {
                        if (isRoot) {
                            depPkg = utils.pkg.findDepWalking(this, refPkg, parsedModuleName.packageName);
                        } else {
                            depPkg = utils.pkg.findDep(this, refPkg, parsedModuleName.packageName);
                        }
                    }
                }
                if (parsedPackageNameIsReferringPackage) {
                    depPkg = utils.pkg.findByNameAndVersion(this, parsedModuleName.packageName, refPkg.version);
                }
                var lookupByName = parsedModuleName.isGlobal || hasNoParent;
                if (!depPkg) {
                    depPkg = utils.pkg.findByName(this, parsedModuleName.packageName);
                }
                var isThePackageWeWant = !isDev || !depPkg || (wantedPkg ? crawl.pkgSatisfies(depPkg, wantedPkg.version) : true);
                if (!isThePackageWeWant) {
                    depPkg = undefined;
                } else if (isDev && depPkg) {
                    utils.pkg.saveResolution(context, refPkg, depPkg);
                }
                if (!depPkg) {
                    var browserPackageName = this.globalBrowser[parsedModuleName.packageName];
                    if (browserPackageName) {
                        parsedModuleName.packageName = browserPackageName.moduleName;
                        depPkg = utils.pkg.findByName(this, parsedModuleName.packageName);
                    }
                }
                if (!depPkg && isRoot && name === refPkg.main && utils.pkg.hasDirectoriesLib(refPkg)) {
                    parsedModuleName.version = refPkg.version;
                    parsedModuleName.packageName = refPkg.name;
                    parsedModuleName.modulePath = utils.pkg.main(refPkg);
                    return oldNormalize.call(this, utils.moduleName.create(parsedModuleName), parentName, parentAddress, pluginNormalize);
                }
                var loader = this;
                if (!depPkg) {
                    if (crawl) {
                        var parentPkg = crawl.matchedVersion(this.npmContext, refPkg.name, refPkg.version);
                        if (parentPkg) {
                            var depMap = crawl.getFullDependencyMap(this, parentPkg, isRoot);
                            depPkg = depMap[parsedModuleName.packageName];
                            if (!depPkg) {
                                var parents = crawl.findPackageAndParents(this.npmContext, parsedModuleName.packageName);
                                if (parents) {
                                    depPkg = parents.package;
                                }
                            }
                        }
                    }
                    if (!depPkg) {
                        if (refPkg.browser && refPkg.browser[name]) {
                            return oldNormalize.call(this, refPkg.browser[name], parentName, parentAddress, pluginNormalize);
                        }
                        var steal = utils.pkg.config(refPkg);
                        if (steal && steal.map && typeof steal.map[name] === 'string') {
                            var mappedName = steal.map[name];
                            var envConfig = steal.envs && steal.envs[loader.env];
                            if (envConfig && envConfig.map && typeof envConfig.map[name] === 'string') {
                                mappedName = envConfig.map[name];
                            }
                            return loader.normalize(mappedName, parentName, parentAddress, pluginNormalize);
                        } else {
                            return oldNormalize.call(this, name, parentName, parentAddress, pluginNormalize);
                        }
                    }
                    return crawl.dep(this.npmContext, parentPkg, refPkg, depPkg, isRoot).then(createModuleNameAndNormalize);
                } else {
                    return createModuleNameAndNormalize(depPkg);
                }
                function createModuleNameAndNormalize(depPkg) {
                    parsedModuleName.version = depPkg.version;
                    if (!parsedModuleName.modulePath) {
                        parsedModuleName.modulePath = utils.pkg.main(depPkg);
                    }
                    var p = oldNormalize.call(loader, utils.moduleName.create(parsedModuleName), parentName, parentAddress, pluginNormalize);
                    if (identifierEndsWithSlash) {
                        p.then(function (name) {
                            if (context && context.forwardSlashMap) {
                                context.forwardSlashMap[name] = true;
                            }
                        });
                    }
                    return p;
                }
            };
            var oldLocate = System.locate;
            System.locate = function (load) {
                var parsedModuleName = utils.moduleName.parse(load.name), loader = this;
                var pmn = load.metadata.parsedModuleName = parsedModuleName;
                load.metadata.npmPackage = utils.pkg.findByNameAndVersion(this, pmn.packageName, pmn.version);
                if (parsedModuleName.version && this.npm && !loader.paths[load.name]) {
                    var pkg = this.npm[utils.moduleName.nameAndVersion(parsedModuleName)];
                    if (pkg) {
                        return oldLocate.call(this, load).then(function (locatedAddress) {
                            var address = locatedAddress;
                            var expectedAddress = utils.path.joinURIs(System.baseURL, load.name);
                            if (isBrowser) {
                                expectedAddress = expectedAddress.replace(/#/g, '%23');
                            }
                            if (address !== expectedAddress + '.js' && address !== expectedAddress) {
                                return address;
                            }
                            var root = utils.pkg.rootDir(pkg, utils.pkg.isRoot(loader, pkg));
                            if (parsedModuleName.modulePath) {
                                var npmAddress = utils.path.joinURIs(utils.path.addEndingSlash(root), parsedModuleName.plugin ? parsedModuleName.modulePath : utils.path.addJS(parsedModuleName.modulePath));
                                address = typeof steal !== 'undefined' ? utils.path.joinURIs(loader.baseURL, npmAddress) : npmAddress;
                            }
                            return address;
                        });
                    }
                }
                return oldLocate.call(this, load);
            };
            var oldFetch = System.fetch;
            System.fetch = function (load) {
                if (load.metadata.dryRun) {
                    return oldFetch.apply(this, arguments);
                }
                var loader = this;
                var context = loader.npmContext;
                var fetchPromise = Promise.resolve(oldFetch.apply(this, arguments));
                if (utils.moduleName.isNpm(load.name)) {
                    fetchPromise = fetchPromise.then(null, function (err) {
                        var statusCode = err.statusCode;
                        if (statusCode !== 404 && statusCode !== 0) {
                            return Promise.reject(err);
                        }
                        if (!loader.npmContext) {
                            loader.npmContext = { forwardSlashMap: {} };
                        }
                        var types = [].slice.call(retryTypes);
                        return retryAll(types, err).then(null, function (e) {
                            return Promise.reject(err);
                        });
                        function retryAll(types, err) {
                            if (!types.length) {
                                throw err;
                            }
                            var type = types.shift();
                            if (!type.test(load)) {
                                throw err;
                            }
                            return Promise.resolve(retryFetch.call(loader, load, type)).then(null, function (err) {
                                return retryAll(types, err);
                            });
                        }
                    });
                }
                return fetchPromise.catch(function (error) {
                    var statusCode = error.statusCode;
                    if ((statusCode === 404 || statusCode === 0) && utils.moduleName.isBareIdentifier(load.name) && !utils.pkg.isRoot(loader, load.metadata.npmPackage)) {
                        var newError = new Error([
                            'Could not load \'' + load.name + '\'',
                            'Is this an npm module not saved in your package.json?'
                        ].join('\n'));
                        newError.statusCode = error.statusCode;
                        throw newError;
                    } else {
                        throw error;
                    }
                });
            };
            var convertName = function (loader, name) {
                var pkg = utils.pkg.findByName(loader, name.split('/')[0]);
                if (pkg) {
                    var parsed = utils.moduleName.parse(name, pkg.name);
                    parsed.version = pkg.version;
                    if (!parsed.modulePath) {
                        parsed.modulePath = utils.pkg.main(pkg);
                    }
                    return utils.moduleName.create(parsed);
                }
                return name;
            };
            var configSpecial = {
                map: function (map) {
                    var newMap = {}, val;
                    for (var name in map) {
                        val = map[name];
                        newMap[convertName(this, name)] = typeof val === 'object' ? configSpecial.map(val) : convertName(this, val);
                    }
                    return newMap;
                },
                meta: function (map) {
                    var newMap = {};
                    for (var name in map) {
                        newMap[convertName(this, name)] = map[name];
                    }
                    return newMap;
                },
                paths: function (paths) {
                    var newPaths = {};
                    for (var name in paths) {
                        newPaths[convertName(this, name)] = paths[name];
                    }
                    return newPaths;
                }
            };
            var oldConfig = System.config;
            System.config = function (cfg) {
                var loader = this;
                if (loader.npmContext) {
                    var context = loader.npmContext;
                    var pkg = context.versions.__default;
                    var conv = context.convert.steal(context, pkg, cfg, true);
                    context.convert.updateConfigOnPackageLoad(conv, false, true, context.applyBuildConfig);
                    oldConfig.apply(loader, arguments);
                    return;
                }
                for (var name in cfg) {
                    if (configSpecial[name]) {
                        cfg[name] = configSpecial[name].call(loader, cfg[name]);
                    }
                }
                oldConfig.apply(loader, arguments);
            };
            var newLoader = System._newLoader || Function.prototype;
            System._newLoader = function (loader) {
                loader.npmContext = this.npmContext;
                loader.npmParentMap = this.npmParentMap;
                return newLoader.apply(this, arguments);
            };
            steal.addNpmPackages = function (npmPackages) {
                var packages = npmPackages || [];
                var loader = this.loader;
                for (var i = 0; i < packages.length; i += 1) {
                    var pkg = packages[i];
                    var path = pkg && pkg.fileUrl;
                    if (path) {
                        loader.npmContext.paths[path] = pkg;
                    }
                }
            };
            steal.getNpmPackages = function () {
                var context = this.loader.npmContext;
                return context ? context.packages || [] : [];
            };
            function retryFetch(load, type) {
                var loader = this;
                var moduleName = typeof type.name === 'function' ? type.name(loader, load) : load.name + type.name;
                var local = utils.extend({}, load);
                local.name = moduleName;
                local.metadata = { dryRun: true };
                return Promise.resolve(loader.locate(local)).then(function (address) {
                    local.address = address;
                    return loader.fetch(local);
                }).then(function (source) {
                    load.metadata.address = local.address;
                    loader.npmParentMap[load.name] = local.name;
                    var npmLoad = loader.npmContext && loader.npmContext.npmLoad;
                    if (npmLoad) {
                        npmLoad.saveLoadIfNeeded(loader.npmContext);
                        if (!isNode) {
                            utils.warnOnce('Some 404s were encountered ' + 'while loading. Don\'t panic! ' + 'These will only happen in dev ' + 'and are harmless.');
                        }
                    }
                    return source;
                });
            }
            var retryTypes = [
                {
                    name: function (loader, load) {
                        var context = loader.npmContext;
                        if (context.forwardSlashMap[load.name]) {
                            var parts = load.name.split('/');
                            parts.pop();
                            return parts.concat(['index']).join('/');
                        }
                        return load.name + '/index';
                    },
                    test: function () {
                        return true;
                    }
                },
                {
                    name: '.json',
                    test: function (load) {
                        return utils.moduleName.isNpm(load.name) && utils.path.basename(load.address) === 'package.js';
                    }
                }
            ];
        };
    }(function () {
        return this;
    }(), require, exports, module));
});
/*npm-load*/
define('npm-load', [], function(){ return {}; });
/*semver*/
define('semver', [], function(){ return {}; });
/*npm-crawl*/
define('npm-crawl', [], function(){ return {}; });
/*npm-convert*/
define('npm-convert', [], function(){ return {}; });
/*npm*/
define('npm', [], function(){ return {}; });
/*package.json!npm*/
define('package.json!npm', [
    '@loader',
    'npm-extension',
    'module'
], function (loader, npmExtension, module) {
    npmExtension.addExtension(loader);
    if (!loader.main) {
        loader.main = 'pto-tracker@0.1.0#app';
    }
    loader._npmExtensions = [].slice.call(arguments, 2);
    (function (loader, packages, options) {
        var g = loader.global;
        if (!g.process) {
            g.process = {
                argv: [],
                cwd: function () {
                    var baseURL = loader.baseURL;
                    return baseURL;
                },
                browser: true,
                env: { NODE_ENV: loader.env },
                version: '',
                platform: navigator && navigator.userAgent && /Windows/.test(navigator.userAgent) ? 'win' : ''
            };
        }
        if (!loader.npm) {
            loader.npm = {};
            loader.npmPaths = {};
            loader.globalBrowser = {};
        }
        if (!loader.npmParentMap) {
            loader.npmParentMap = options.npmParentMap || {};
        }
        var rootPkg = loader.npmPaths.__default = packages[0];
        var rootConfig = rootPkg.steal || rootPkg.system;
        var lib = rootConfig && rootConfig.directories && rootConfig.directories.lib;
        var setGlobalBrowser = function (globals, pkg) {
            for (var name in globals) {
                loader.globalBrowser[name] = {
                    pkg: pkg,
                    moduleName: globals[name]
                };
            }
        };
        var setInNpm = function (name, pkg) {
            if (!loader.npm[name]) {
                loader.npm[name] = pkg;
            }
            loader.npm[name + '@' + pkg.version] = pkg;
        };
        var forEach = function (arr, fn) {
            var i = 0, len = arr.length;
            for (; i < len; i++) {
                res = fn.call(arr, arr[i], i);
                if (res === false)
                    break;
            }
        };
        var setupLiveReload = function () {
            if (loader.liveReloadInstalled) {
                loader['import']('live-reload', { name: module.id }).then(function (reload) {
                    reload.dispose(function () {
                        var pkgInfo = loader.npmContext.pkgInfo;
                        delete pkgInfo[rootPkg.name + '@' + rootPkg.version];
                        var idx = -1;
                        forEach(pkgInfo, function (pkg, i) {
                            if (pkg.name === rootPkg.name && pkg.version === rootPkg.version) {
                                idx = i;
                                return false;
                            }
                        });
                        pkgInfo.splice(idx, 1);
                    });
                });
            }
        };
        var ignoredConfig = [
            'bundle',
            'configDependencies',
            'transpiler',
            'treeShaking'
        ];
        packages.reverse();
        forEach(packages, function (pkg) {
            var steal = pkg.steal || pkg.system;
            if (steal) {
                var main = steal.main;
                delete steal.main;
                var configDeps = steal.configDependencies;
                if (pkg !== rootPkg) {
                    forEach(ignoredConfig, function (name) {
                        delete steal[name];
                    });
                }
                loader.config(steal);
                if (pkg === rootPkg) {
                    steal.configDependencies = configDeps;
                }
                steal.main = main;
            }
            if (pkg.globalBrowser) {
                var doNotApplyGlobalBrowser = pkg.name === 'steal' && rootConfig.builtins === false;
                if (!doNotApplyGlobalBrowser) {
                    setGlobalBrowser(pkg.globalBrowser, pkg);
                }
            }
            var systemName = steal && steal.name;
            if (systemName) {
                setInNpm(systemName, pkg);
            } else {
                setInNpm(pkg.name, pkg);
            }
            if (!loader.npm[pkg.name]) {
                loader.npm[pkg.name] = pkg;
            }
            loader.npm[pkg.name + '@' + pkg.version] = pkg;
            var pkgAddress = pkg.fileUrl.replace(/\/package\.json.*/, '');
            loader.npmPaths[pkgAddress] = pkg;
        });
        setupLiveReload();
        forEach(loader._npmExtensions || [], function (ext) {
            if (ext.systemConfig) {
                loader.config(ext.systemConfig);
            }
        });
    }(loader, [
        {
            'name': 'pto-tracker',
            'version': '0.1.0',
            'fileUrl': './package.json',
            'main': 'app.js',
            'steal': {
                'map': { 'xml-js@1.6.8#lib/index': 'xml-js@1.6.8#dist/xml-js' },
                'meta': { 'xml-js@1.6.8#dist/xml-js': { 'format': 'global' } },
                'plugins': [
                    'can',
                    'steal-less'
                ],
                'npmAlgorithm': 'flat'
            },
            'resolutions': {
                'pto-tracker': '0.1.0',
                'can': '5.21.4',
                'steal-stache': '4.1.2',
                'steal-less': '1.3.4',
                'can-stache': '4.17.5',
                'can-view-import': '4.2.1',
                'can-stache-bindings': '4.8.0',
                'lodash': '4.17.11',
                'moment': '2.23.0',
                'xml-js': '1.6.8'
            }
        },
        {
            'name': 'steal-less',
            'version': '1.3.4',
            'fileUrl': './node_modules/steal-less/package.json',
            'main': 'less.js',
            'steal': {
                'plugins': ['steal-css'],
                'envs': {
                    'build': { 'map': { 'steal-less/less-engine': 'steal-less/less-engine-node' } },
                    'server-development': { 'map': { 'steal-less/less-engine': 'steal-less/less-engine-node' } },
                    'server-production': { 'map': { 'steal-less/less-engine': 'steal-less/less-engine-node' } },
                    'bundle-build': {
                        'map': { 'steal-less/less-engine': 'steal-less/less-engine-node' },
                        'meta': { 'steal-less/less': { 'useLocalDeps': true } }
                    }
                },
                'ext': { 'less': 'steal-less' },
                'meta': {}
            },
            'resolutions': {}
        },
        {
            'name': 'steal',
            'version': '2.1.12',
            'fileUrl': './node_modules/steal/package.json',
            'main': 'main',
            'steal': {
                'npmDependencies': {
                    'console-browserify': true,
                    'constants-browserify': true,
                    'crypto-browserify': true,
                    'http-browserify': true,
                    'buffer': true,
                    'os-browserify': true,
                    'vm-browserify': true,
                    'zlib-browserify': true,
                    'assert': true,
                    'domain-browser': true,
                    'events': true,
                    'https-browserify': true,
                    'path-browserify': true,
                    'string_decoder': true,
                    'tty-browserify': true,
                    'process': true,
                    'punycode': true
                }
            },
            'globalBrowser': {
                'console': 'console-browserify',
                'constants': 'constants-browserify',
                'crypto': 'crypto-browserify',
                'http': 'http-browserify',
                'buffer': 'buffer',
                'os': 'os-browserify',
                'vm': 'vm-browserify',
                'zlib': 'zlib-browserify',
                'assert': 'assert',
                'child_process': 'steal#ext/builtin/child_process',
                'cluster': 'steal#ext/builtin/cluster',
                'dgram': 'steal#ext/builtin/dgram',
                'dns': 'steal#ext/builtin/dns',
                'domain': 'domain-browser',
                'events': 'events',
                'fs': 'steal#ext/builtin/fs',
                'https': 'https-browserify',
                'module': 'steal#ext/builtin/module',
                'net': 'steal#ext/builtin/net',
                'path': 'path-browserify',
                'process': 'process',
                'querystring': 'steal#ext/builtin/querystring',
                'readline': 'steal#ext/builtin/readline',
                'repl': 'steal#ext/builtin/repl',
                'stream': 'steal#ext/builtin/stream',
                'string_decoder': 'string_decoder',
                'sys': 'steal#ext/builtin/sys',
                'timers': 'steal#ext/builtin/timers',
                'tls': 'steal#ext/builtin/tls',
                'tty': 'tty-browserify',
                'url': 'steal#ext/builtin/url',
                'util': 'steal#ext/builtin/util',
                '_stream_readable': 'steal#ext/builtin/_stream_readable',
                '_stream_writable': 'steal#ext/builtin/_stream_writable',
                '_stream_duplex': 'steal#ext/builtin/_stream_duplex',
                '_stream_transform': 'steal#ext/builtin/_stream_transform',
                '_stream_passthrough': 'steal#ext/builtin/_stream_passthrough'
            },
            'resolutions': {}
        },
        {
            'name': 'can',
            'version': '5.21.4',
            'fileUrl': './node_modules/can/package.json',
            'main': 'can.js',
            'steal': {
                'npmAlgorithm': 'flat',
                'main': 'can',
                'npmIgnore': {
                    'bit-docs': true,
                    'testee': true,
                    'async': true,
                    'saucelabs': true,
                    'test-saucelabs': true,
                    'wd': true,
                    'http-server': true
                },
                'meta': { 'socket.io-client/dist/socket.io': { 'format': 'cjs' } },
                'configDependencies': ['./node_modules/steal-conditional/conditional.js'],
                'plugins': ['steal-stache']
            },
            'resolutions': {
                'can': '5.21.4',
                'can-component': '4.4.11',
                'can-define': '2.7.5',
                'can-debug': '2.0.5'
            }
        },
        {
            'name': 'steal-css',
            'version': '1.3.2',
            'fileUrl': './node_modules/steal-css/package.json',
            'main': 'css.js',
            'steal': {
                'ext': { 'css': 'steal-css' },
                'map': { '$css': 'steal-css@1.3.2#css' }
            },
            'resolutions': {}
        },
        {
            'name': 'buffer',
            'version': '5.0.8',
            'fileUrl': './node_modules/buffer/package.json',
            'main': 'index.js',
            'jspm': {},
            'resolutions': {}
        },
        {
            'name': 'assert',
            'version': '1.4.1',
            'fileUrl': './node_modules/assert/package.json',
            'main': './assert.js',
            'resolutions': {}
        },
        {
            'name': 'console-browserify',
            'version': '1.1.0',
            'fileUrl': './node_modules/console-browserify/package.json',
            'main': 'index',
            'resolutions': {}
        },
        {
            'name': 'constants-browserify',
            'version': '1.0.0',
            'fileUrl': './node_modules/constants-browserify/package.json',
            'main': 'constants.json',
            'resolutions': {}
        },
        {
            'name': 'crypto-browserify',
            'version': '3.11.1',
            'fileUrl': './node_modules/crypto-browserify/package.json',
            'browser': { 'crypto': '@empty' },
            'resolutions': {}
        },
        {
            'name': 'domain-browser',
            'version': '1.1.7',
            'fileUrl': './node_modules/domain-browser/package.json',
            'main': './index.js',
            'jspm': {},
            'resolutions': {}
        },
        {
            'name': 'events',
            'version': '1.1.1',
            'fileUrl': './node_modules/events/package.json',
            'main': './events.js',
            'resolutions': {}
        },
        {
            'name': 'http-browserify',
            'version': '1.7.0',
            'fileUrl': './node_modules/http-browserify/package.json',
            'main': 'index.js',
            'browser': 'index.js',
            'resolutions': {}
        },
        {
            'name': 'https-browserify',
            'version': '1.0.0',
            'fileUrl': './node_modules/https-browserify/package.json',
            'main': 'index.js',
            'resolutions': {}
        },
        {
            'name': 'path-browserify',
            'version': '0.0.1',
            'fileUrl': './node_modules/path-browserify/package.json',
            'main': 'index.js',
            'resolutions': {}
        },
        {
            'name': 'process',
            'version': '0.11.10',
            'fileUrl': './node_modules/process/package.json',
            'main': './index.js',
            'browser': './browser.js',
            'resolutions': {}
        },
        {
            'name': 'os-browserify',
            'version': '0.3.0',
            'fileUrl': './node_modules/os-browserify/package.json',
            'main': 'main.js',
            'browser': 'browser.js',
            'jspm': {},
            'resolutions': {}
        },
        {
            'name': 'string_decoder',
            'version': '1.0.3',
            'fileUrl': './node_modules/string_decoder/package.json',
            'main': 'lib/string_decoder.js',
            'resolutions': {}
        },
        {
            'name': 'punycode',
            'version': '2.0.1',
            'fileUrl': './node_modules/punycode/package.json',
            'main': 'punycode.js',
            'jspm': {},
            'resolutions': {}
        },
        {
            'name': 'tty-browserify',
            'version': '0.0.1',
            'fileUrl': './node_modules/tty-browserify/package.json',
            'main': 'index.js',
            'resolutions': {}
        },
        {
            'name': 'vm-browserify',
            'version': '0.0.4',
            'fileUrl': './node_modules/vm-browserify/package.json',
            'main': 'index.js',
            'resolutions': {}
        },
        {
            'name': 'zlib-browserify',
            'version': '0.0.3',
            'fileUrl': './node_modules/zlib-browserify/package.json',
            'main': 'index.js',
            'resolutions': {}
        },
        {
            'name': 'steal-stache',
            'version': '4.1.2',
            'fileUrl': './node_modules/steal-stache/package.json',
            'main': 'steal-stache.js',
            'steal': {
                'main': 'steal-stache',
                'configDependencies': ['live-reload'],
                'npmIgnore': {
                    'documentjs': true,
                    'testee': true,
                    'steal-tools': true
                },
                'npmAlgorithm': 'flat',
                'ext': { 'stache': 'steal-stache' }
            },
            'resolutions': {
                'can-stache-bindings': '4.8.0',
                'can-view-import': '4.2.1'
            }
        },
        {
            'name': 'steal-config-utils',
            'version': '1.0.0',
            'fileUrl': './node_modules/steal-config-utils/package.json',
            'main': 'main.js',
            'resolutions': {}
        },
        {
            'name': 'can-stache-ast',
            'version': '1.1.0',
            'fileUrl': './node_modules/can-stache-ast/package.json',
            'main': 'can-stache-ast.js',
            'resolutions': {
                'can-stache-ast': '1.1.0',
                'can-view-parser': '4.1.2'
            }
        },
        {
            'name': 'can-component',
            'version': '4.4.11',
            'fileUrl': './node_modules/can-component/package.json',
            'main': 'can-component',
            'steal': {},
            'resolutions': {
                'can-component': '4.4.11',
                'can-define': '2.7.5',
                'can-construct': '3.5.3',
                'can-namespace': '1.0.0',
                'can-reflect': '1.17.9',
                'can-observation-recorder': '1.3.0',
                'can-symbol': '1.6.4',
                'can-bind': '1.3.0',
                'can-stache': '4.17.5',
                'can-view-callbacks': '4.3.6',
                'can-stache-bindings': '4.8.0',
                'can-stache-key': '1.4.0',
                'can-simple-observable': '2.4.1',
                'can-view-nodelist': '4.3.3',
                'can-view-scope': '4.13.0',
                'can-simple-map': '4.3.0',
                'can-assign': '1.3.1',
                'can-view-model': '4.0.1',
                'can-dom-data-state': '1.0.5',
                'can-child-nodes': '1.2.0',
                'can-string': '1.0.0',
                'can-dom-events': '1.3.3',
                'can-dom-mutate': '1.3.6',
                'can-globals': '1.2.1',
                'can-log': '1.0.0',
                'can-queues': '1.2.1',
                'can-control': '4.4.1'
            }
        },
        {
            'name': 'can-define',
            'version': '2.7.5',
            'fileUrl': './node_modules/can-define/package.json',
            'main': 'can-define.js',
            'resolutions': {
                'can-define': '2.7.5',
                'can-construct': '3.5.3',
                'can-namespace': '1.0.0',
                'can-log': '1.0.0',
                'can-reflect': '1.17.9',
                'can-observation-recorder': '1.3.0',
                'can-queues': '1.2.1',
                'can-symbol': '1.6.4',
                'can-event-queue': '1.1.4',
                'can-assign': '1.3.1',
                'can-diff': '1.4.4',
                'can-simple-observable': '2.4.1',
                'can-observation': '4.1.2',
                'can-single-reference': '1.2.0',
                'can-string-to-any': '1.2.0',
                'can-data-types': '1.2.0',
                'can-define-lazy-value': '1.1.0'
            }
        },
        {
            'name': 'can-view-parser',
            'version': '4.1.2',
            'fileUrl': './node_modules/can-view-parser/package.json',
            'main': 'can-view-parser',
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-log': '1.0.0',
                'can-attribute-encoder': '1.1.2'
            }
        },
        {
            'name': 'can-debug',
            'version': '2.0.5',
            'fileUrl': './node_modules/can-debug/package.json',
            'main': 'can-debug',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'steal-tools': true
                },
                'main': 'can-debug'
            },
            'resolutions': {
                'can-debug': '2.0.5',
                'can-reflect': '1.17.9',
                'can-diff': '1.4.4',
                'can-namespace': '1.0.0',
                'can-globals': '1.2.1',
                'can-symbol': '1.6.4',
                'can-queues': '1.2.1',
                'can-assign': '1.3.1',
                'can-reflect-dependencies': '1.1.1'
            }
        },
        {
            'name': 'can-construct',
            'version': '3.5.3',
            'fileUrl': './node_modules/can-construct/package.json',
            'main': 'can-construct',
            'steal': {},
            'resolutions': {
                'can-reflect': '1.17.9',
                'can-log': '1.0.0',
                'can-namespace': '1.0.0',
                'can-string': '1.0.0'
            }
        },
        {
            'name': 'can-namespace',
            'version': '1.0.0',
            'fileUrl': './node_modules/can-namespace/package.json',
            'main': 'can-namespace',
            'steal': { 'npmAlgorithm': 'flat' },
            'resolutions': {}
        },
        {
            'name': 'can-log',
            'version': '1.0.0',
            'fileUrl': './node_modules/can-log/package.json',
            'main': 'dist/cjs/can-log',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-log'
            },
            'resolutions': { 'can-log': '1.0.0' }
        },
        {
            'name': 'can-reflect',
            'version': '1.17.9',
            'fileUrl': './node_modules/can-reflect/package.json',
            'main': 'can-reflect',
            'resolutions': {
                'can-reflect': '1.17.9',
                'can-namespace': '1.0.0',
                'can-symbol': '1.6.4'
            }
        },
        {
            'name': 'can-observation-recorder',
            'version': '1.3.0',
            'fileUrl': './node_modules/can-observation-recorder/package.json',
            'main': './can-observation-recorder.js',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                }
            },
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-symbol': '1.6.4'
            }
        },
        {
            'name': 'can-queues',
            'version': '1.2.1',
            'fileUrl': './node_modules/can-queues/package.json',
            'main': './can-queues.js',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-queues'
            },
            'resolutions': {
                'can-log': '1.0.0',
                'can-queues': '1.2.1',
                'can-namespace': '1.0.0',
                'can-assign': '1.3.1'
            }
        },
        {
            'name': 'can-symbol',
            'version': '1.6.4',
            'fileUrl': './node_modules/can-symbol/package.json',
            'main': 'can-symbol',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-symbol'
            },
            'resolutions': { 'can-namespace': '1.0.0' }
        },
        {
            'name': 'can-event-queue',
            'version': '1.1.4',
            'fileUrl': './node_modules/can-event-queue/package.json',
            'main': './can-event-queue.js',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'plugins': [
                    'steal-less',
                    'steal-stache'
                ]
            },
            'resolutions': {
                'can-reflect': '1.17.9',
                'can-symbol': '1.6.4',
                'can-queues': '1.2.1',
                'can-key-tree': '1.2.0',
                'can-event-queue': '1.1.4',
                'can-define-lazy-value': '1.1.0',
                'can-log': '1.0.0',
                'can-dom-events': '1.3.3'
            }
        },
        {
            'name': 'can-bind',
            'version': '1.3.0',
            'fileUrl': './node_modules/can-bind/package.json',
            'main': 'can-bind',
            'steal': {
                'npmIgnore': {
                    'steal-tools': true,
                    'testee': true
                },
                'main': 'can-bind'
            },
            'resolutions': {
                'can-reflect': '1.17.9',
                'can-symbol': '1.6.4',
                'can-namespace': '1.0.0',
                'can-queues': '1.2.1',
                'can-assign': '1.3.1',
                'can-log': '1.0.0',
                'can-reflect-dependencies': '1.1.1'
            }
        },
        {
            'name': 'can-stache',
            'version': '4.17.5',
            'fileUrl': './node_modules/can-stache/package.json',
            'main': 'can-stache',
            'resolutions': {
                'can-view-callbacks': '4.3.6',
                'can-stache': '4.17.5',
                'can-log': '1.0.0',
                'can-namespace': '1.0.0',
                'can-globals': '1.2.1',
                'can-assign': '1.3.1',
                'can-reflect': '1.17.9',
                'can-view-scope': '4.13.0',
                'can-observation-recorder': '1.3.0',
                'can-symbol': '1.6.4',
                'can-view-nodelist': '4.3.3',
                'can-view-parser': '4.1.2',
                'can-attribute-encoder': '1.1.2',
                'can-stache-ast': '1.1.0',
                'can-import-module': '1.2.0',
                'can-view-target': '4.1.2',
                'can-dom-mutate': '1.3.6',
                'can-observation': '4.1.2',
                'can-stache-key': '1.4.0',
                'can-stache-helpers': '1.2.0',
                'can-dom-data-state': '1.0.5',
                'can-fragment': '1.3.0',
                'can-define-lazy-value': '1.1.0',
                'can-view-live': '4.2.7',
                'can-simple-observable': '2.4.1',
                'can-join-uris': '1.2.0',
                'can-dom-data': '1.0.1'
            }
        },
        {
            'name': 'can-view-callbacks',
            'version': '4.3.6',
            'fileUrl': './node_modules/can-view-callbacks/package.json',
            'main': 'can-view-callbacks',
            'resolutions': {
                'can-observation-recorder': '1.3.0',
                'can-log': '1.0.0',
                'can-globals': '1.2.1',
                'can-dom-mutate': '1.3.6',
                'can-namespace': '1.0.0',
                'can-view-nodelist': '4.3.3',
                'can-symbol': '1.6.4',
                'can-reflect': '1.17.9',
                'can-fragment': '1.3.0'
            }
        },
        {
            'name': 'can-stache-bindings',
            'version': '4.8.0',
            'fileUrl': './node_modules/can-stache-bindings/package.json',
            'main': 'can-stache-bindings',
            'steal': { 'main': 'can-stache-bindings' },
            'resolutions': {
                'can-bind': '1.3.0',
                'can-stache': '4.17.5',
                'can-view-callbacks': '4.3.6',
                'can-view-model': '4.0.1',
                'can-stache-key': '1.4.0',
                'can-observation-recorder': '1.3.0',
                'can-simple-observable': '2.4.1',
                'can-assign': '1.3.1',
                'can-log': '1.0.0',
                'can-dom-mutate': '1.3.6',
                'can-dom-data-state': '1.0.5',
                'can-symbol': '1.6.4',
                'can-reflect': '1.17.9',
                'can-queues': '1.2.1',
                'can-view-scope': '4.13.0',
                'can-view-nodelist': '4.3.3',
                'can-event-queue': '1.1.4',
                'can-reflect-dependencies': '1.1.1',
                'can-attribute-encoder': '1.1.2',
                'can-attribute-observable': '1.2.1'
            }
        },
        {
            'name': 'can-stache-key',
            'version': '1.4.0',
            'fileUrl': './node_modules/can-stache-key/package.json',
            'main': 'can-stache-key',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-stache-key'
            },
            'resolutions': {
                'can-observation-recorder': '1.3.0',
                'can-log': '1.0.0',
                'can-symbol': '1.6.4',
                'can-reflect': '1.17.9',
                'can-reflect-promise': '2.2.0'
            }
        },
        {
            'name': 'can-simple-observable',
            'version': '2.4.1',
            'fileUrl': './node_modules/can-simple-observable/package.json',
            'main': 'can-simple-observable',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'steal-tools': true
                }
            },
            'resolutions': {
                'can-reflect': '1.17.9',
                'can-simple-observable': '2.4.1',
                'can-event-queue': '1.1.4',
                'can-namespace': '1.0.0',
                'can-symbol': '1.6.4',
                'can-observation-recorder': '1.3.0',
                'can-observation': '4.1.2',
                'can-log': '1.0.0',
                'can-queues': '1.2.1'
            }
        },
        {
            'name': 'can-view-nodelist',
            'version': '4.3.3',
            'fileUrl': './node_modules/can-view-nodelist/package.json',
            'main': 'can-view-nodelist',
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-dom-mutate': '1.3.6'
            }
        },
        {
            'name': 'can-view-scope',
            'version': '4.13.0',
            'fileUrl': './node_modules/can-view-scope/package.json',
            'main': 'can-view-scope',
            'resolutions': {
                'can-stache-key': '1.4.0',
                'can-observation-recorder': '1.3.0',
                'can-view-scope': '4.13.0',
                'can-assign': '1.3.1',
                'can-namespace': '1.0.0',
                'can-reflect': '1.17.9',
                'can-log': '1.0.0',
                'can-simple-map': '4.3.0',
                'can-define-lazy-value': '1.1.0',
                'can-stache-helpers': '1.2.0',
                'can-single-reference': '1.2.0',
                'can-observation': '4.1.2',
                'can-symbol': '1.6.4',
                'can-reflect-dependencies': '1.1.1',
                'can-event-queue': '1.1.4',
                'can-simple-observable': '2.4.1'
            }
        },
        {
            'name': 'can-simple-map',
            'version': '4.3.0',
            'fileUrl': './node_modules/can-simple-map/package.json',
            'main': 'can-simple-map',
            'steal': {
                'npmIgnore': {
                    'documentjs': true,
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-simple-map'
            },
            'resolutions': {
                'can-construct': '3.5.3',
                'can-event-queue': '1.1.4',
                'can-queues': '1.2.1',
                'can-observation-recorder': '1.3.0',
                'can-reflect': '1.17.9',
                'can-log': '1.0.0',
                'can-symbol': '1.6.4'
            }
        },
        {
            'name': 'can-assign',
            'version': '1.3.1',
            'fileUrl': './node_modules/can-assign/package.json',
            'main': 'dist/cjs/can-assign',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-assign'
            },
            'resolutions': { 'can-namespace': '1.0.0' }
        },
        {
            'name': 'can-view-model',
            'version': '4.0.1',
            'fileUrl': './node_modules/can-view-model/package.json',
            'main': 'can-view-model',
            'resolutions': {
                'can-simple-map': '4.3.0',
                'can-namespace': '1.0.0',
                'can-globals': '1.2.1',
                'can-reflect': '1.17.9',
                'can-symbol': '1.6.4'
            }
        },
        {
            'name': 'can-dom-data-state',
            'version': '1.0.5',
            'fileUrl': './node_modules/can-dom-data-state/package.json',
            'main': 'can-dom-data-state.js',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-dom-data-state'
            },
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-dom-mutate': '1.3.6',
                'can-cid': '1.3.0'
            }
        },
        {
            'name': 'can-child-nodes',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-child-nodes/package.json',
            'main': 'can-child-nodes',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                }
            },
            'resolutions': { 'can-namespace': '1.0.0' }
        },
        {
            'name': 'can-string',
            'version': '1.0.0',
            'fileUrl': './node_modules/can-string/package.json',
            'main': 'can-string',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'plugins': [
                    'steal-less',
                    'steal-stache'
                ]
            },
            'resolutions': {}
        },
        {
            'name': 'can-dom-events',
            'version': '1.3.3',
            'fileUrl': './node_modules/can-dom-events/package.json',
            'main': 'can-dom-events',
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-dom-events': '1.3.3',
                'can-globals': '1.2.1',
                'can-key-tree': '1.2.0',
                'can-reflect': '1.17.9'
            }
        },
        {
            'name': 'can-dom-mutate',
            'version': '1.3.6',
            'fileUrl': './node_modules/can-dom-mutate/package.json',
            'main': 'can-dom-mutate',
            'steal': { 'main': 'can-dom-mutate' },
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-dom-mutate': '1.3.6',
                'can-globals': '1.2.1',
                'can-reflect': '1.17.9'
            }
        },
        {
            'name': 'can-globals',
            'version': '1.2.1',
            'fileUrl': './node_modules/can-globals/package.json',
            'main': 'can-globals.js',
            'resolutions': {
                'can-globals': '1.2.1',
                'can-namespace': '1.0.0',
                'can-reflect': '1.17.9'
            }
        },
        {
            'name': 'can-diff',
            'version': '1.4.4',
            'fileUrl': './node_modules/can-diff/package.json',
            'main': 'can-diff',
            'steal': { 'main': 'can-diff' },
            'resolutions': {
                'can-reflect': '1.17.9',
                'can-diff': '1.4.4',
                'can-key-tree': '1.2.0',
                'can-symbol': '1.6.4',
                'can-queues': '1.2.1'
            }
        },
        {
            'name': 'can-attribute-encoder',
            'version': '1.1.2',
            'fileUrl': './node_modules/can-attribute-encoder/package.json',
            'main': 'can-attribute-encoder',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'steal-tools': true
                },
                'main': 'can-attribute-encoder'
            },
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-log': '1.0.0'
            }
        },
        {
            'name': 'can-key-tree',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-key-tree/package.json',
            'main': 'dist/cjs/can-key-tree',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'plugins': [
                    'steal-less',
                    'steal-stache'
                ],
                'main': 'can-key-tree'
            },
            'resolutions': { 'can-reflect': '1.17.9' }
        },
        {
            'name': 'can-control',
            'version': '4.4.1',
            'fileUrl': './node_modules/can-control/package.json',
            'main': 'can-control',
            'resolutions': {
                'can-construct': '3.5.3',
                'can-namespace': '1.0.0',
                'can-assign': '1.3.1',
                'can-stache-key': '1.4.0',
                'can-reflect': '1.17.9',
                'can-observation': '4.1.2',
                'can-event-queue': '1.1.4',
                'can-log': '1.0.0',
                'can-string': '1.0.0',
                'can-dom-mutate': '1.3.6',
                'can-symbol': '1.6.4',
                'can-key': '1.2.0'
            }
        },
        {
            'name': 'can-observation',
            'version': '4.1.2',
            'fileUrl': './node_modules/can-observation/package.json',
            'main': 'can-observation',
            'steal': { 'npmAlgorithm': 'flat' },
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-reflect': '1.17.9',
                'can-queues': '1.2.1',
                'can-observation-recorder': '1.3.0',
                'can-symbol': '1.6.4',
                'can-log': '1.0.0',
                'can-event-queue': '1.1.4',
                'can-observation': '4.1.2'
            }
        },
        {
            'name': 'can-cid',
            'version': '1.3.0',
            'fileUrl': './node_modules/can-cid/package.json',
            'main': 'can-cid',
            'resolutions': { 'can-namespace': '1.0.0' }
        },
        {
            'name': 'can-reflect-promise',
            'version': '2.2.0',
            'fileUrl': './node_modules/can-reflect-promise/package.json',
            'main': 'can-reflect-promise',
            'steal': { 'npmAlgorithm': 'flat' },
            'resolutions': {
                'can-reflect': '1.17.9',
                'can-symbol': '1.6.4',
                'can-observation-recorder': '1.3.0',
                'can-queues': '1.2.1',
                'can-key-tree': '1.2.0',
                'can-log': '1.0.0'
            }
        },
        {
            'name': 'can-fragment',
            'version': '1.3.0',
            'fileUrl': './node_modules/can-fragment/package.json',
            'main': 'can-fragment',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                }
            },
            'resolutions': {
                'can-globals': '1.2.1',
                'can-namespace': '1.0.0',
                'can-reflect': '1.17.9',
                'can-child-nodes': '1.2.0',
                'can-symbol': '1.6.4'
            }
        },
        {
            'name': 'can-reflect-dependencies',
            'version': '1.1.1',
            'fileUrl': './node_modules/can-reflect-dependencies/package.json',
            'main': 'can-reflect-dependencies.js',
            'resolutions': {
                'can-reflect-dependencies': '1.1.1',
                'can-reflect': '1.17.9',
                'can-symbol': '1.6.4',
                'can-assign': '1.3.1'
            }
        },
        {
            'name': 'can-import-module',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-import-module/package.json',
            'main': 'can-import-module.js',
            'resolutions': {
                'can-globals': '1.2.1',
                'can-namespace': '1.0.0'
            }
        },
        {
            'name': 'can-view-target',
            'version': '4.1.2',
            'fileUrl': './node_modules/can-view-target/package.json',
            'main': 'can-view-target',
            'resolutions': {
                'can-globals': '1.2.1',
                'can-dom-mutate': '1.3.6',
                'can-namespace': '1.0.0'
            }
        },
        {
            'name': 'can-single-reference',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-single-reference/package.json',
            'main': 'can-single-reference',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                }
            },
            'resolutions': { 'can-cid': '1.3.0' }
        },
        {
            'name': 'can-define-lazy-value',
            'version': '1.1.0',
            'fileUrl': './node_modules/can-define-lazy-value/package.json',
            'main': 'define-lazy-value',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'steal-tools': true
                }
            },
            'resolutions': {}
        },
        {
            'name': 'can-stache-helpers',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-stache-helpers/package.json',
            'main': 'can-stache-helpers',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                }
            },
            'resolutions': { 'can-namespace': '1.0.0' }
        },
        {
            'name': 'can-string-to-any',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-string-to-any/package.json',
            'main': 'can-string-to-any',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-string-to-any'
            },
            'resolutions': {}
        },
        {
            'name': 'can-data-types',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-data-types/package.json',
            'main': 'can-data-types',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-data-types'
            },
            'resolutions': { 'can-reflect': '1.17.9' }
        },
        {
            'name': 'can-attribute-observable',
            'version': '1.2.1',
            'fileUrl': './node_modules/can-attribute-observable/package.json',
            'main': 'can-attribute-observable',
            'resolutions': {
                'can-queues': '1.2.1',
                'can-attribute-observable': '1.2.1',
                'can-reflect': '1.17.9',
                'can-observation': '4.1.2',
                'can-reflect-dependencies': '1.1.1',
                'can-observation-recorder': '1.3.0',
                'can-simple-observable': '2.4.1',
                'can-assign': '1.3.1',
                'can-symbol': '1.6.4',
                'can-dom-events': '1.3.3',
                'can-event-dom-radiochange': '2.2.0',
                'can-globals': '1.2.1',
                'can-dom-data-state': '1.0.5',
                'can-dom-mutate': '1.3.6',
                'can-diff': '1.4.4'
            }
        },
        {
            'name': 'can-key',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-key/package.json',
            'main': 'can-key',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'plugins': [
                    'steal-less',
                    'steal-stache'
                ],
                'main': 'can-key'
            },
            'resolutions': {
                'can-reflect': '1.17.9',
                'can-key': '1.2.0'
            }
        },
        {
            'name': 'can-view-live',
            'version': '4.2.7',
            'fileUrl': './node_modules/can-view-live/package.json',
            'main': 'can-view-live',
            'steal': {
                'npmIgnore': {
                    'documentjs': true,
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-view-live'
            },
            'resolutions': {
                'can-view-live': '4.2.7',
                'can-view-parser': '4.1.2',
                'can-dom-mutate': '1.3.6',
                'can-view-nodelist': '4.3.3',
                'can-fragment': '1.3.0',
                'can-child-nodes': '1.2.0',
                'can-reflect': '1.17.9',
                'can-reflect-dependencies': '1.1.1',
                'can-view-callbacks': '4.3.6',
                'can-queues': '1.2.1',
                'can-attribute-observable': '1.2.1',
                'can-symbol': '1.6.4',
                'can-simple-observable': '2.4.1',
                'can-diff': '1.4.4'
            }
        },
        {
            'name': 'can-view-import',
            'version': '4.2.1',
            'fileUrl': './node_modules/can-view-import/package.json',
            'main': 'can-view-import',
            'resolutions': {
                'can-assign': '1.3.1',
                'can-dom-data-state': '1.0.5',
                'can-symbol': '1.6.4',
                'can-globals': '1.2.1',
                'can-child-nodes': '1.2.0',
                'can-import-module': '1.2.0',
                'can-dom-mutate': '1.3.6',
                'can-view-nodelist': '4.3.3',
                'can-view-callbacks': '4.3.6',
                'can-log': '1.0.0'
            }
        },
        {
            'name': 'can-join-uris',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-join-uris/package.json',
            'main': 'can-join-uris',
            'steal': {},
            'resolutions': {
                'can-namespace': '1.0.0',
                'can-parse-uri': '1.2.0'
            }
        },
        {
            'name': 'can-dom-data',
            'version': '1.0.1',
            'fileUrl': './node_modules/can-dom-data/package.json',
            'main': 'can-dom-data.js',
            'steal': {
                'npmIgnore': {
                    'steal-tools': true,
                    'testee': true
                },
                'main': 'can-dom-data'
            },
            'resolutions': { 'can-namespace': '1.0.0' }
        },
        {
            'name': 'can-event-dom-radiochange',
            'version': '2.2.0',
            'fileUrl': './node_modules/can-event-dom-radiochange/package.json',
            'main': 'can-event-dom-radiochange',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'steal-tools': true
                },
                'main': 'can-event-dom-radiochange'
            },
            'resolutions': {
                'can-globals': '1.2.1',
                'can-namespace': '1.0.0'
            }
        },
        {
            'name': 'can-parse-uri',
            'version': '1.2.0',
            'fileUrl': './node_modules/can-parse-uri/package.json',
            'main': 'can-parse-uri',
            'steal': {
                'npmIgnore': {
                    'testee': true,
                    'generator-donejs': true,
                    'donejs-cli': true,
                    'steal-tools': true
                },
                'main': 'can-parse-uri'
            },
            'resolutions': { 'can-namespace': '1.0.0' }
        },
        {
            'name': 'lodash',
            'version': '4.17.11',
            'fileUrl': './node_modules/lodash/package.json',
            'main': 'lodash.js',
            'resolutions': {}
        },
        {
            'name': 'moment',
            'version': '2.23.0',
            'fileUrl': './node_modules/moment/package.json',
            'main': './moment.js',
            'jspm': {},
            'resolutions': {}
        },
        {
            'name': 'xml-js',
            'version': '1.6.8',
            'fileUrl': './node_modules/xml-js/package.json',
            'main': 'lib/index.js',
            'resolutions': {}
        }
    ], { 'npmParentMap': {} }));
});
/*can-namespace@1.0.0#can-namespace*/
define('can-namespace@1.0.0#can-namespace', function (require, exports, module) {
    module.exports = {};
});
/*can-symbol@1.6.4#can-symbol*/
define('can-symbol@1.6.4#can-symbol', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var supportsNativeSymbols = function () {
            var symbolExists = typeof Symbol !== 'undefined' && typeof Symbol.for === 'function';
            if (!symbolExists) {
                return false;
            }
            var symbol = Symbol('a symbol for testing symbols');
            return typeof symbol === 'symbol';
        }();
        var CanSymbol;
        if (supportsNativeSymbols) {
            CanSymbol = Symbol;
        } else {
            var symbolNum = 0;
            CanSymbol = function CanSymbolPolyfill(description) {
                var symbolValue = '@@symbol' + symbolNum++ + description;
                var symbol = {};
                Object.defineProperties(symbol, {
                    toString: {
                        value: function () {
                            return symbolValue;
                        }
                    }
                });
                return symbol;
            };
            var descriptionToSymbol = {};
            var symbolToDescription = {};
            CanSymbol.for = function (description) {
                var symbol = descriptionToSymbol[description];
                if (!symbol) {
                    symbol = descriptionToSymbol[description] = CanSymbol(description);
                    symbolToDescription[symbol] = description;
                }
                return symbol;
            };
            CanSymbol.keyFor = function (symbol) {
                return symbolToDescription[symbol];
            };
            [
                'hasInstance',
                'isConcatSpreadable',
                'iterator',
                'match',
                'prototype',
                'replace',
                'search',
                'species',
                'split',
                'toPrimitive',
                'toStringTag',
                'unscopables'
            ].forEach(function (name) {
                CanSymbol[name] = CanSymbol('Symbol.' + name);
            });
        }
        [
            'isMapLike',
            'isListLike',
            'isValueLike',
            'isFunctionLike',
            'getOwnKeys',
            'getOwnKeyDescriptor',
            'proto',
            'getOwnEnumerableKeys',
            'hasOwnKey',
            'hasKey',
            'size',
            'getName',
            'getIdentity',
            'assignDeep',
            'updateDeep',
            'getValue',
            'setValue',
            'getKeyValue',
            'setKeyValue',
            'updateValues',
            'addValue',
            'removeValues',
            'apply',
            'new',
            'onValue',
            'offValue',
            'onKeyValue',
            'offKeyValue',
            'getKeyDependencies',
            'getValueDependencies',
            'keyHasDependencies',
            'valueHasDependencies',
            'onKeys',
            'onKeysAdded',
            'onKeysRemoved',
            'onPatches'
        ].forEach(function (name) {
            CanSymbol.for('can.' + name);
        });
        module.exports = namespace.Symbol = CanSymbol;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-reflect@1.17.9#reflections/helpers*/
define('can-reflect@1.17.9#reflections/helpers', [
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    module.exports = {
        makeGetFirstSymbolValue: function (symbolNames) {
            var symbols = symbolNames.map(function (name) {
                return canSymbol.for(name);
            });
            var length = symbols.length;
            return function getFirstSymbol(obj) {
                var index = -1;
                while (++index < length) {
                    if (obj[symbols[index]] !== undefined) {
                        return obj[symbols[index]];
                    }
                }
            };
        },
        hasLength: function (list) {
            var type = typeof list;
            if (type === 'string' || Array.isArray(list)) {
                return true;
            }
            var length = list && (type !== 'boolean' && type !== 'number' && 'length' in list) && list.length;
            return typeof list !== 'function' && (length === 0 || typeof length === 'number' && length > 0 && length - 1 in list);
        }
    };
});
/*can-reflect@1.17.9#reflections/type/type*/
define('can-reflect@1.17.9#reflections/type/type', [
    'require',
    'exports',
    'module',
    'can-symbol',
    '../helpers'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var helpers = require('../helpers');
    var plainFunctionPrototypePropertyNames = Object.getOwnPropertyNames(function () {
    }.prototype);
    var plainFunctionPrototypeProto = Object.getPrototypeOf(function () {
    }.prototype);
    function isConstructorLike(func) {
        var value = func[canSymbol.for('can.new')];
        if (value !== undefined) {
            return value;
        }
        if (typeof func !== 'function') {
            return false;
        }
        var prototype = func.prototype;
        if (!prototype) {
            return false;
        }
        if (plainFunctionPrototypeProto !== Object.getPrototypeOf(prototype)) {
            return true;
        }
        var propertyNames = Object.getOwnPropertyNames(prototype);
        if (propertyNames.length === plainFunctionPrototypePropertyNames.length) {
            for (var i = 0, len = propertyNames.length; i < len; i++) {
                if (propertyNames[i] !== plainFunctionPrototypePropertyNames[i]) {
                    return true;
                }
            }
            return false;
        } else {
            return true;
        }
    }
    var getNewOrApply = helpers.makeGetFirstSymbolValue([
        'can.new',
        'can.apply'
    ]);
    function isFunctionLike(obj) {
        var result, symbolValue = !!obj && obj[canSymbol.for('can.isFunctionLike')];
        if (symbolValue !== undefined) {
            return symbolValue;
        }
        result = getNewOrApply(obj);
        if (result !== undefined) {
            return !!result;
        }
        return typeof obj === 'function';
    }
    function isPrimitive(obj) {
        var type = typeof obj;
        if (obj == null || type !== 'function' && type !== 'object') {
            return true;
        } else {
            return false;
        }
    }
    var coreHasOwn = Object.prototype.hasOwnProperty;
    var funcToString = Function.prototype.toString;
    var objectCtorString = funcToString.call(Object);
    function isPlainObject(obj) {
        if (!obj || typeof obj !== 'object') {
            return false;
        }
        var proto = Object.getPrototypeOf(obj);
        if (proto === Object.prototype || proto === null) {
            return true;
        }
        var Constructor = coreHasOwn.call(proto, 'constructor') && proto.constructor;
        return typeof Constructor === 'function' && Constructor instanceof Constructor && funcToString.call(Constructor) === objectCtorString;
    }
    function isBuiltIn(obj) {
        if (isPrimitive(obj) || Array.isArray(obj) || isPlainObject(obj) || Object.prototype.toString.call(obj) !== '[object Object]' && Object.prototype.toString.call(obj).indexOf('[object ') !== -1) {
            return true;
        } else {
            return false;
        }
    }
    function isValueLike(obj) {
        var symbolValue;
        if (isPrimitive(obj)) {
            return true;
        }
        symbolValue = obj[canSymbol.for('can.isValueLike')];
        if (typeof symbolValue !== 'undefined') {
            return symbolValue;
        }
        var value = obj[canSymbol.for('can.getValue')];
        if (value !== undefined) {
            return !!value;
        }
    }
    function isMapLike(obj) {
        if (isPrimitive(obj)) {
            return false;
        }
        var isMapLike = obj[canSymbol.for('can.isMapLike')];
        if (typeof isMapLike !== 'undefined') {
            return !!isMapLike;
        }
        var value = obj[canSymbol.for('can.getKeyValue')];
        if (value !== undefined) {
            return !!value;
        }
        return true;
    }
    var onValueSymbol = canSymbol.for('can.onValue'), onKeyValueSymbol = canSymbol.for('can.onKeyValue'), onPatchesSymbol = canSymbol.for('can.onPatches');
    function isObservableLike(obj) {
        if (isPrimitive(obj)) {
            return false;
        }
        return Boolean(obj[onValueSymbol] || obj[onKeyValueSymbol] || obj[onPatchesSymbol]);
    }
    function isListLike(list) {
        var symbolValue, type = typeof list;
        if (type === 'string') {
            return true;
        }
        if (isPrimitive(list)) {
            return false;
        }
        symbolValue = list[canSymbol.for('can.isListLike')];
        if (typeof symbolValue !== 'undefined') {
            return symbolValue;
        }
        var value = list[canSymbol.iterator];
        if (value !== undefined) {
            return !!value;
        }
        if (Array.isArray(list)) {
            return true;
        }
        return helpers.hasLength(list);
    }
    var supportsNativeSymbols = function () {
        var symbolExists = typeof Symbol !== 'undefined' && typeof Symbol.for === 'function';
        if (!symbolExists) {
            return false;
        }
        var symbol = Symbol('a symbol for testing symbols');
        return typeof symbol === 'symbol';
    }();
    var isSymbolLike;
    if (supportsNativeSymbols) {
        isSymbolLike = function (symbol) {
            return typeof symbol === 'symbol';
        };
    } else {
        var symbolStart = '@@symbol';
        isSymbolLike = function (symbol) {
            if (typeof symbol === 'object' && !Array.isArray(symbol)) {
                return symbol.toString().substr(0, symbolStart.length) === symbolStart;
            } else {
                return false;
            }
        };
    }
    module.exports = {
        isConstructorLike: isConstructorLike,
        isFunctionLike: isFunctionLike,
        isListLike: isListLike,
        isMapLike: isMapLike,
        isObservableLike: isObservableLike,
        isPrimitive: isPrimitive,
        isBuiltIn: isBuiltIn,
        isValueLike: isValueLike,
        isSymbolLike: isSymbolLike,
        isMoreListLikeThanMapLike: function (obj) {
            if (Array.isArray(obj)) {
                return true;
            }
            if (obj instanceof Array) {
                return true;
            }
            if (obj == null) {
                return false;
            }
            var value = obj[canSymbol.for('can.isMoreListLikeThanMapLike')];
            if (value !== undefined) {
                return value;
            }
            var isListLike = this.isListLike(obj), isMapLike = this.isMapLike(obj);
            if (isListLike && !isMapLike) {
                return true;
            } else if (!isListLike && isMapLike) {
                return false;
            }
        },
        isIteratorLike: function (obj) {
            return obj && typeof obj === 'object' && typeof obj.next === 'function' && obj.next.length === 0;
        },
        isPromise: function (obj) {
            return obj instanceof Promise || Object.prototype.toString.call(obj) === '[object Promise]';
        },
        isPlainObject: isPlainObject
    };
});
/*can-reflect@1.17.9#reflections/call/call*/
define('can-reflect@1.17.9#reflections/call/call', [
    'require',
    'exports',
    'module',
    'can-symbol',
    '../type/type'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var typeReflections = require('../type/type');
    module.exports = {
        call: function (func, context) {
            var args = [].slice.call(arguments, 2);
            var apply = func[canSymbol.for('can.apply')];
            if (apply) {
                return apply.call(func, context, args);
            } else {
                return func.apply(context, args);
            }
        },
        apply: function (func, context, args) {
            var apply = func[canSymbol.for('can.apply')];
            if (apply) {
                return apply.call(func, context, args);
            } else {
                return func.apply(context, args);
            }
        },
        'new': function (func) {
            var args = [].slice.call(arguments, 1);
            var makeNew = func[canSymbol.for('can.new')];
            if (makeNew) {
                return makeNew.apply(func, args);
            } else {
                var context = Object.create(func.prototype);
                var ret = func.apply(context, args);
                if (typeReflections.isPrimitive(ret)) {
                    return context;
                } else {
                    return ret;
                }
            }
        }
    };
});
/*can-reflect@1.17.9#reflections/get-set/get-set*/
define('can-reflect@1.17.9#reflections/get-set/get-set', [
    'require',
    'exports',
    'module',
    'can-symbol',
    '../type/type'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var typeReflections = require('../type/type');
    var setKeyValueSymbol = canSymbol.for('can.setKeyValue'), getKeyValueSymbol = canSymbol.for('can.getKeyValue'), getValueSymbol = canSymbol.for('can.getValue'), setValueSymbol = canSymbol.for('can.setValue');
    var reflections = {
        setKeyValue: function (obj, key, value) {
            if (typeReflections.isSymbolLike(key)) {
                if (typeof key === 'symbol') {
                    obj[key] = value;
                } else {
                    Object.defineProperty(obj, key, {
                        enumerable: false,
                        configurable: true,
                        value: value,
                        writable: true
                    });
                }
                return;
            }
            var setKeyValue = obj[setKeyValueSymbol];
            if (setKeyValue !== undefined) {
                return setKeyValue.call(obj, key, value);
            } else {
                obj[key] = value;
            }
        },
        getKeyValue: function (obj, key) {
            var getKeyValue = obj[getKeyValueSymbol];
            if (getKeyValue) {
                return getKeyValue.call(obj, key);
            }
            return obj[key];
        },
        deleteKeyValue: function (obj, key) {
            var deleteKeyValue = obj[canSymbol.for('can.deleteKeyValue')];
            if (deleteKeyValue) {
                return deleteKeyValue.call(obj, key);
            }
            delete obj[key];
        },
        getValue: function (value) {
            if (typeReflections.isPrimitive(value)) {
                return value;
            }
            var getValue = value[getValueSymbol];
            if (getValue) {
                return getValue.call(value);
            }
            return value;
        },
        setValue: function (item, value) {
            var setValue = item && item[setValueSymbol];
            if (setValue) {
                return setValue.call(item, value);
            } else {
                throw new Error('can-reflect.setValue - Can not set value.');
            }
        },
        splice: function (obj, index, removing, adding) {
            var howMany;
            if (typeof removing !== 'number') {
                var updateValues = obj[canSymbol.for('can.updateValues')];
                if (updateValues) {
                    return updateValues.call(obj, index, removing, adding);
                }
                howMany = removing.length;
            } else {
                howMany = removing;
            }
            if (arguments.length <= 3) {
                adding = [];
            }
            var splice = obj[canSymbol.for('can.splice')];
            if (splice) {
                return splice.call(obj, index, howMany, adding);
            }
            return [].splice.apply(obj, [
                index,
                howMany
            ].concat(adding));
        },
        addValues: function (obj, adding, index) {
            var add = obj[canSymbol.for('can.addValues')];
            if (add) {
                return add.call(obj, adding, index);
            }
            if (Array.isArray(obj) && index === undefined) {
                return obj.push.apply(obj, adding);
            }
            return reflections.splice(obj, index, [], adding);
        },
        removeValues: function (obj, removing, index) {
            var removeValues = obj[canSymbol.for('can.removeValues')];
            if (removeValues) {
                return removeValues.call(obj, removing, index);
            }
            if (Array.isArray(obj) && index === undefined) {
                removing.forEach(function (item) {
                    var index = obj.indexOf(item);
                    if (index >= 0) {
                        obj.splice(index, 1);
                    }
                });
                return;
            }
            return reflections.splice(obj, index, removing, []);
        }
    };
    reflections.get = reflections.getKeyValue;
    reflections.set = reflections.setKeyValue;
    reflections['delete'] = reflections.deleteKeyValue;
    module.exports = reflections;
});
/*can-reflect@1.17.9#reflections/observe/observe*/
define('can-reflect@1.17.9#reflections/observe/observe', [
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var slice = [].slice;
    function makeFallback(symbolName, fallbackName) {
        return function (obj, event, handler, queueName) {
            var method = obj[canSymbol.for(symbolName)];
            if (method !== undefined) {
                return method.call(obj, event, handler, queueName);
            }
            return this[fallbackName].apply(this, arguments);
        };
    }
    function makeErrorIfMissing(symbolName, errorMessage) {
        return function (obj) {
            var method = obj[canSymbol.for(symbolName)];
            if (method !== undefined) {
                var args = slice.call(arguments, 1);
                return method.apply(obj, args);
            }
            throw new Error(errorMessage);
        };
    }
    module.exports = {
        onKeyValue: makeFallback('can.onKeyValue', 'onEvent'),
        offKeyValue: makeFallback('can.offKeyValue', 'offEvent'),
        onKeys: makeErrorIfMissing('can.onKeys', 'can-reflect: can not observe an onKeys event'),
        onKeysAdded: makeErrorIfMissing('can.onKeysAdded', 'can-reflect: can not observe an onKeysAdded event'),
        onKeysRemoved: makeErrorIfMissing('can.onKeysRemoved', 'can-reflect: can not unobserve an onKeysRemoved event'),
        getKeyDependencies: makeErrorIfMissing('can.getKeyDependencies', 'can-reflect: can not determine dependencies'),
        getWhatIChange: makeErrorIfMissing('can.getWhatIChange', 'can-reflect: can not determine dependencies'),
        getChangesDependencyRecord: function getChangesDependencyRecord(handler) {
            var fn = handler[canSymbol.for('can.getChangesDependencyRecord')];
            if (typeof fn === 'function') {
                return fn();
            }
        },
        keyHasDependencies: makeErrorIfMissing('can.keyHasDependencies', 'can-reflect: can not determine if this has key dependencies'),
        onValue: makeErrorIfMissing('can.onValue', 'can-reflect: can not observe value change'),
        offValue: makeErrorIfMissing('can.offValue', 'can-reflect: can not unobserve value change'),
        getValueDependencies: makeErrorIfMissing('can.getValueDependencies', 'can-reflect: can not determine dependencies'),
        valueHasDependencies: makeErrorIfMissing('can.valueHasDependencies', 'can-reflect: can not determine if value has dependencies'),
        onPatches: makeErrorIfMissing('can.onPatches', 'can-reflect: can not observe patches on object'),
        offPatches: makeErrorIfMissing('can.offPatches', 'can-reflect: can not unobserve patches on object'),
        onInstancePatches: makeErrorIfMissing('can.onInstancePatches', 'can-reflect: can not observe onInstancePatches on Type'),
        offInstancePatches: makeErrorIfMissing('can.offInstancePatches', 'can-reflect: can not unobserve onInstancePatches on Type'),
        onInstanceBoundChange: makeErrorIfMissing('can.onInstanceBoundChange', 'can-reflect: can not observe bound state change in instances.'),
        offInstanceBoundChange: makeErrorIfMissing('can.offInstanceBoundChange', 'can-reflect: can not unobserve bound state change'),
        isBound: makeErrorIfMissing('can.isBound', 'can-reflect: cannot determine if object is bound'),
        onEvent: function (obj, eventName, callback, queue) {
            if (obj) {
                var onEvent = obj[canSymbol.for('can.onEvent')];
                if (onEvent !== undefined) {
                    return onEvent.call(obj, eventName, callback, queue);
                } else if (obj.addEventListener) {
                    obj.addEventListener(eventName, callback, queue);
                }
            }
        },
        offEvent: function (obj, eventName, callback, queue) {
            if (obj) {
                var offEvent = obj[canSymbol.for('can.offEvent')];
                if (offEvent !== undefined) {
                    return offEvent.call(obj, eventName, callback, queue);
                } else if (obj.removeEventListener) {
                    obj.removeEventListener(eventName, callback, queue);
                }
            }
        },
        setPriority: function (obj, priority) {
            if (obj) {
                var setPriority = obj[canSymbol.for('can.setPriority')];
                if (setPriority !== undefined) {
                    setPriority.call(obj, priority);
                    return true;
                }
            }
            return false;
        },
        getPriority: function (obj) {
            if (obj) {
                var getPriority = obj[canSymbol.for('can.getPriority')];
                if (getPriority !== undefined) {
                    return getPriority.call(obj);
                }
            }
            return undefined;
        }
    };
});
/*can-reflect@1.17.9#reflections/shape/shape*/
define('can-reflect@1.17.9#reflections/shape/shape', [
    'require',
    'exports',
    'module',
    'can-symbol',
    '../get-set/get-set',
    '../type/type',
    '../helpers'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var getSetReflections = require('../get-set/get-set');
    var typeReflections = require('../type/type');
    var helpers = require('../helpers');
    var getPrototypeOfWorksWithPrimitives = true;
    try {
        Object.getPrototypeOf(1);
    } catch (e) {
        getPrototypeOfWorksWithPrimitives = false;
    }
    var ArrayMap;
    if (typeof Map === 'function') {
        ArrayMap = Map;
    } else {
        var isEven = function isEven(num) {
            return num % 2 === 0;
        };
        ArrayMap = function () {
            this.contents = [];
        };
        ArrayMap.prototype = {
            _getIndex: function (key) {
                var idx;
                do {
                    idx = this.contents.indexOf(key, idx);
                } while (idx !== -1 && !isEven(idx));
                return idx;
            },
            has: function (key) {
                return this._getIndex(key) !== -1;
            },
            get: function (key) {
                var idx = this._getIndex(key);
                if (idx !== -1) {
                    return this.contents[idx + 1];
                }
            },
            set: function (key, value) {
                var idx = this._getIndex(key);
                if (idx !== -1) {
                    this.contents[idx + 1] = value;
                } else {
                    this.contents.push(key);
                    this.contents.push(value);
                }
            },
            'delete': function (key) {
                var idx = this._getIndex(key);
                if (idx !== -1) {
                    this.contents.splice(idx, 2);
                }
            }
        };
    }
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var shapeReflections;
    var shiftFirstArgumentToThis = function (func) {
        return function () {
            var args = [this];
            args.push.apply(args, arguments);
            return func.apply(null, args);
        };
    };
    var getKeyValueSymbol = canSymbol.for('can.getKeyValue');
    var shiftedGetKeyValue = shiftFirstArgumentToThis(getSetReflections.getKeyValue);
    var setKeyValueSymbol = canSymbol.for('can.setKeyValue');
    var shiftedSetKeyValue = shiftFirstArgumentToThis(getSetReflections.setKeyValue);
    var sizeSymbol = canSymbol.for('can.size');
    var hasUpdateSymbol = helpers.makeGetFirstSymbolValue([
        'can.updateDeep',
        'can.assignDeep',
        'can.setKeyValue'
    ]);
    var shouldUpdateOrAssign = function (obj) {
        return typeReflections.isPlainObject(obj) || Array.isArray(obj) || !!hasUpdateSymbol(obj);
    };
    function isSerializedHelper(obj) {
        if (typeReflections.isPrimitive(obj)) {
            return true;
        }
        if (hasUpdateSymbol(obj)) {
            return false;
        }
        return typeReflections.isBuiltIn(obj) && !typeReflections.isPlainObject(obj) && !Array.isArray(obj);
    }
    var Object_Keys;
    try {
        Object.keys(1);
        Object_Keys = Object.keys;
    } catch (e) {
        Object_Keys = function (obj) {
            if (typeReflections.isPrimitive(obj)) {
                return [];
            } else {
                return Object.keys(obj);
            }
        };
    }
    function createSerializeMap(Type) {
        var MapType = Type || ArrayMap;
        return {
            unwrap: new MapType(),
            serialize: new MapType(),
            isSerializing: {
                unwrap: new MapType(),
                serialize: new MapType()
            },
            circularReferenceIsSerializing: {
                unwrap: new MapType(),
                serialize: new MapType()
            }
        };
    }
    function makeSerializer(methodName, symbolsToCheck) {
        var serializeMap = null;
        function SerializeOperation(MapType) {
            this.first = !serializeMap;
            if (this.first) {
                serializeMap = createSerializeMap(MapType);
            }
            this.map = serializeMap;
            this.result = null;
        }
        SerializeOperation.prototype.end = function () {
            if (this.first) {
                serializeMap = null;
            }
            return this.result;
        };
        return function serializer(value, MapType) {
            if (isSerializedHelper(value)) {
                return value;
            }
            var operation = new SerializeOperation(MapType);
            if (typeReflections.isValueLike(value)) {
                operation.result = this[methodName](getSetReflections.getValue(value));
            } else {
                var isListLike = typeReflections.isIteratorLike(value) || typeReflections.isMoreListLikeThanMapLike(value);
                operation.result = isListLike ? [] : {};
                if (operation.map[methodName].has(value)) {
                    if (operation.map.isSerializing[methodName].has(value)) {
                        operation.map.circularReferenceIsSerializing[methodName].set(value, true);
                    }
                    return operation.map[methodName].get(value);
                } else {
                    operation.map[methodName].set(value, operation.result);
                }
                for (var i = 0, len = symbolsToCheck.length; i < len; i++) {
                    var serializer = value[symbolsToCheck[i]];
                    if (serializer) {
                        operation.map.isSerializing[methodName].set(value, true);
                        var oldResult = operation.result;
                        operation.result = serializer.call(value, oldResult);
                        operation.map.isSerializing[methodName].delete(value);
                        if (operation.result !== oldResult) {
                            if (operation.map.circularReferenceIsSerializing[methodName].has(value)) {
                                operation.end();
                                throw new Error('Cannot serialize cirular reference!');
                            }
                            operation.map[methodName].set(value, operation.result);
                        }
                        return operation.end();
                    }
                }
                if (typeof obj === 'function') {
                    operation.map[methodName].set(value, value);
                    operation.result = value;
                } else if (isListLike) {
                    this.eachIndex(value, function (childValue, index) {
                        operation.result[index] = this[methodName](childValue);
                    }, this);
                } else {
                    this.eachKey(value, function (childValue, prop) {
                        operation.result[prop] = this[methodName](childValue);
                    }, this);
                }
            }
            return operation.end();
        };
    }
    var makeMap;
    if (typeof Map !== 'undefined') {
        makeMap = function (keys) {
            var map = new Map();
            shapeReflections.eachIndex(keys, function (key) {
                map.set(key, true);
            });
            return map;
        };
    } else {
        makeMap = function (keys) {
            var map = {};
            keys.forEach(function (key) {
                map[key] = true;
            });
            return {
                get: function (key) {
                    return map[key];
                },
                set: function (key, value) {
                    map[key] = value;
                },
                keys: function () {
                    return keys;
                }
            };
        };
    }
    var fastHasOwnKey = function (obj) {
        var hasOwnKey = obj[canSymbol.for('can.hasOwnKey')];
        if (hasOwnKey) {
            return hasOwnKey.bind(obj);
        } else {
            var map = makeMap(shapeReflections.getOwnEnumerableKeys(obj));
            return function (key) {
                return map.get(key);
            };
        }
    };
    function addPatch(patches, patch) {
        var lastPatch = patches[patches.length - 1];
        if (lastPatch) {
            if (lastPatch.deleteCount === lastPatch.insert.length && patch.index - lastPatch.index === lastPatch.deleteCount) {
                lastPatch.insert.push.apply(lastPatch.insert, patch.insert);
                lastPatch.deleteCount += patch.deleteCount;
                return;
            }
        }
        patches.push(patch);
    }
    function updateDeepList(target, source, isAssign) {
        var sourceArray = this.toArray(source);
        var patches = [], lastIndex = -1;
        this.eachIndex(target, function (curVal, index) {
            lastIndex = index;
            if (index >= sourceArray.length) {
                if (!isAssign) {
                    addPatch(patches, {
                        index: index,
                        deleteCount: target.length - index + 1,
                        insert: []
                    });
                }
                return false;
            }
            var newVal = sourceArray[index];
            if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                addPatch(patches, {
                    index: index,
                    deleteCount: 1,
                    insert: [newVal]
                });
            } else {
                if (isAssign === true) {
                    this.assignDeep(curVal, newVal);
                } else {
                    this.updateDeep(curVal, newVal);
                }
            }
        }, this);
        if (sourceArray.length > lastIndex) {
            addPatch(patches, {
                index: lastIndex + 1,
                deleteCount: 0,
                insert: sourceArray.slice(lastIndex + 1)
            });
        }
        for (var i = 0, patchLen = patches.length; i < patchLen; i++) {
            var patch = patches[i];
            getSetReflections.splice(target, patch.index, patch.deleteCount, patch.insert);
        }
        return target;
    }
    shapeReflections = {
        each: function (obj, callback, context) {
            if (typeReflections.isIteratorLike(obj) || typeReflections.isMoreListLikeThanMapLike(obj)) {
                return shapeReflections.eachIndex(obj, callback, context);
            } else {
                return shapeReflections.eachKey(obj, callback, context);
            }
        },
        eachIndex: function (list, callback, context) {
            if (Array.isArray(list)) {
                return shapeReflections.eachListLike(list, callback, context);
            } else {
                var iter, iterator = list[canSymbol.iterator];
                if (typeReflections.isIteratorLike(list)) {
                    iter = list;
                } else if (iterator) {
                    iter = iterator.call(list);
                }
                if (iter) {
                    var res, index = 0;
                    while (!(res = iter.next()).done) {
                        if (callback.call(context || list, res.value, index++, list) === false) {
                            break;
                        }
                    }
                } else {
                    shapeReflections.eachListLike(list, callback, context);
                }
            }
            return list;
        },
        eachListLike: function (list, callback, context) {
            var index = -1;
            var length = list.length;
            if (length === undefined) {
                var size = list[sizeSymbol];
                if (size) {
                    length = size.call(list);
                } else {
                    throw new Error('can-reflect: unable to iterate.');
                }
            }
            while (++index < length) {
                var item = list[index];
                if (callback.call(context || item, item, index, list) === false) {
                    break;
                }
            }
            return list;
        },
        toArray: function (obj) {
            var arr = [];
            shapeReflections.each(obj, function (value) {
                arr.push(value);
            });
            return arr;
        },
        eachKey: function (obj, callback, context) {
            if (obj) {
                var enumerableKeys = shapeReflections.getOwnEnumerableKeys(obj);
                var getKeyValue = obj[getKeyValueSymbol] || shiftedGetKeyValue;
                return shapeReflections.eachIndex(enumerableKeys, function (key) {
                    var value = getKeyValue.call(obj, key);
                    return callback.call(context || obj, value, key, obj);
                });
            }
            return obj;
        },
        'hasOwnKey': function (obj, key) {
            var hasOwnKey = obj[canSymbol.for('can.hasOwnKey')];
            if (hasOwnKey) {
                return hasOwnKey.call(obj, key);
            }
            var getOwnKeys = obj[canSymbol.for('can.getOwnKeys')];
            if (getOwnKeys) {
                var found = false;
                shapeReflections.eachIndex(getOwnKeys.call(obj), function (objKey) {
                    if (objKey === key) {
                        found = true;
                        return false;
                    }
                });
                return found;
            }
            return hasOwnProperty.call(obj, key);
        },
        getOwnEnumerableKeys: function (obj) {
            var getOwnEnumerableKeys = obj[canSymbol.for('can.getOwnEnumerableKeys')];
            if (getOwnEnumerableKeys) {
                return getOwnEnumerableKeys.call(obj);
            }
            if (obj[canSymbol.for('can.getOwnKeys')] && obj[canSymbol.for('can.getOwnKeyDescriptor')]) {
                var keys = [];
                shapeReflections.eachIndex(shapeReflections.getOwnKeys(obj), function (key) {
                    var descriptor = shapeReflections.getOwnKeyDescriptor(obj, key);
                    if (descriptor.enumerable) {
                        keys.push(key);
                    }
                }, this);
                return keys;
            } else {
                return Object_Keys(obj);
            }
        },
        getOwnKeys: function (obj) {
            var getOwnKeys = obj[canSymbol.for('can.getOwnKeys')];
            if (getOwnKeys) {
                return getOwnKeys.call(obj);
            } else {
                return Object.getOwnPropertyNames(obj);
            }
        },
        getOwnKeyDescriptor: function (obj, key) {
            var getOwnKeyDescriptor = obj[canSymbol.for('can.getOwnKeyDescriptor')];
            if (getOwnKeyDescriptor) {
                return getOwnKeyDescriptor.call(obj, key);
            } else {
                return Object.getOwnPropertyDescriptor(obj, key);
            }
        },
        unwrap: makeSerializer('unwrap', [canSymbol.for('can.unwrap')]),
        serialize: makeSerializer('serialize', [
            canSymbol.for('can.serialize'),
            canSymbol.for('can.unwrap')
        ]),
        assignMap: function (target, source) {
            var hasOwnKey = fastHasOwnKey(target);
            var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
            var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            shapeReflections.eachKey(source, function (value, key) {
                if (!hasOwnKey(key) || getKeyValue.call(target, key) !== value) {
                    setKeyValue.call(target, key, value);
                }
            });
            return target;
        },
        assignList: function (target, source) {
            var inserting = shapeReflections.toArray(source);
            getSetReflections.splice(target, 0, inserting, inserting);
            return target;
        },
        assign: function (target, source) {
            if (typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source)) {
                shapeReflections.assignList(target, source);
            } else {
                shapeReflections.assignMap(target, source);
            }
            return target;
        },
        assignDeepMap: function (target, source) {
            var hasOwnKey = fastHasOwnKey(target);
            var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
            var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            shapeReflections.eachKey(source, function (newVal, key) {
                if (!hasOwnKey(key)) {
                    getSetReflections.setKeyValue(target, key, newVal);
                } else {
                    var curVal = getKeyValue.call(target, key);
                    if (newVal === curVal) {
                    } else if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                        setKeyValue.call(target, key, newVal);
                    } else {
                        shapeReflections.assignDeep(curVal, newVal);
                    }
                }
            }, this);
            return target;
        },
        assignDeepList: function (target, source) {
            return updateDeepList.call(this, target, source, true);
        },
        assignDeep: function (target, source) {
            var assignDeep = target[canSymbol.for('can.assignDeep')];
            if (assignDeep) {
                assignDeep.call(target, source);
            } else if (typeReflections.isMoreListLikeThanMapLike(source)) {
                shapeReflections.assignDeepList(target, source);
            } else {
                shapeReflections.assignDeepMap(target, source);
            }
            return target;
        },
        updateMap: function (target, source) {
            var sourceKeyMap = makeMap(shapeReflections.getOwnEnumerableKeys(source));
            var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
            var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            shapeReflections.eachKey(target, function (curVal, key) {
                if (!sourceKeyMap.get(key)) {
                    getSetReflections.deleteKeyValue(target, key);
                    return;
                }
                sourceKeyMap.set(key, false);
                var newVal = sourceGetKeyValue.call(source, key);
                if (newVal !== curVal) {
                    targetSetKeyValue.call(target, key, newVal);
                }
            }, this);
            shapeReflections.eachIndex(sourceKeyMap.keys(), function (key) {
                if (sourceKeyMap.get(key)) {
                    targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key));
                }
            });
            return target;
        },
        updateList: function (target, source) {
            var inserting = shapeReflections.toArray(source);
            getSetReflections.splice(target, 0, target, inserting);
            return target;
        },
        update: function (target, source) {
            if (typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source)) {
                shapeReflections.updateList(target, source);
            } else {
                shapeReflections.updateMap(target, source);
            }
            return target;
        },
        updateDeepMap: function (target, source) {
            var sourceKeyMap = makeMap(shapeReflections.getOwnEnumerableKeys(source));
            var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
            var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            shapeReflections.eachKey(target, function (curVal, key) {
                if (!sourceKeyMap.get(key)) {
                    getSetReflections.deleteKeyValue(target, key);
                    return;
                }
                sourceKeyMap.set(key, false);
                var newVal = sourceGetKeyValue.call(source, key);
                if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                    targetSetKeyValue.call(target, key, newVal);
                } else {
                    shapeReflections.updateDeep(curVal, newVal);
                }
            }, this);
            shapeReflections.eachIndex(sourceKeyMap.keys(), function (key) {
                if (sourceKeyMap.get(key)) {
                    targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key));
                }
            });
            return target;
        },
        updateDeepList: function (target, source) {
            return updateDeepList.call(this, target, source);
        },
        updateDeep: function (target, source) {
            var updateDeep = target[canSymbol.for('can.updateDeep')];
            if (updateDeep) {
                updateDeep.call(target, source);
            } else if (typeReflections.isMoreListLikeThanMapLike(source)) {
                shapeReflections.updateDeepList(target, source);
            } else {
                shapeReflections.updateDeepMap(target, source);
            }
            return target;
        },
        hasKey: function (obj, key) {
            if (obj == null) {
                return false;
            }
            if (typeReflections.isPrimitive(obj)) {
                if (hasOwnProperty.call(obj, key)) {
                    return true;
                } else {
                    var proto;
                    if (getPrototypeOfWorksWithPrimitives) {
                        proto = Object.getPrototypeOf(obj);
                    } else {
                        proto = obj.__proto__;
                    }
                    if (proto !== undefined) {
                        return key in proto;
                    } else {
                        return obj[key] !== undefined;
                    }
                }
            }
            var hasKey = obj[canSymbol.for('can.hasKey')];
            if (hasKey) {
                return hasKey.call(obj, key);
            }
            var found = shapeReflections.hasOwnKey(obj, key);
            return found || key in obj;
        },
        getAllEnumerableKeys: function () {
        },
        getAllKeys: function () {
        },
        assignSymbols: function (target, source) {
            shapeReflections.eachKey(source, function (value, key) {
                var symbol = typeReflections.isSymbolLike(canSymbol[key]) ? canSymbol[key] : canSymbol.for(key);
                getSetReflections.setKeyValue(target, symbol, value);
            });
            return target;
        },
        isSerialized: isSerializedHelper,
        size: function (obj) {
            if (obj == null) {
                return 0;
            }
            var size = obj[sizeSymbol];
            var count = 0;
            if (size) {
                return size.call(obj);
            } else if (helpers.hasLength(obj)) {
                return obj.length;
            } else if (typeReflections.isListLike(obj)) {
                shapeReflections.eachIndex(obj, function () {
                    count++;
                });
                return count;
            } else if (obj) {
                return shapeReflections.getOwnEnumerableKeys(obj).length;
            } else {
                return undefined;
            }
        },
        defineInstanceKey: function (cls, key, properties) {
            var defineInstanceKey = cls[canSymbol.for('can.defineInstanceKey')];
            if (defineInstanceKey) {
                return defineInstanceKey.call(cls, key, properties);
            }
            var proto = cls.prototype;
            defineInstanceKey = proto[canSymbol.for('can.defineInstanceKey')];
            if (defineInstanceKey) {
                defineInstanceKey.call(proto, key, properties);
            } else {
                Object.defineProperty(proto, key, shapeReflections.assign({
                    configurable: true,
                    enumerable: !typeReflections.isSymbolLike(key),
                    writable: true
                }, properties));
            }
        }
    };
    shapeReflections.isSerializable = shapeReflections.isSerialized;
    shapeReflections.keys = shapeReflections.getOwnEnumerableKeys;
    module.exports = shapeReflections;
});
/*can-reflect@1.17.9#reflections/shape/schema/schema*/
define('can-reflect@1.17.9#reflections/shape/schema/schema', [
    'require',
    'exports',
    'module',
    'can-symbol',
    '../../type/type',
    '../../get-set/get-set',
    '../shape'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var typeReflections = require('../../type/type');
    var getSetReflections = require('../../get-set/get-set');
    var shapeReflections = require('../shape');
    var getSchemaSymbol = canSymbol.for('can.getSchema'), isMemberSymbol = canSymbol.for('can.isMember'), newSymbol = canSymbol.for('can.new');
    function comparator(a, b) {
        return a.localeCompare(b);
    }
    function sort(obj) {
        if (typeReflections.isPrimitive(obj)) {
            return obj;
        }
        var out;
        if (typeReflections.isListLike(obj)) {
            out = [];
            shapeReflections.eachKey(obj, function (item) {
                out.push(sort(item));
            });
            return out;
        }
        if (typeReflections.isMapLike(obj)) {
            out = {};
            shapeReflections.getOwnKeys(obj).sort(comparator).forEach(function (key) {
                out[key] = sort(getSetReflections.getKeyValue(obj, key));
            });
            return out;
        }
        return obj;
    }
    function isPrimitiveConverter(Type) {
        return Type === Number || Type === String || Type === Boolean;
    }
    var schemaReflections = {
        getSchema: function (type) {
            if (type === undefined) {
                return undefined;
            }
            var getSchema = type[getSchemaSymbol];
            if (getSchema === undefined) {
                type = type.constructor;
                getSchema = type && type[getSchemaSymbol];
            }
            return getSchema !== undefined ? getSchema.call(type) : undefined;
        },
        getIdentity: function (value, schema) {
            schema = schema || schemaReflections.getSchema(value);
            if (schema === undefined) {
                throw new Error('can-reflect.getIdentity - Unable to find a schema for the given value.');
            }
            var identity = schema.identity;
            if (!identity || identity.length === 0) {
                throw new Error('can-reflect.getIdentity - Provided schema lacks an identity property.');
            } else if (identity.length === 1) {
                return getSetReflections.getKeyValue(value, identity[0]);
            } else {
                var id = {};
                identity.forEach(function (key) {
                    id[key] = getSetReflections.getKeyValue(value, key);
                });
                return JSON.stringify(schemaReflections.cloneKeySort(id));
            }
        },
        cloneKeySort: function (obj) {
            return sort(obj);
        },
        convert: function (value, Type) {
            if (isPrimitiveConverter(Type)) {
                return Type(value);
            }
            var isMemberTest = Type[isMemberSymbol], isMember = false, type = typeof Type, createNew = Type[newSymbol];
            if (isMemberTest !== undefined) {
                isMember = isMemberTest.call(Type, value);
            } else if (type === 'function') {
                if (typeReflections.isConstructorLike(Type)) {
                    isMember = value instanceof Type;
                }
            }
            if (isMember) {
                return value;
            }
            if (createNew !== undefined) {
                return createNew.call(Type, value);
            } else if (type === 'function') {
                if (typeReflections.isConstructorLike(Type)) {
                    return new Type(value);
                } else {
                    return Type(value);
                }
            } else {
                throw new Error('can-reflect: Can not convert values into type. Type must provide `can.new` symbol.');
            }
        }
    };
    module.exports = schemaReflections;
});
/*can-reflect@1.17.9#reflections/get-name/get-name*/
define('can-reflect@1.17.9#reflections/get-name/get-name', [
    'require',
    'exports',
    'module',
    'can-symbol',
    '../type/type'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var typeReflections = require('../type/type');
    var getNameSymbol = canSymbol.for('can.getName');
    function setName(obj, nameGetter) {
        if (typeof nameGetter !== 'function') {
            var value = nameGetter;
            nameGetter = function () {
                return value;
            };
        }
        Object.defineProperty(obj, getNameSymbol, { value: nameGetter });
    }
    var anonymousID = 0;
    function getName(obj) {
        var type = typeof obj;
        if (obj === null || type !== 'object' && type !== 'function') {
            return '' + obj;
        }
        var nameGetter = obj[getNameSymbol];
        if (nameGetter) {
            return nameGetter.call(obj);
        }
        if (type === 'function') {
            if (!('name' in obj)) {
                obj.name = 'functionIE' + anonymousID++;
            }
            return obj.name;
        }
        if (obj.constructor && obj !== obj.constructor) {
            var parent = getName(obj.constructor);
            if (parent) {
                if (typeReflections.isValueLike(obj)) {
                    return parent + '<>';
                }
                if (typeReflections.isMoreListLikeThanMapLike(obj)) {
                    return parent + '[]';
                }
                if (typeReflections.isMapLike(obj)) {
                    return parent + '{}';
                }
            }
        }
        return undefined;
    }
    module.exports = {
        setName: setName,
        getName: getName
    };
});
/*can-reflect@1.17.9#types/map*/
define('can-reflect@1.17.9#types/map', [
    'require',
    'exports',
    'module',
    '../reflections/shape/shape',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var shape = require('../reflections/shape/shape');
    var CanSymbol = require('can-symbol');
    function keysPolyfill() {
        var keys = [];
        var currentIndex = 0;
        this.forEach(function (val, key) {
            keys.push(key);
        });
        return {
            next: function () {
                return {
                    value: keys[currentIndex],
                    done: currentIndex++ === keys.length
                };
            }
        };
    }
    if (typeof Map !== 'undefined') {
        shape.assignSymbols(Map.prototype, {
            'can.getOwnEnumerableKeys': Map.prototype.keys,
            'can.setKeyValue': Map.prototype.set,
            'can.getKeyValue': Map.prototype.get,
            'can.deleteKeyValue': Map.prototype['delete'],
            'can.hasOwnKey': Map.prototype.has
        });
        if (typeof Map.prototype.keys !== 'function') {
            Map.prototype.keys = Map.prototype[CanSymbol.for('can.getOwnEnumerableKeys')] = keysPolyfill;
        }
    }
    if (typeof WeakMap !== 'undefined') {
        shape.assignSymbols(WeakMap.prototype, {
            'can.getOwnEnumerableKeys': function () {
                throw new Error('can-reflect: WeakMaps do not have enumerable keys.');
            },
            'can.setKeyValue': WeakMap.prototype.set,
            'can.getKeyValue': WeakMap.prototype.get,
            'can.deleteKeyValue': WeakMap.prototype['delete'],
            'can.hasOwnKey': WeakMap.prototype.has
        });
    }
});
/*can-reflect@1.17.9#types/set*/
define('can-reflect@1.17.9#types/set', [
    'require',
    'exports',
    'module',
    '../reflections/shape/shape',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var shape = require('../reflections/shape/shape');
    var CanSymbol = require('can-symbol');
    if (typeof Set !== 'undefined') {
        shape.assignSymbols(Set.prototype, {
            'can.isMoreListLikeThanMapLike': true,
            'can.updateValues': function (index, removing, adding) {
                if (removing !== adding) {
                    shape.each(removing, function (value) {
                        this.delete(value);
                    }, this);
                }
                shape.each(adding, function (value) {
                    this.add(value);
                }, this);
            },
            'can.size': function () {
                return this.size;
            }
        });
        if (typeof Set.prototype[CanSymbol.iterator] !== 'function') {
            Set.prototype[CanSymbol.iterator] = function () {
                var arr = [];
                var currentIndex = 0;
                this.forEach(function (val) {
                    arr.push(val);
                });
                return {
                    next: function () {
                        return {
                            value: arr[currentIndex],
                            done: currentIndex++ === arr.length
                        };
                    }
                };
            };
        }
    }
    if (typeof WeakSet !== 'undefined') {
        shape.assignSymbols(WeakSet.prototype, {
            'can.isListLike': true,
            'can.isMoreListLikeThanMapLike': true,
            'can.updateValues': function (index, removing, adding) {
                if (removing !== adding) {
                    shape.each(removing, function (value) {
                        this.delete(value);
                    }, this);
                }
                shape.each(adding, function (value) {
                    this.add(value);
                }, this);
            },
            'can.size': function () {
                throw new Error('can-reflect: WeakSets do not have enumerable keys.');
            }
        });
    }
});
/*can-reflect@1.17.9#can-reflect*/
define('can-reflect@1.17.9#can-reflect', [
    'require',
    'exports',
    'module',
    './reflections/call/call',
    './reflections/get-set/get-set',
    './reflections/observe/observe',
    './reflections/shape/shape',
    './reflections/shape/schema/schema',
    './reflections/type/type',
    './reflections/get-name/get-name',
    'can-namespace',
    './types/map',
    './types/set'
], function (require, exports, module) {
    'use strict';
    var functionReflections = require('./reflections/call/call');
    var getSet = require('./reflections/get-set/get-set');
    var observe = require('./reflections/observe/observe');
    var shape = require('./reflections/shape/shape');
    var schema = require('./reflections/shape/schema/schema');
    var type = require('./reflections/type/type');
    var getName = require('./reflections/get-name/get-name');
    var namespace = require('can-namespace');
    var reflect = {};
    [
        functionReflections,
        getSet,
        observe,
        shape,
        type,
        getName,
        schema
    ].forEach(function (reflections) {
        for (var prop in reflections) {
            reflect[prop] = reflections[prop];
        }
    });
    require('./types/map');
    require('./types/set');
    module.exports = namespace.Reflect = reflect;
});
/*can-log@1.0.0#can-log*/
define('can-log@1.0.0#can-log', function (require, exports, module) {
    'use strict';
    exports.warnTimeout = 5000;
    exports.logLevel = 0;
    exports.warn = function () {
        var ll = this.logLevel;
        if (ll < 2) {
            if (typeof console !== 'undefined' && console.warn) {
                this._logger('warn', Array.prototype.slice.call(arguments));
            } else if (typeof console !== 'undefined' && console.log) {
                this._logger('log', Array.prototype.slice.call(arguments));
            }
        }
    };
    exports.log = function () {
        var ll = this.logLevel;
        if (ll < 1) {
            if (typeof console !== 'undefined' && console.log) {
                this._logger('log', Array.prototype.slice.call(arguments));
            }
        }
    };
    exports.error = function () {
        var ll = this.logLevel;
        if (ll < 1) {
            if (typeof console !== 'undefined' && console.error) {
                this._logger('error', Array.prototype.slice.call(arguments));
            }
        }
    };
    exports._logger = function (type, arr) {
        try {
            console[type].apply(console, arr);
        } catch (e) {
            console[type](arr);
        }
    };
});
/*can-log@1.0.0#dev/dev*/
define('can-log@1.0.0#dev/dev', [
    'require',
    'exports',
    'module',
    '../can-log'
], function (require, exports, module) {
    'use strict';
    var canLog = require('../can-log');
    module.exports = {
        warnTimeout: 5000,
        logLevel: 0,
        stringify: function (value) {
            var flagUndefined = function flagUndefined(key, value) {
                return value === undefined ? '/* void(undefined) */' : value;
            };
            return JSON.stringify(value, flagUndefined, '  ').replace(/"\/\* void\(undefined\) \*\/"/g, 'undefined');
        },
        warn: function () {
        },
        log: function () {
        },
        error: function () {
        },
        _logger: canLog._logger
    };
});
/*can-string@1.0.0#can-string*/
define('can-string@1.0.0#can-string', function (require, exports, module) {
    'use strict';
    var strUndHash = /_|-/, strColons = /\=\=/, strWords = /([A-Z]+)([A-Z][a-z])/g, strLowUp = /([a-z\d])([A-Z])/g, strDash = /([a-z\d])([A-Z])/g, strQuote = /"/g, strSingleQuote = /'/g, strHyphenMatch = /-+(.)?/g, strCamelMatch = /[a-z][A-Z]/g, convertBadValues = function (content) {
            var isInvalid = content === null || content === undefined || isNaN(content) && '' + content === 'NaN';
            return '' + (isInvalid ? '' : content);
        };
    var string = {
        esc: function (content) {
            return convertBadValues(content).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(strQuote, '&#34;').replace(strSingleQuote, '&#39;');
        },
        capitalize: function (s) {
            return s.charAt(0).toUpperCase() + s.slice(1);
        },
        camelize: function (str) {
            return convertBadValues(str).replace(strHyphenMatch, function (match, chr) {
                return chr ? chr.toUpperCase() : '';
            });
        },
        hyphenate: function (str) {
            return convertBadValues(str).replace(strCamelMatch, function (str) {
                return str.charAt(0) + '-' + str.charAt(1).toLowerCase();
            });
        },
        underscore: function (s) {
            return s.replace(strColons, '/').replace(strWords, '$1_$2').replace(strLowUp, '$1_$2').replace(strDash, '_').toLowerCase();
        },
        undHash: strUndHash
    };
    module.exports = string;
});
/*can-construct@3.5.3#can-construct*/
define('can-construct@3.5.3#can-construct', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-log/dev/dev',
    'can-namespace'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var dev = require('can-log/dev/dev');
    var namespace = require('can-namespace');
    var initializing = 0;
    var Construct = function () {
        if (arguments.length) {
            return Construct.extend.apply(Construct, arguments);
        }
    };
    var canGetDescriptor;
    try {
        Object.getOwnPropertyDescriptor({});
        canGetDescriptor = true;
    } catch (e) {
        canGetDescriptor = false;
    }
    var getDescriptor = function (newProps, name) {
            var descriptor = Object.getOwnPropertyDescriptor(newProps, name);
            if (descriptor && (descriptor.get || descriptor.set)) {
                return descriptor;
            }
            return null;
        }, inheritGetterSetter = function (newProps, oldProps, addTo) {
            addTo = addTo || newProps;
            var descriptor;
            for (var name in newProps) {
                if (descriptor = getDescriptor(newProps, name)) {
                    this._defineProperty(addTo, oldProps, name, descriptor);
                } else {
                    Construct._overwrite(addTo, oldProps, name, newProps[name]);
                }
            }
        }, simpleInherit = function (newProps, oldProps, addTo) {
            addTo = addTo || newProps;
            for (var name in newProps) {
                Construct._overwrite(addTo, oldProps, name, newProps[name]);
            }
        }, defineNonEnumerable = function (obj, prop, value) {
            Object.defineProperty(obj, prop, {
                configurable: true,
                writable: true,
                enumerable: false,
                value: value
            });
        };
    canReflect.assignMap(Construct, {
        constructorExtends: true,
        newInstance: function () {
            var inst = this.instance(), args;
            if (inst.setup) {
                Object.defineProperty(inst, '__inSetup', {
                    configurable: true,
                    enumerable: false,
                    value: true,
                    writable: true
                });
                args = inst.setup.apply(inst, arguments);
                if (args instanceof Construct.ReturnValue) {
                    return args.value;
                }
                inst.__inSetup = false;
            }
            if (inst.init) {
                inst.init.apply(inst, args || arguments);
            }
            return inst;
        },
        _inherit: canGetDescriptor ? inheritGetterSetter : simpleInherit,
        _defineProperty: function (what, oldProps, propName, descriptor) {
            Object.defineProperty(what, propName, descriptor);
        },
        _overwrite: function (what, oldProps, propName, val) {
            Object.defineProperty(what, propName, {
                value: val,
                configurable: true,
                enumerable: true,
                writable: true
            });
        },
        setup: function (base) {
            var defaults = canReflect.assignDeepMap({}, base.defaults);
            this.defaults = canReflect.assignDeepMap(defaults, this.defaults);
        },
        instance: function () {
            initializing = 1;
            var inst = new this();
            initializing = 0;
            return inst;
        },
        extend: function (name, staticProperties, instanceProperties) {
            var shortName = name, klass = staticProperties, proto = instanceProperties;
            if (typeof shortName !== 'string') {
                proto = klass;
                klass = shortName;
                shortName = null;
            }
            if (!proto) {
                proto = klass;
                klass = null;
            }
            proto = proto || {};
            var _super_class = this, _super = this.prototype, Constructor, prototype;
            prototype = this.instance();
            Construct._inherit(proto, _super, prototype);
            if (shortName) {
            } else if (klass && klass.shortName) {
                shortName = klass.shortName;
            } else if (this.shortName) {
                shortName = this.shortName;
            }
            function init() {
                if (!initializing) {
                    return (!this || this.constructor !== Constructor) && arguments.length && Constructor.constructorExtends ? Constructor.extend.apply(Constructor, arguments) : Constructor.newInstance.apply(Constructor, arguments);
                }
            }
            Constructor = typeof namedCtor === 'function' ? namedCtor(constructorName, init) : function () {
                return init.apply(this, arguments);
            };
            for (var propName in _super_class) {
                if (_super_class.hasOwnProperty(propName)) {
                    Constructor[propName] = _super_class[propName];
                }
            }
            Construct._inherit(klass, _super_class, Constructor);
            canReflect.assignMap(Constructor, {
                constructor: Constructor,
                prototype: prototype
            });
            if (shortName !== undefined) {
                if (Object.getOwnPropertyDescriptor) {
                    var desc = Object.getOwnPropertyDescriptor(Constructor, 'name');
                    if (!desc || desc.configurable) {
                        Object.defineProperty(Constructor, 'name', {
                            writable: true,
                            value: shortName,
                            configurable: true
                        });
                    }
                }
                Constructor.shortName = shortName;
            }
            defineNonEnumerable(Constructor.prototype, 'constructor', Constructor);
            var t = [_super_class].concat(Array.prototype.slice.call(arguments)), args = Constructor.setup.apply(Constructor, t);
            if (Constructor.init) {
                Constructor.init.apply(Constructor, args || t);
            }
            return Constructor;
        },
        ReturnValue: function (value) {
            this.value = value;
        }
    });
    defineNonEnumerable(Construct.prototype, 'setup', function () {
    });
    defineNonEnumerable(Construct.prototype, 'init', function () {
    });
    module.exports = namespace.Construct = Construct;
});
/*can-queues@1.2.1#queue-state*/
define('can-queues@1.2.1#queue-state', function (require, exports, module) {
    'use strict';
    module.exports = { lastTask: null };
});
/*can-assign@1.3.1#can-assign*/
define('can-assign@1.3.1#can-assign', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    var namespace = require('can-namespace');
    module.exports = namespace.assign = function (d, s) {
        for (var prop in s) {
            var desc = Object.getOwnPropertyDescriptor(d, prop);
            if (!desc || desc.writable !== false) {
                d[prop] = s[prop];
            }
        }
        return d;
    };
});
/*can-queues@1.2.1#queue*/
define('can-queues@1.2.1#queue', [
    'require',
    'exports',
    'module',
    './queue-state',
    'can-log/dev/dev',
    'can-assign'
], function (require, exports, module) {
    'use strict';
    var queueState = require('./queue-state');
    var canDev = require('can-log/dev/dev');
    var assign = require('can-assign');
    function noOperation() {
    }
    var Queue = function (name, callbacks) {
        this.callbacks = assign({
            onFirstTask: noOperation,
            onComplete: function () {
                queueState.lastTask = null;
            }
        }, callbacks || {});
        this.name = name;
        this.index = 0;
        this.tasks = [];
        this._log = false;
    };
    Queue.prototype.constructor = Queue;
    Queue.noop = noOperation;
    Queue.prototype.enqueue = function (fn, context, args, meta) {
        var len = this.tasks.push({
            fn: fn,
            context: context,
            args: args,
            meta: meta || {}
        });
        if (len === 1) {
            this.callbacks.onFirstTask(this);
        }
    };
    Queue.prototype.flush = function () {
        while (this.index < this.tasks.length) {
            var task = this.tasks[this.index++];
            task.fn.apply(task.context, task.args);
        }
        this.index = 0;
        this.tasks = [];
        this.callbacks.onComplete(this);
    };
    Queue.prototype.log = function () {
        this._log = arguments.length ? arguments[0] : true;
    };
    module.exports = Queue;
});
/*can-queues@1.2.1#priority-queue*/
define('can-queues@1.2.1#priority-queue', [
    'require',
    'exports',
    'module',
    './queue'
], function (require, exports, module) {
    'use strict';
    var Queue = require('./queue');
    var PriorityQueue = function () {
        Queue.apply(this, arguments);
        this.taskMap = new Map();
        this.taskContainersByPriority = [];
        this.curPriorityIndex = Infinity;
        this.curPriorityMax = 0;
        this.isFlushing = false;
        this.tasksRemaining = 0;
    };
    PriorityQueue.prototype = Object.create(Queue.prototype);
    PriorityQueue.prototype.constructor = PriorityQueue;
    PriorityQueue.prototype.enqueue = function (fn, context, args, meta) {
        if (!this.taskMap.has(fn)) {
            this.tasksRemaining++;
            var isFirst = this.taskContainersByPriority.length === 0;
            var task = {
                fn: fn,
                context: context,
                args: args,
                meta: meta || {}
            };
            var taskContainer = this.getTaskContainerAndUpdateRange(task);
            taskContainer.tasks.push(task);
            this.taskMap.set(fn, task);
            if (isFirst) {
                this.callbacks.onFirstTask(this);
            }
        }
    };
    PriorityQueue.prototype.getTaskContainerAndUpdateRange = function (task) {
        var priority = task.meta.priority || 0;
        if (priority < this.curPriorityIndex) {
            this.curPriorityIndex = priority;
        }
        if (priority > this.curPriorityMax) {
            this.curPriorityMax = priority;
        }
        var tcByPriority = this.taskContainersByPriority;
        var taskContainer = tcByPriority[priority];
        if (!taskContainer) {
            taskContainer = tcByPriority[priority] = {
                tasks: [],
                index: 0
            };
        }
        return taskContainer;
    };
    PriorityQueue.prototype.flush = function () {
        if (this.isFlushing) {
            return;
        }
        this.isFlushing = true;
        while (true) {
            if (this.curPriorityIndex <= this.curPriorityMax) {
                var taskContainer = this.taskContainersByPriority[this.curPriorityIndex];
                if (taskContainer && taskContainer.tasks.length > taskContainer.index) {
                    var task = taskContainer.tasks[taskContainer.index++];
                    this.tasksRemaining--;
                    this.taskMap['delete'](task.fn);
                    task.fn.apply(task.context, task.args);
                } else {
                    this.curPriorityIndex++;
                }
            } else {
                this.taskMap = new Map();
                this.curPriorityIndex = Infinity;
                this.curPriorityMax = 0;
                this.taskContainersByPriority = [];
                this.isFlushing = false;
                this.callbacks.onComplete(this);
                return;
            }
        }
    };
    PriorityQueue.prototype.isEnqueued = function (fn) {
        return this.taskMap.has(fn);
    };
    PriorityQueue.prototype.flushQueuedTask = function (fn) {
        var task = this.dequeue(fn);
        if (task) {
            task.fn.apply(task.context, task.args);
        }
    };
    PriorityQueue.prototype.dequeue = function (fn) {
        var task = this.taskMap.get(fn);
        if (task) {
            var priority = task.meta.priority || 0;
            var taskContainer = this.taskContainersByPriority[priority];
            var index = taskContainer.tasks.indexOf(task, taskContainer.index);
            if (index >= 0) {
                taskContainer.tasks.splice(index, 1);
                this.tasksRemaining--;
                this.taskMap['delete'](task.fn);
                return task;
            } else {
                console.warn('Task', fn, 'has already run');
            }
        }
    };
    PriorityQueue.prototype.tasksRemainingCount = function () {
        return this.tasksRemaining;
    };
    module.exports = PriorityQueue;
});
/*can-queues@1.2.1#completion-queue*/
define('can-queues@1.2.1#completion-queue', [
    'require',
    'exports',
    'module',
    './queue'
], function (require, exports, module) {
    'use strict';
    var Queue = require('./queue');
    var CompletionQueue = function () {
        Queue.apply(this, arguments);
        this.flushCount = 0;
    };
    CompletionQueue.prototype = Object.create(Queue.prototype);
    CompletionQueue.prototype.constructor = CompletionQueue;
    CompletionQueue.prototype.flush = function () {
        if (this.flushCount === 0) {
            this.flushCount++;
            while (this.index < this.tasks.length) {
                var task = this.tasks[this.index++];
                task.fn.apply(task.context, task.args);
            }
            this.index = 0;
            this.tasks = [];
            this.flushCount--;
            this.callbacks.onComplete(this);
        }
    };
    module.exports = CompletionQueue;
});
/*can-queues@1.2.1#can-queues*/
define('can-queues@1.2.1#can-queues', [
    'require',
    'exports',
    'module',
    'can-log/dev/dev',
    './queue',
    './priority-queue',
    './queue-state',
    './completion-queue',
    'can-namespace'
], function (require, exports, module) {
    'use strict';
    var canDev = require('can-log/dev/dev');
    var Queue = require('./queue');
    var PriorityQueue = require('./priority-queue');
    var queueState = require('./queue-state');
    var CompletionQueue = require('./completion-queue');
    var ns = require('can-namespace');
    var batchStartCounter = 0;
    var addedTask = false;
    var isFlushing = false;
    var batchNum = 0;
    var batchData;
    var queueNames = [
        'notify',
        'derive',
        'domUI',
        'mutate'
    ];
    var NOTIFY_QUEUE, DERIVE_QUEUE, DOM_UI_QUEUE, MUTATE_QUEUE;
    NOTIFY_QUEUE = new Queue('NOTIFY', {
        onComplete: function () {
            DERIVE_QUEUE.flush();
        },
        onFirstTask: function () {
            if (!batchStartCounter) {
                NOTIFY_QUEUE.flush();
            } else {
                addedTask = true;
            }
        }
    });
    DERIVE_QUEUE = new PriorityQueue('DERIVE', {
        onComplete: function () {
            DOM_UI_QUEUE.flush();
        },
        onFirstTask: function () {
            addedTask = true;
        }
    });
    DOM_UI_QUEUE = new CompletionQueue('DOM_UI', {
        onComplete: function () {
            MUTATE_QUEUE.flush();
        },
        onFirstTask: function () {
            addedTask = true;
        }
    });
    MUTATE_QUEUE = new Queue('MUTATE', {
        onComplete: function () {
            queueState.lastTask = null;
            isFlushing = false;
        },
        onFirstTask: function () {
            addedTask = true;
        }
    });
    var queues = {
        Queue: Queue,
        PriorityQueue: PriorityQueue,
        CompletionQueue: CompletionQueue,
        notifyQueue: NOTIFY_QUEUE,
        deriveQueue: DERIVE_QUEUE,
        domUIQueue: DOM_UI_QUEUE,
        mutateQueue: MUTATE_QUEUE,
        batch: {
            start: function () {
                batchStartCounter++;
                if (batchStartCounter === 1) {
                    batchNum++;
                    batchData = { number: batchNum };
                }
            },
            stop: function () {
                batchStartCounter--;
                if (batchStartCounter === 0) {
                    if (addedTask) {
                        addedTask = false;
                        isFlushing = true;
                        NOTIFY_QUEUE.flush();
                    }
                }
            },
            isCollecting: function () {
                return batchStartCounter > 0;
            },
            number: function () {
                return batchNum;
            },
            data: function () {
                return batchData;
            }
        },
        runAsTask: function (fn, reasonLog) {
            return fn;
        },
        enqueueByQueue: function enqueueByQueue(fnByQueue, context, args, makeMeta, reasonLog) {
            if (fnByQueue) {
                queues.batch.start();
                queueNames.forEach(function (queueName) {
                    var name = queueName + 'Queue';
                    var QUEUE = queues[name];
                    var tasks = fnByQueue[queueName];
                    if (tasks !== undefined) {
                        tasks.forEach(function (fn) {
                            var meta = makeMeta != null ? makeMeta(fn, context, args) : {};
                            meta.reasonLog = reasonLog;
                            QUEUE.enqueue(fn, context, args, meta);
                        });
                    }
                });
                queues.batch.stop();
            }
        },
        lastTask: function () {
            return queueState.lastTask;
        },
        stack: function (task) {
            var current = task || queueState.lastTask;
            var stack = [];
            while (current) {
                stack.unshift(current);
                current = current.meta.parentTask;
            }
            return stack;
        },
        logStack: function (task) {
            var stack = this.stack(task);
            stack.forEach(function (task, i) {
                var meta = task.meta;
                if (i === 0 && meta && meta.reasonLog) {
                    canDev.log.apply(canDev, meta.reasonLog);
                }
                var log = meta && meta.log ? meta.log : [
                    task.fn.name,
                    task
                ];
                canDev.log.apply(canDev, [task.meta.stack.name + ' ran task:'].concat(log));
            });
        },
        taskCount: function () {
            return NOTIFY_QUEUE.tasks.length + DERIVE_QUEUE.tasks.length + DOM_UI_QUEUE.tasks.length + MUTATE_QUEUE.tasks.length;
        },
        flush: function () {
            NOTIFY_QUEUE.flush();
        },
        log: function () {
            NOTIFY_QUEUE.log.apply(NOTIFY_QUEUE, arguments);
            DERIVE_QUEUE.log.apply(DERIVE_QUEUE, arguments);
            DOM_UI_QUEUE.log.apply(DOM_UI_QUEUE, arguments);
            MUTATE_QUEUE.log.apply(MUTATE_QUEUE, arguments);
        }
    };
    if (ns.queues) {
        throw new Error('You can\'t have two versions of can-queues, check your dependencies');
    } else {
        module.exports = ns.queues = queues;
    }
});
/*can-observation-recorder@1.3.0#can-observation-recorder*/
define('can-observation-recorder@1.3.0#can-observation-recorder', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var canSymbol = require('can-symbol');
    var stack = [];
    var addParentSymbol = canSymbol.for('can.addParent'), getValueSymbol = canSymbol.for('can.getValue');
    var ObservationRecorder = {
        stack: stack,
        start: function (name) {
            var deps = {
                keyDependencies: new Map(),
                valueDependencies: new Set(),
                childDependencies: new Set(),
                traps: null,
                ignore: 0,
                name: name
            };
            stack.push(deps);
            return deps;
        },
        stop: function () {
            return stack.pop();
        },
        add: function (obj, event) {
            var top = stack[stack.length - 1];
            if (top && top.ignore === 0) {
                if (top.traps) {
                    top.traps.push([
                        obj,
                        event
                    ]);
                } else {
                    if (event === undefined) {
                        top.valueDependencies.add(obj);
                    } else {
                        var eventSet = top.keyDependencies.get(obj);
                        if (!eventSet) {
                            eventSet = new Set();
                            top.keyDependencies.set(obj, eventSet);
                        }
                        eventSet.add(event);
                    }
                }
            }
        },
        addMany: function (observes) {
            var top = stack[stack.length - 1];
            if (top) {
                if (top.traps) {
                    top.traps.push.apply(top.traps, observes);
                } else {
                    for (var i = 0, len = observes.length; i < len; i++) {
                        this.add(observes[i][0], observes[i][1]);
                    }
                }
            }
        },
        created: function (obs) {
            var top = stack[stack.length - 1];
            if (top) {
                top.childDependencies.add(obs);
                if (obs[addParentSymbol]) {
                    obs[addParentSymbol](top);
                }
            }
        },
        ignore: function (fn) {
            return function () {
                if (stack.length) {
                    var top = stack[stack.length - 1];
                    top.ignore++;
                    var res = fn.apply(this, arguments);
                    top.ignore--;
                    return res;
                } else {
                    return fn.apply(this, arguments);
                }
            };
        },
        peekValue: function (value) {
            if (!value || !value[getValueSymbol]) {
                return value;
            }
            if (stack.length) {
                var top = stack[stack.length - 1];
                top.ignore++;
                var res = value[getValueSymbol]();
                top.ignore--;
                return res;
            } else {
                return value[getValueSymbol]();
            }
        },
        isRecording: function () {
            var len = stack.length;
            var last = len && stack[len - 1];
            return last && last.ignore === 0 && last;
        },
        makeDependenciesRecord: function (name) {
            return {
                traps: null,
                keyDependencies: new Map(),
                valueDependencies: new Set(),
                ignore: 0,
                name: name
            };
        },
        makeDependenciesRecorder: function () {
            return ObservationRecorder.makeDependenciesRecord();
        },
        trap: function () {
            if (stack.length) {
                var top = stack[stack.length - 1];
                var oldTraps = top.traps;
                var traps = top.traps = [];
                return function () {
                    top.traps = oldTraps;
                    return traps;
                };
            } else {
                return function () {
                    return [];
                };
            }
        },
        trapsCount: function () {
            if (stack.length) {
                var top = stack[stack.length - 1];
                return top.traps.length;
            } else {
                return 0;
            }
        }
    };
    if (namespace.ObservationRecorder) {
        throw new Error('You can\'t have two versions of can-observation-recorder, check your dependencies');
    } else {
        module.exports = namespace.ObservationRecorder = ObservationRecorder;
    }
});
/*can-key-tree@1.2.0#can-key-tree*/
define('can-key-tree@1.2.0#can-key-tree', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var reflect = require('can-reflect');
    function isBuiltInPrototype(obj) {
        if (obj === Object.prototype) {
            return true;
        }
        var protoString = Object.prototype.toString.call(obj);
        var isNotObjObj = protoString !== '[object Object]';
        var isObjSomething = protoString.indexOf('[object ') !== -1;
        return isNotObjObj && isObjSomething;
    }
    function getDeepSize(root, level) {
        if (level === 0) {
            return reflect.size(root);
        } else if (reflect.size(root) === 0) {
            return 0;
        } else {
            var count = 0;
            reflect.each(root, function (value) {
                count += getDeepSize(value, level - 1);
            });
            return count;
        }
    }
    function getDeep(node, items, depth, maxDepth) {
        if (!node) {
            return;
        }
        if (maxDepth === depth) {
            if (reflect.isMoreListLikeThanMapLike(node)) {
                reflect.addValues(items, reflect.toArray(node));
            } else {
                throw new Error('can-key-tree: Map-type leaf containers are not supported yet.');
            }
        } else {
            reflect.each(node, function (value) {
                getDeep(value, items, depth + 1, maxDepth);
            });
        }
    }
    function clearDeep(node, keys, maxDepth, deleteHandler) {
        if (maxDepth === keys.length) {
            if (reflect.isMoreListLikeThanMapLike(node)) {
                var valuesToRemove = reflect.toArray(node);
                if (deleteHandler) {
                    valuesToRemove.forEach(function (value) {
                        deleteHandler.apply(null, keys.concat(value));
                    });
                }
                reflect.removeValues(node, valuesToRemove);
            } else {
                throw new Error('can-key-tree: Map-type leaf containers are not supported yet.');
            }
        } else {
            reflect.each(node, function (value, key) {
                clearDeep(value, keys.concat(key), maxDepth, deleteHandler);
                reflect.deleteKeyValue(node, key);
            });
        }
    }
    var KeyTree = function (treeStructure, callbacks) {
        var FirstConstructor = treeStructure[0];
        if (reflect.isConstructorLike(FirstConstructor)) {
            this.root = new FirstConstructor();
        } else {
            this.root = FirstConstructor;
        }
        this.callbacks = callbacks || {};
        this.treeStructure = treeStructure;
        this.empty = true;
    };
    reflect.assign(KeyTree.prototype, {
        add: function (keys) {
            if (keys.length > this.treeStructure.length) {
                throw new Error('can-key-tree: Can not add path deeper than tree.');
            }
            var place = this.root;
            var rootWasEmpty = this.empty === true;
            for (var i = 0; i < keys.length - 1; i++) {
                var key = keys[i];
                var childNode = reflect.getKeyValue(place, key);
                if (!childNode) {
                    var Constructor = this.treeStructure[i + 1];
                    if (isBuiltInPrototype(Constructor.prototype)) {
                        childNode = new Constructor();
                    } else {
                        childNode = new Constructor(key);
                    }
                    reflect.setKeyValue(place, key, childNode);
                }
                place = childNode;
            }
            if (reflect.isMoreListLikeThanMapLike(place)) {
                reflect.addValues(place, [keys[keys.length - 1]]);
            } else {
                throw new Error('can-key-tree: Map types are not supported yet.');
            }
            if (rootWasEmpty) {
                this.empty = false;
                if (this.callbacks.onFirst) {
                    this.callbacks.onFirst.call(this);
                }
            }
            return this;
        },
        getNode: function (keys) {
            var node = this.root;
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                node = reflect.getKeyValue(node, key);
                if (!node) {
                    return;
                }
            }
            return node;
        },
        get: function (keys) {
            var node = this.getNode(keys);
            if (this.treeStructure.length === keys.length) {
                return node;
            } else {
                var Type = this.treeStructure[this.treeStructure.length - 1];
                var items = new Type();
                getDeep(node, items, keys.length, this.treeStructure.length - 1);
                return items;
            }
        },
        delete: function (keys, deleteHandler) {
            var parentNode = this.root, path = [this.root], lastKey = keys[keys.length - 1];
            for (var i = 0; i < keys.length - 1; i++) {
                var key = keys[i];
                var childNode = reflect.getKeyValue(parentNode, key);
                if (childNode === undefined) {
                    return false;
                } else {
                    path.push(childNode);
                }
                parentNode = childNode;
            }
            if (!keys.length) {
                clearDeep(parentNode, [], this.treeStructure.length - 1, deleteHandler);
            } else if (keys.length === this.treeStructure.length) {
                if (reflect.isMoreListLikeThanMapLike(parentNode)) {
                    if (deleteHandler) {
                        deleteHandler.apply(null, keys.concat(lastKey));
                    }
                    reflect.removeValues(parentNode, [lastKey]);
                } else {
                    throw new Error('can-key-tree: Map types are not supported yet.');
                }
            } else {
                var nodeToRemove = reflect.getKeyValue(parentNode, lastKey);
                if (nodeToRemove !== undefined) {
                    clearDeep(nodeToRemove, keys, this.treeStructure.length - 1, deleteHandler);
                    reflect.deleteKeyValue(parentNode, lastKey);
                } else {
                    return false;
                }
            }
            for (i = path.length - 2; i >= 0; i--) {
                if (reflect.size(parentNode) === 0) {
                    parentNode = path[i];
                    reflect.deleteKeyValue(parentNode, keys[i]);
                } else {
                    break;
                }
            }
            if (reflect.size(this.root) === 0) {
                this.empty = true;
                if (this.callbacks.onEmpty) {
                    this.callbacks.onEmpty.call(this);
                }
            }
            return true;
        },
        size: function () {
            return getDeepSize(this.root, this.treeStructure.length - 1);
        },
        isEmpty: function () {
            return this.empty;
        }
    });
    module.exports = KeyTree;
});
/*can-define-lazy-value@1.1.0#define-lazy-value*/
define('can-define-lazy-value@1.1.0#define-lazy-value', function (require, exports, module) {
    'use strict';
    module.exports = function defineLazyValue(obj, prop, initializer, writable) {
        Object.defineProperty(obj, prop, {
            configurable: true,
            get: function () {
                Object.defineProperty(this, prop, {
                    value: undefined,
                    writable: true
                });
                var value = initializer.call(this, obj, prop);
                Object.defineProperty(this, prop, {
                    value: value,
                    writable: !!writable
                });
                return value;
            },
            set: function (value) {
                Object.defineProperty(this, prop, {
                    value: value,
                    writable: !!writable
                });
                return value;
            }
        });
    };
});
/*can-event-queue@1.1.4#dependency-record/merge*/
define('can-event-queue@1.1.4#dependency-record/merge', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var mergeValueDependencies = function mergeValueDependencies(obj, source) {
        var sourceValueDeps = source.valueDependencies;
        if (sourceValueDeps) {
            var destValueDeps = obj.valueDependencies;
            if (!destValueDeps) {
                destValueDeps = new Set();
                obj.valueDependencies = destValueDeps;
            }
            canReflect.eachIndex(sourceValueDeps, function (dep) {
                destValueDeps.add(dep);
            });
        }
    };
    var mergeKeyDependencies = function mergeKeyDependencies(obj, source) {
        var sourcekeyDeps = source.keyDependencies;
        if (sourcekeyDeps) {
            var destKeyDeps = obj.keyDependencies;
            if (!destKeyDeps) {
                destKeyDeps = new Map();
                obj.keyDependencies = destKeyDeps;
            }
            canReflect.eachKey(sourcekeyDeps, function (keys, obj) {
                var entry = destKeyDeps.get(obj);
                if (!entry) {
                    entry = new Set();
                    destKeyDeps.set(obj, entry);
                }
                canReflect.eachIndex(keys, function (key) {
                    entry.add(key);
                });
            });
        }
    };
    module.exports = function mergeDependencyRecords(object, source) {
        mergeKeyDependencies(object, source);
        mergeValueDependencies(object, source);
        return object;
    };
});
/*can-event-queue@1.1.4#value/value*/
define('can-event-queue@1.1.4#value/value', [
    'require',
    'exports',
    'module',
    'can-queues',
    'can-key-tree',
    'can-reflect',
    'can-define-lazy-value',
    '../dependency-record/merge'
], function (require, exports, module) {
    'use strict';
    var queues = require('can-queues');
    var KeyTree = require('can-key-tree');
    var canReflect = require('can-reflect');
    var defineLazyValue = require('can-define-lazy-value');
    var mergeDependencyRecords = require('../dependency-record/merge');
    var properties = {
        on: function (handler, queue) {
            this.handlers.add([
                queue || 'mutate',
                handler
            ]);
        },
        off: function (handler, queueName) {
            if (handler === undefined) {
                if (queueName === undefined) {
                    this.handlers.delete([]);
                } else {
                    this.handlers.delete([queueName]);
                }
            } else {
                this.handlers.delete([
                    queueName || 'mutate',
                    handler
                ]);
            }
        }
    };
    var symbols = {
        'can.onValue': properties.on,
        'can.offValue': properties.off,
        'can.dispatch': function (value, old) {
            var queuesArgs = [];
            queuesArgs = [
                this.handlers.getNode([]),
                this,
                [
                    value,
                    old
                ]
            ];
            queues.enqueueByQueue.apply(queues, queuesArgs);
        },
        'can.getWhatIChange': function getWhatIChange() {
        },
        'can.isBound': function isBound() {
            return !this.handlers.isEmpty();
        }
    };
    function defineLazyHandlers() {
        return new KeyTree([
            Object,
            Array
        ], {
            onFirst: this.onBound !== undefined && this.onBound.bind(this),
            onEmpty: this.onUnbound !== undefined && this.onUnbound.bind(this)
        });
    }
    var mixinValueEventBindings = function (obj) {
        canReflect.assign(obj, properties);
        canReflect.assignSymbols(obj, symbols);
        defineLazyValue(obj, 'handlers', defineLazyHandlers, true);
        return obj;
    };
    mixinValueEventBindings.addHandlers = function (obj, callbacks) {
        console.warn('can-event-queue/value: Avoid using addHandlers. Add onBound and onUnbound methods instead.');
        obj.handlers = new KeyTree([
            Object,
            Array
        ], callbacks);
        return obj;
    };
    module.exports = mixinValueEventBindings;
});
/*can-observation@4.1.2#recorder-dependency-helpers*/
define('can-observation@4.1.2#recorder-dependency-helpers', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    function addNewKeyDependenciesIfNotInOld(event) {
        if (this.oldEventSet === undefined || this.oldEventSet['delete'](event) === false) {
            canReflect.onKeyValue(this.observable, event, this.onDependencyChange, 'notify');
        }
    }
    function addObservablesNewKeyDependenciesIfNotInOld(eventSet, observable) {
        eventSet.forEach(addNewKeyDependenciesIfNotInOld, {
            onDependencyChange: this.onDependencyChange,
            observable: observable,
            oldEventSet: this.oldDependencies.keyDependencies.get(observable)
        });
    }
    function removeKeyDependencies(event) {
        canReflect.offKeyValue(this.observable, event, this.onDependencyChange, 'notify');
    }
    function removeObservablesKeyDependencies(oldEventSet, observable) {
        oldEventSet.forEach(removeKeyDependencies, {
            onDependencyChange: this.onDependencyChange,
            observable: observable
        });
    }
    function addValueDependencies(observable) {
        if (this.oldDependencies.valueDependencies.delete(observable) === false) {
            canReflect.onValue(observable, this.onDependencyChange, 'notify');
        }
    }
    function removeValueDependencies(observable) {
        canReflect.offValue(observable, this.onDependencyChange, 'notify');
    }
    module.exports = {
        updateObservations: function (observationData) {
            observationData.newDependencies.keyDependencies.forEach(addObservablesNewKeyDependenciesIfNotInOld, observationData);
            observationData.oldDependencies.keyDependencies.forEach(removeObservablesKeyDependencies, observationData);
            observationData.newDependencies.valueDependencies.forEach(addValueDependencies, observationData);
            observationData.oldDependencies.valueDependencies.forEach(removeValueDependencies, observationData);
        },
        stopObserving: function (observationReciever, onDependencyChange) {
            observationReciever.keyDependencies.forEach(removeObservablesKeyDependencies, { onDependencyChange: onDependencyChange });
            observationReciever.valueDependencies.forEach(removeValueDependencies, { onDependencyChange: onDependencyChange });
        }
    };
});
/*can-observation@4.1.2#temporarily-bind*/
define('can-observation@4.1.2#temporarily-bind', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var temporarilyBoundNoOperation = function () {
    };
    var observables;
    var unbindTemporarilyBoundValue = function () {
        for (var i = 0, len = observables.length; i < len; i++) {
            canReflect.offValue(observables[i], temporarilyBoundNoOperation);
        }
        observables = null;
    };
    function temporarilyBind(compute) {
        var computeInstance = compute.computeInstance || compute;
        canReflect.onValue(computeInstance, temporarilyBoundNoOperation);
        if (!observables) {
            observables = [];
            setTimeout(unbindTemporarilyBoundValue, 10);
        }
        observables.push(computeInstance);
    }
    module.exports = temporarilyBind;
});
/*can-observation@4.1.2#can-observation*/
define('can-observation@4.1.2#can-observation', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-reflect',
    'can-queues',
    'can-observation-recorder',
    'can-symbol',
    'can-log/dev/dev',
    'can-event-queue/value/value',
    './recorder-dependency-helpers',
    './temporarily-bind'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var canReflect = require('can-reflect');
        var queues = require('can-queues');
        var ObservationRecorder = require('can-observation-recorder');
        var canSymbol = require('can-symbol');
        var dev = require('can-log/dev/dev');
        var valueEventBindings = require('can-event-queue/value/value');
        var recorderHelpers = require('./recorder-dependency-helpers');
        var temporarilyBind = require('./temporarily-bind');
        var dispatchSymbol = canSymbol.for('can.dispatch');
        var getChangesSymbol = canSymbol.for('can.getChangesDependencyRecord');
        var getValueDependenciesSymbol = canSymbol.for('can.getValueDependencies');
        function Observation(func, context, options) {
            this.func = func;
            this.context = context;
            this.options = options || {
                priority: 0,
                isObservable: true
            };
            this.bound = false;
            this._value = undefined;
            this.newDependencies = ObservationRecorder.makeDependenciesRecord();
            this.oldDependencies = null;
            var self = this;
            this.onDependencyChange = function (newVal) {
                self.dependencyChange(this, newVal);
            };
            this.update = this.update.bind(this);
        }
        valueEventBindings(Observation.prototype);
        canReflect.assign(Observation.prototype, {
            onBound: function () {
                this.bound = true;
                this.oldDependencies = this.newDependencies;
                ObservationRecorder.start(this._name);
                this._value = this.func.call(this.context);
                this.newDependencies = ObservationRecorder.stop();
                recorderHelpers.updateObservations(this);
            },
            dependencyChange: function (context, args) {
                if (this.bound === true) {
                    var queuesArgs = [];
                    queuesArgs = [
                        this.update,
                        this,
                        [],
                        { priority: this.options.priority }
                    ];
                    queues.deriveQueue.enqueue.apply(queues.deriveQueue, queuesArgs);
                }
            },
            update: function () {
                if (this.bound === true) {
                    var oldValue = this._value;
                    this.oldValue = null;
                    this.onBound();
                    if (oldValue !== this._value) {
                        this[dispatchSymbol](this._value, oldValue);
                    }
                }
            },
            onUnbound: function () {
                this.bound = false;
                recorderHelpers.stopObserving(this.newDependencies, this.onDependencyChange);
                this.newDependencies = ObservationRecorder.makeDependenciesRecord();
            },
            get: function () {
                if (this.options.isObservable && ObservationRecorder.isRecording()) {
                    ObservationRecorder.add(this);
                    if (this.bound === false) {
                        Observation.temporarilyBind(this);
                    }
                }
                if (this.bound === true) {
                    if (queues.deriveQueue.tasksRemainingCount() > 0) {
                        Observation.updateChildrenAndSelf(this);
                    }
                    return this._value;
                } else {
                    return this.func.call(this.context);
                }
            },
            hasDependencies: function () {
                var newDependencies = this.newDependencies;
                return this.bound ? newDependencies.valueDependencies.size + newDependencies.keyDependencies.size > 0 : undefined;
            },
            log: function () {
            }
        });
        Object.defineProperty(Observation.prototype, 'value', {
            get: function () {
                return this.get();
            }
        });
        var observationProto = {
            'can.getValue': Observation.prototype.get,
            'can.isValueLike': true,
            'can.isMapLike': false,
            'can.isListLike': false,
            'can.valueHasDependencies': Observation.prototype.hasDependencies,
            'can.getValueDependencies': function () {
                if (this.bound === true) {
                    var deps = this.newDependencies, result = {};
                    if (deps.keyDependencies.size) {
                        result.keyDependencies = deps.keyDependencies;
                    }
                    if (deps.valueDependencies.size) {
                        result.valueDependencies = deps.valueDependencies;
                    }
                    return result;
                }
                return undefined;
            },
            'can.getPriority': function () {
                return this.options.priority;
            },
            'can.setPriority': function (priority) {
                this.options.priority = priority;
            }
        };
        canReflect.assignSymbols(Observation.prototype, observationProto);
        Observation.updateChildrenAndSelf = function (observation) {
            if (observation.update !== undefined && queues.deriveQueue.isEnqueued(observation.update) === true) {
                queues.deriveQueue.flushQueuedTask(observation.update);
                return true;
            }
            if (observation[getValueDependenciesSymbol]) {
                var childHasChanged = false;
                var valueDependencies = observation[getValueDependenciesSymbol]().valueDependencies || [];
                valueDependencies.forEach(function (observable) {
                    if (Observation.updateChildrenAndSelf(observable) === true) {
                        childHasChanged = true;
                    }
                });
                return childHasChanged;
            } else {
                return false;
            }
        };
        var alias = { addAll: 'addMany' };
        [
            'add',
            'addAll',
            'ignore',
            'trap',
            'trapsCount',
            'isRecording'
        ].forEach(function (methodName) {
            Observation[methodName] = function () {
                var name = alias[methodName] ? alias[methodName] : methodName;
                console.warn('can-observation: Call ' + name + '() on can-observation-recorder.');
                return ObservationRecorder[name].apply(this, arguments);
            };
        });
        Observation.prototype.start = function () {
            console.warn('can-observation: Use .on and .off to bind.');
            return this.onBound();
        };
        Observation.prototype.stop = function () {
            console.warn('can-observation: Use .on and .off to bind.');
            return this.onUnbound();
        };
        Observation.temporarilyBind = temporarilyBind;
        module.exports = namespace.Observation = Observation;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-simple-observable@2.4.1#log*/
define('can-simple-observable@2.4.1#log', [
    'require',
    'exports',
    'module',
    'can-log/dev/dev',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var dev = require('can-log/dev/dev');
    var canReflect = require('can-reflect');
    function quoteString(x) {
        return typeof x === 'string' ? JSON.stringify(x) : x;
    }
    module.exports = function log() {
    };
});
/*can-simple-observable@2.4.1#can-simple-observable*/
define('can-simple-observable@2.4.1#can-simple-observable', [
    'require',
    'exports',
    'module',
    './log',
    'can-namespace',
    'can-symbol',
    'can-reflect',
    'can-observation-recorder',
    'can-event-queue/value/value'
], function (require, exports, module) {
    'use strict';
    var log = require('./log');
    var ns = require('can-namespace');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var valueEventBindings = require('can-event-queue/value/value');
    var dispatchSymbol = canSymbol.for('can.dispatch');
    function SimpleObservable(initialValue) {
        this._value = initialValue;
    }
    valueEventBindings(SimpleObservable.prototype);
    canReflect.assignMap(SimpleObservable.prototype, {
        log: log,
        get: function () {
            ObservationRecorder.add(this);
            return this._value;
        },
        set: function (value) {
            var old = this._value;
            this._value = value;
            this[dispatchSymbol](value, old);
        }
    });
    Object.defineProperty(SimpleObservable.prototype, 'value', {
        set: function (value) {
            return this.set(value);
        },
        get: function () {
            return this.get();
        }
    });
    var simpleObservableProto = {
        'can.getValue': SimpleObservable.prototype.get,
        'can.setValue': SimpleObservable.prototype.set,
        'can.isMapLike': false,
        'can.valueHasDependencies': function () {
            return true;
        }
    };
    canReflect.assignSymbols(SimpleObservable.prototype, simpleObservableProto);
    module.exports = ns.SimpleObservable = SimpleObservable;
});
/*can-simple-observable@2.4.1#settable/settable*/
define('can-simple-observable@2.4.1#settable/settable', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observation-recorder',
    '../can-simple-observable',
    'can-observation',
    'can-queues',
    '../log',
    'can-event-queue/value/value'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var SimpleObservable = require('../can-simple-observable');
    var Observation = require('can-observation');
    var queues = require('can-queues');
    var log = require('../log');
    var valueEventBindings = require('can-event-queue/value/value');
    var peek = ObservationRecorder.ignore(canReflect.getValue.bind(canReflect));
    function SettableObservable(fn, context, initialValue) {
        this.lastSetValue = new SimpleObservable(initialValue);
        function observe() {
            return fn.call(context, this.lastSetValue.get());
        }
        this.handler = this.handler.bind(this);
        this.observation = new Observation(observe, this);
    }
    valueEventBindings(SettableObservable.prototype);
    canReflect.assignMap(SettableObservable.prototype, {
        log: log,
        constructor: SettableObservable,
        handler: function (newVal) {
            var old = this._value, reasonLog;
            this._value = newVal;
            queues.enqueueByQueue(this.handlers.getNode([]), this, [
                newVal,
                old
            ], null, reasonLog);
        },
        onBound: function () {
            if (!this.bound) {
                this.bound = true;
                this.activate();
            }
        },
        activate: function () {
            canReflect.onValue(this.observation, this.handler, 'notify');
            this._value = peek(this.observation);
        },
        onUnbound: function () {
            this.bound = false;
            canReflect.offValue(this.observation, this.handler, 'notify');
        },
        set: function (newVal) {
            var oldVal = this.lastSetValue.get();
            if (canReflect.isObservableLike(oldVal) && canReflect.isValueLike(oldVal) && !canReflect.isObservableLike(newVal)) {
                canReflect.setValue(oldVal, newVal);
            } else {
                if (newVal !== oldVal) {
                    this.lastSetValue.set(newVal);
                }
            }
        },
        get: function () {
            if (ObservationRecorder.isRecording()) {
                ObservationRecorder.add(this);
                if (!this.bound) {
                    this.onBound();
                }
            }
            if (this.bound === true) {
                return this._value;
            } else {
                return this.observation.get();
            }
        },
        hasDependencies: function () {
            return canReflect.valueHasDependencies(this.observation);
        },
        getValueDependencies: function () {
            return canReflect.getValueDependencies(this.observation);
        }
    });
    Object.defineProperty(SettableObservable.prototype, 'value', {
        set: function (value) {
            return this.set(value);
        },
        get: function () {
            return this.get();
        }
    });
    canReflect.assignSymbols(SettableObservable.prototype, {
        'can.getValue': SettableObservable.prototype.get,
        'can.setValue': SettableObservable.prototype.set,
        'can.isMapLike': false,
        'can.getPriority': function () {
            return canReflect.getPriority(this.observation);
        },
        'can.setPriority': function (newPriority) {
            canReflect.setPriority(this.observation, newPriority);
        },
        'can.valueHasDependencies': SettableObservable.prototype.hasDependencies,
        'can.getValueDependencies': SettableObservable.prototype.getValueDependencies
    });
    module.exports = SettableObservable;
});
/*can-simple-observable@2.4.1#async/async*/
define('can-simple-observable@2.4.1#async/async', [
    'require',
    'exports',
    'module',
    '../can-simple-observable',
    'can-observation',
    'can-queues',
    '../settable/settable',
    'can-reflect',
    'can-observation-recorder',
    'can-event-queue/value/value'
], function (require, exports, module) {
    'use strict';
    var SimpleObservable = require('../can-simple-observable');
    var Observation = require('can-observation');
    var queues = require('can-queues');
    var SettableObservable = require('../settable/settable');
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var valueEventBindings = require('can-event-queue/value/value');
    function AsyncObservable(fn, context, initialValue) {
        this.resolve = this.resolve.bind(this);
        this.lastSetValue = new SimpleObservable(initialValue);
        this.handler = this.handler.bind(this);
        function observe() {
            this.resolveCalled = false;
            this.inGetter = true;
            var newVal = fn.call(context, this.lastSetValue.get(), this.bound === true ? this.resolve : undefined);
            this.inGetter = false;
            if (newVal !== undefined) {
                this.resolve(newVal);
            } else if (this.resolveCalled) {
                this.resolve(this._value);
            }
            if (this.bound !== true) {
                return newVal;
            }
        }
        this.observation = new Observation(observe, this);
    }
    AsyncObservable.prototype = Object.create(SettableObservable.prototype);
    AsyncObservable.prototype.constructor = AsyncObservable;
    AsyncObservable.prototype.handler = function (newVal) {
        if (newVal !== undefined) {
            SettableObservable.prototype.handler.apply(this, arguments);
        }
    };
    var peek = ObservationRecorder.ignore(canReflect.getValue.bind(canReflect));
    AsyncObservable.prototype.activate = function () {
        canReflect.onValue(this.observation, this.handler, 'notify');
        if (!this.resolveCalled) {
            this._value = peek(this.observation);
        }
    };
    AsyncObservable.prototype.resolve = function resolve(newVal) {
        this.resolveCalled = true;
        var old = this._value;
        this._value = newVal;
        if (!this.inGetter) {
            var queuesArgs = [
                this.handlers.getNode([]),
                this,
                [
                    newVal,
                    old
                ],
                null
            ];
            queues.enqueueByQueue.apply(queues, queuesArgs);
        }
    };
    module.exports = AsyncObservable;
});
/*can-globals@1.2.1#can-globals-proto*/
define('can-globals@1.2.1#can-globals-proto', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var canReflect = require('can-reflect');
        function dispatch(key) {
            var handlers = this.eventHandlers[key];
            if (handlers) {
                var handlersCopy = handlers.slice();
                var value = this.getKeyValue(key);
                for (var i = 0; i < handlersCopy.length; i++) {
                    handlersCopy[i](value);
                }
            }
        }
        function Globals() {
            this.eventHandlers = {};
            this.properties = {};
        }
        Globals.prototype.define = function (key, value, enableCache) {
            if (enableCache === undefined) {
                enableCache = true;
            }
            if (!this.properties[key]) {
                this.properties[key] = {
                    default: value,
                    value: value,
                    enableCache: enableCache
                };
            }
            return this;
        };
        Globals.prototype.getKeyValue = function (key) {
            var property = this.properties[key];
            if (property) {
                if (typeof property.value === 'function') {
                    if (property.cachedValue) {
                        return property.cachedValue;
                    }
                    if (property.enableCache) {
                        property.cachedValue = property.value();
                        return property.cachedValue;
                    } else {
                        return property.value();
                    }
                }
                return property.value;
            }
        };
        Globals.prototype.makeExport = function (key) {
            return function (value) {
                if (arguments.length === 0) {
                    return this.getKeyValue(key);
                }
                if (typeof value === 'undefined' || value === null) {
                    this.deleteKeyValue(key);
                } else {
                    if (typeof value === 'function') {
                        this.setKeyValue(key, function () {
                            return value;
                        });
                    } else {
                        this.setKeyValue(key, value);
                    }
                    return value;
                }
            }.bind(this);
        };
        Globals.prototype.offKeyValue = function (key, handler) {
            if (this.properties[key]) {
                var handlers = this.eventHandlers[key];
                if (handlers) {
                    var i = handlers.indexOf(handler);
                    handlers.splice(i, 1);
                }
            }
            return this;
        };
        Globals.prototype.onKeyValue = function (key, handler) {
            if (this.properties[key]) {
                if (!this.eventHandlers[key]) {
                    this.eventHandlers[key] = [];
                }
                this.eventHandlers[key].push(handler);
            }
            return this;
        };
        Globals.prototype.deleteKeyValue = function (key) {
            var property = this.properties[key];
            if (property !== undefined) {
                property.value = property.default;
                property.cachedValue = undefined;
                dispatch.call(this, key);
            }
            return this;
        };
        Globals.prototype.setKeyValue = function (key, value) {
            if (!this.properties[key]) {
                return this.define(key, value);
            }
            var property = this.properties[key];
            property.value = value;
            property.cachedValue = undefined;
            dispatch.call(this, key);
            return this;
        };
        Globals.prototype.reset = function () {
            for (var key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    this.properties[key].value = this.properties[key].default;
                    this.properties[key].cachedValue = undefined;
                    dispatch.call(this, key);
                }
            }
            return this;
        };
        canReflect.assignSymbols(Globals.prototype, {
            'can.getKeyValue': Globals.prototype.getKeyValue,
            'can.setKeyValue': Globals.prototype.setKeyValue,
            'can.deleteKeyValue': Globals.prototype.deleteKeyValue,
            'can.onKeyValue': Globals.prototype.onKeyValue,
            'can.offKeyValue': Globals.prototype.offKeyValue
        });
        module.exports = Globals;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#can-globals-instance*/
define('can-globals@1.2.1#can-globals-instance', [
    'require',
    'exports',
    'module',
    'can-namespace',
    './can-globals-proto'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var Globals = require('./can-globals-proto');
        var globals = new Globals();
        if (namespace.globals) {
            throw new Error('You can\'t have two versions of can-globals, check your dependencies');
        } else {
            module.exports = namespace.globals = globals;
        }
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#global/global*/
define('can-globals@1.2.1#global/global', [
    'require',
    'exports',
    'module',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals/can-globals-instance');
        globals.define('global', function () {
            return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : typeof process === 'object' && {}.toString.call(process) === '[object process]' ? global : window;
        });
        module.exports = globals.makeExport('global');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#document/document*/
define('can-globals@1.2.1#document/document', [
    'require',
    'exports',
    'module',
    'can-globals/global/global',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        require('can-globals/global/global');
        var globals = require('can-globals/can-globals-instance');
        globals.define('document', function () {
            return globals.getKeyValue('global').document;
        });
        module.exports = globals.makeExport('document');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#is-node/is-node*/
define('can-globals@1.2.1#is-node/is-node', [
    'require',
    'exports',
    'module',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals/can-globals-instance');
        globals.define('isNode', function () {
            return typeof process === 'object' && {}.toString.call(process) === '[object process]';
        });
        module.exports = globals.makeExport('isNode');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#is-browser-window/is-browser-window*/
define('can-globals@1.2.1#is-browser-window/is-browser-window', [
    'require',
    'exports',
    'module',
    'can-globals/can-globals-instance',
    '../is-node/is-node'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals/can-globals-instance');
        require('../is-node/is-node');
        globals.define('isBrowserWindow', function () {
            var isNode = globals.getKeyValue('isNode');
            return typeof window !== 'undefined' && typeof document !== 'undefined' && isNode === false;
        });
        module.exports = globals.makeExport('isBrowserWindow');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-dom-events@1.3.3#helpers/util*/
define('can-dom-events@1.3.3#helpers/util', [
    'require',
    'exports',
    'module',
    'can-globals/document/document',
    'can-globals/is-browser-window/is-browser-window'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getCurrentDocument = require('can-globals/document/document');
        var isBrowserWindow = require('can-globals/is-browser-window/is-browser-window');
        function getTargetDocument(target) {
            return target.ownerDocument || getCurrentDocument();
        }
        function createEvent(target, eventData, bubbles, cancelable) {
            var doc = getTargetDocument(target);
            var event = doc.createEvent('HTMLEvents');
            var eventType;
            if (typeof eventData === 'string') {
                eventType = eventData;
            } else {
                eventType = eventData.type;
                for (var prop in eventData) {
                    if (event[prop] === undefined) {
                        event[prop] = eventData[prop];
                    }
                }
            }
            if (bubbles === undefined) {
                bubbles = true;
            }
            event.initEvent(eventType, bubbles, cancelable);
            return event;
        }
        function isDomEventTarget(obj) {
            if (!(obj && obj.nodeName)) {
                return obj === window;
            }
            var nodeType = obj.nodeType;
            return nodeType === 1 || nodeType === 9 || nodeType === 11;
        }
        function addDomContext(context, args) {
            if (isDomEventTarget(context)) {
                args = Array.prototype.slice.call(args, 0);
                args.unshift(context);
            }
            return args;
        }
        function removeDomContext(context, args) {
            if (!isDomEventTarget(context)) {
                args = Array.prototype.slice.call(args, 0);
                context = args.shift();
            }
            return {
                context: context,
                args: args
            };
        }
        var fixSyntheticEventsOnDisabled = false;
        (function () {
            if (!isBrowserWindow()) {
                return;
            }
            var testEventName = 'fix_synthetic_events_on_disabled_test';
            var input = document.createElement('input');
            input.disabled = true;
            var timer = setTimeout(function () {
                fixSyntheticEventsOnDisabled = true;
            }, 50);
            var onTest = function onTest() {
                clearTimeout(timer);
                input.removeEventListener(testEventName, onTest);
            };
            input.addEventListener(testEventName, onTest);
            try {
                var event = document.create('HTMLEvents');
                event.initEvent(testEventName, false);
                input.dispatchEvent(event);
            } catch (e) {
                onTest();
                fixSyntheticEventsOnDisabled = true;
            }
        }());
        function isDispatchingOnDisabled(element, event) {
            var eventType = event.type;
            var isInsertedOrRemoved = eventType === 'inserted' || eventType === 'removed';
            var isDisabled = !!element.disabled;
            return isInsertedOrRemoved && isDisabled;
        }
        function forceEnabledForDispatch(element, event) {
            return fixSyntheticEventsOnDisabled && isDispatchingOnDisabled(element, event);
        }
        module.exports = {
            createEvent: createEvent,
            addDomContext: addDomContext,
            removeDomContext: removeDomContext,
            isDomEventTarget: isDomEventTarget,
            getTargetDocument: getTargetDocument,
            forceEnabledForDispatch: forceEnabledForDispatch
        };
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-dom-events@1.3.3#helpers/make-event-registry*/
define('can-dom-events@1.3.3#helpers/make-event-registry', function (require, exports, module) {
    'use strict';
    function EventRegistry() {
        this._registry = {};
    }
    module.exports = function makeEventRegistry() {
        return new EventRegistry();
    };
    EventRegistry.prototype.has = function (eventType) {
        return !!this._registry[eventType];
    };
    EventRegistry.prototype.get = function (eventType) {
        return this._registry[eventType];
    };
    EventRegistry.prototype.add = function (event, eventType) {
        if (!event) {
            throw new Error('An EventDefinition must be provided');
        }
        if (typeof event.addEventListener !== 'function') {
            throw new TypeError('EventDefinition addEventListener must be a function');
        }
        if (typeof event.removeEventListener !== 'function') {
            throw new TypeError('EventDefinition removeEventListener must be a function');
        }
        eventType = eventType || event.defaultEventType;
        if (typeof eventType !== 'string') {
            throw new TypeError('Event type must be a string, not ' + eventType);
        }
        if (this.has(eventType)) {
            throw new Error('Event "' + eventType + '" is already registered');
        }
        this._registry[eventType] = event;
        var self = this;
        return function remove() {
            self._registry[eventType] = undefined;
        };
    };
});
/*can-dom-events@1.3.3#helpers/-make-delegate-event-tree*/
define('can-dom-events@1.3.3#helpers/-make-delegate-event-tree', [
    'require',
    'exports',
    'module',
    'can-key-tree',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var KeyTree = require('can-key-tree');
    var canReflect = require('can-reflect');
    var useCapture = function (eventType) {
        return eventType === 'focus' || eventType === 'blur';
    };
    function makeDelegator(domEvents) {
        var Delegator = function Delegator(parentKey) {
            this.element = parentKey;
            this.events = {};
            this.delegated = {};
        };
        canReflect.assignSymbols(Delegator.prototype, {
            'can.setKeyValue': function (eventType, handlersBySelector) {
                var handler = this.delegated[eventType] = function (ev) {
                    canReflect.each(handlersBySelector, function (handlers, selector) {
                        var cur = ev.target;
                        do {
                            var el = cur === document ? document.documentElement : cur;
                            var matches = el.matches || el.msMatchesSelector;
                            if (matches && matches.call(el, selector)) {
                                handlers.forEach(function (handler) {
                                    handler.call(el, ev);
                                });
                            }
                            cur = cur.parentNode;
                        } while (cur && cur !== ev.currentTarget);
                    });
                };
                this.events[eventType] = handlersBySelector;
                domEvents.addEventListener(this.element, eventType, handler, useCapture(eventType));
            },
            'can.getKeyValue': function (eventType) {
                return this.events[eventType];
            },
            'can.deleteKeyValue': function (eventType) {
                domEvents.removeEventListener(this.element, eventType, this.delegated[eventType], useCapture(eventType));
                delete this.delegated[eventType];
                delete this.events[eventType];
            },
            'can.getOwnEnumerableKeys': function () {
                return Object.keys(this.events);
            }
        });
        return Delegator;
    }
    module.exports = function makeDelegateEventTree(domEvents) {
        var Delegator = makeDelegator(domEvents);
        return new KeyTree([
            Map,
            Delegator,
            Object,
            Array
        ]);
    };
});
/*can-dom-events@1.3.3#can-dom-events*/
define('can-dom-events@1.3.3#can-dom-events', [
    'require',
    'exports',
    'module',
    'can-namespace',
    './helpers/util',
    './helpers/make-event-registry',
    './helpers/-make-delegate-event-tree'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var util = require('./helpers/util');
        var makeEventRegistry = require('./helpers/make-event-registry');
        var makeDelegateEventTree = require('./helpers/-make-delegate-event-tree');
        var domEvents = {
            _eventRegistry: makeEventRegistry(),
            addEvent: function (event, eventType) {
                return this._eventRegistry.add(event, eventType);
            },
            addEventListener: function (target, eventType) {
                var hasCustomEvent = domEvents._eventRegistry.has(eventType);
                if (hasCustomEvent) {
                    var event = domEvents._eventRegistry.get(eventType);
                    return event.addEventListener.apply(domEvents, arguments);
                }
                var eventArgs = Array.prototype.slice.call(arguments, 1);
                return target.addEventListener.apply(target, eventArgs);
            },
            removeEventListener: function (target, eventType) {
                var hasCustomEvent = domEvents._eventRegistry.has(eventType);
                if (hasCustomEvent) {
                    var event = domEvents._eventRegistry.get(eventType);
                    return event.removeEventListener.apply(domEvents, arguments);
                }
                var eventArgs = Array.prototype.slice.call(arguments, 1);
                return target.removeEventListener.apply(target, eventArgs);
            },
            addDelegateListener: function (root, eventType, selector, handler) {
                domEvents._eventTree.add([
                    root,
                    eventType,
                    selector,
                    handler
                ]);
            },
            removeDelegateListener: function (target, eventType, selector, handler) {
                domEvents._eventTree.delete([
                    target,
                    eventType,
                    selector,
                    handler
                ]);
            },
            dispatch: function (target, eventData, bubbles, cancelable) {
                var event = util.createEvent(target, eventData, bubbles, cancelable);
                var enableForDispatch = util.forceEnabledForDispatch(target, event);
                if (enableForDispatch) {
                    target.disabled = false;
                }
                var ret = target.dispatchEvent(event);
                if (enableForDispatch) {
                    target.disabled = true;
                }
                return ret;
            }
        };
        domEvents._eventTree = makeDelegateEventTree(domEvents);
        module.exports = namespace.domEvents = domEvents;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-event-queue@1.1.4#map/map*/
define('can-event-queue@1.1.4#map/map', [
    'require',
    'exports',
    'module',
    'can-log/dev/dev',
    'can-queues',
    'can-reflect',
    'can-symbol',
    'can-key-tree',
    'can-dom-events',
    'can-dom-events/helpers/util',
    '../dependency-record/merge'
], function (require, exports, module) {
    'use strict';
    var canDev = require('can-log/dev/dev');
    var queues = require('can-queues');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var KeyTree = require('can-key-tree');
    var domEvents = require('can-dom-events');
    var isDomEventTarget = require('can-dom-events/helpers/util').isDomEventTarget;
    var mergeDependencyRecords = require('../dependency-record/merge');
    var metaSymbol = canSymbol.for('can.meta'), dispatchBoundChangeSymbol = canSymbol.for('can.dispatchInstanceBoundChange'), dispatchInstanceOnPatchesSymbol = canSymbol.for('can.dispatchInstanceOnPatches'), onKeyValueSymbol = canSymbol.for('can.onKeyValue'), offKeyValueSymbol = canSymbol.for('can.offKeyValue'), onEventSymbol = canSymbol.for('can.onEvent'), offEventSymbol = canSymbol.for('can.offEvent'), onValueSymbol = canSymbol.for('can.onValue'), offValueSymbol = canSymbol.for('can.offValue');
    var legacyMapBindings;
    function addHandlers(obj, meta) {
        if (!meta.handlers) {
            meta.handlers = new KeyTree([
                Object,
                Object,
                Object,
                Array
            ], {
                onFirst: function () {
                    if (obj._eventSetup !== undefined) {
                        obj._eventSetup();
                    }
                    var constructor = obj.constructor;
                    if (constructor[dispatchBoundChangeSymbol] !== undefined && obj instanceof constructor) {
                        constructor[dispatchBoundChangeSymbol](obj, true);
                    }
                },
                onEmpty: function () {
                    if (obj._eventTeardown !== undefined) {
                        obj._eventTeardown();
                    }
                    var constructor = obj.constructor;
                    if (constructor[dispatchBoundChangeSymbol] !== undefined && obj instanceof constructor) {
                        constructor[dispatchBoundChangeSymbol](obj, false);
                    }
                }
            });
        }
        if (!meta.listenHandlers) {
            meta.listenHandlers = new KeyTree([
                Map,
                Map,
                Object,
                Array
            ]);
        }
    }
    var ensureMeta = function ensureMeta(obj) {
        var meta = obj[metaSymbol];
        if (!meta) {
            meta = {};
            canReflect.setKeyValue(obj, metaSymbol, meta);
        }
        addHandlers(obj, meta);
        return meta;
    };
    function stopListeningArgumentsToKeys(bindTarget, event, handler, queueName) {
        if (arguments.length && canReflect.isPrimitive(bindTarget)) {
            queueName = handler;
            handler = event;
            event = bindTarget;
            bindTarget = this.context;
        }
        if (typeof event === 'function') {
            queueName = handler;
            handler = event;
            event = undefined;
        }
        if (typeof handler === 'string') {
            queueName = handler;
            handler = undefined;
        }
        var keys = [];
        if (bindTarget) {
            keys.push(bindTarget);
            if (event || handler || queueName) {
                keys.push(event);
                if (queueName || handler) {
                    keys.push(queueName || this.defaultQueue);
                    if (handler) {
                        keys.push(handler);
                    }
                }
            }
        }
        return keys;
    }
    var props = {
        dispatch: function (event, args) {
            if (!this.__inSetup) {
                if (typeof event === 'string') {
                    event = { type: event };
                }
                var meta = ensureMeta(this);
                var handlers = meta.handlers;
                var handlersByType = event.type !== undefined && handlers.getNode([event.type]);
                var dispatchConstructorPatches = event.patches && this.constructor[dispatchInstanceOnPatchesSymbol];
                var patchesNode = event.patches !== undefined && handlers.getNode([
                    'can.patches',
                    'onKeyValue'
                ]);
                var keysNode = event.keyChanged !== undefined && handlers.getNode([
                    'can.keys',
                    'onKeyValue'
                ]);
                var batch = dispatchConstructorPatches || handlersByType || patchesNode || keysNode;
                if (batch) {
                    queues.batch.start();
                }
                if (handlersByType) {
                    if (handlersByType.onKeyValue) {
                        queues.enqueueByQueue(handlersByType.onKeyValue, this, args, event.makeMeta, event.reasonLog);
                    }
                    if (handlersByType.event) {
                        event.batchNum = queues.batch.number();
                        var eventAndArgs = [event].concat(args);
                        queues.enqueueByQueue(handlersByType.event, this, eventAndArgs, event.makeMeta, event.reasonLog);
                    }
                }
                if (keysNode) {
                    queues.enqueueByQueue(keysNode, this, [event.keyChanged], event.makeMeta, event.reasonLog);
                }
                if (patchesNode) {
                    queues.enqueueByQueue(patchesNode, this, [event.patches], event.makeMeta, event.reasonLog);
                }
                if (dispatchConstructorPatches) {
                    this.constructor[dispatchInstanceOnPatchesSymbol](this, event.patches);
                }
                if (batch) {
                    queues.batch.stop();
                }
            }
            return event;
        },
        addEventListener: function (key, handler, queueName) {
            ensureMeta(this).handlers.add([
                key,
                'event',
                queueName || 'mutate',
                handler
            ]);
            return this;
        },
        removeEventListener: function (key, handler, queueName) {
            if (key === undefined) {
                var handlers = ensureMeta(this).handlers;
                var keyHandlers = handlers.getNode([]);
                Object.keys(keyHandlers).forEach(function (key) {
                    handlers.delete([
                        key,
                        'event'
                    ]);
                });
            } else if (!handler && !queueName) {
                ensureMeta(this).handlers.delete([
                    key,
                    'event'
                ]);
            } else if (!handler) {
                ensureMeta(this).handlers.delete([
                    key,
                    'event',
                    queueName || 'mutate'
                ]);
            } else {
                ensureMeta(this).handlers.delete([
                    key,
                    'event',
                    queueName || 'mutate',
                    handler
                ]);
            }
            return this;
        },
        one: function (event, handler) {
            var one = function () {
                legacyMapBindings.off.call(this, event, one);
                return handler.apply(this, arguments);
            };
            legacyMapBindings.on.call(this, event, one);
            return this;
        },
        listenTo: function (bindTarget, event, handler, queueName) {
            if (canReflect.isPrimitive(bindTarget)) {
                queueName = handler;
                handler = event;
                event = bindTarget;
                bindTarget = this;
            }
            if (typeof event === 'function') {
                queueName = handler;
                handler = event;
                event = undefined;
            }
            ensureMeta(this).listenHandlers.add([
                bindTarget,
                event,
                queueName || 'mutate',
                handler
            ]);
            legacyMapBindings.on.call(bindTarget, event, handler, queueName || 'mutate');
            return this;
        },
        stopListening: function () {
            var keys = stopListeningArgumentsToKeys.apply({
                context: this,
                defaultQueue: 'mutate'
            }, arguments);
            var listenHandlers = ensureMeta(this).listenHandlers;
            function deleteHandler(bindTarget, event, queue, handler) {
                legacyMapBindings.off.call(bindTarget, event, handler, queue);
            }
            listenHandlers.delete(keys, deleteHandler);
            return this;
        },
        on: function (eventName, handler, queue) {
            var listenWithDOM = isDomEventTarget(this);
            if (listenWithDOM) {
                if (typeof handler === 'string') {
                    domEvents.addDelegateListener(this, eventName, handler, queue);
                } else {
                    domEvents.addEventListener(this, eventName, handler, queue);
                }
            } else {
                if (this[onEventSymbol]) {
                    this[onEventSymbol](eventName, handler, queue);
                } else if ('addEventListener' in this) {
                    this.addEventListener(eventName, handler, queue);
                } else if (this[onKeyValueSymbol]) {
                    canReflect.onKeyValue(this, eventName, handler, queue);
                } else {
                    if (!eventName && this[onValueSymbol]) {
                        canReflect.onValue(this, handler, queue);
                    } else {
                        throw new Error('can-event-queue: Unable to bind ' + eventName);
                    }
                }
            }
            return this;
        },
        off: function (eventName, handler, queue) {
            var listenWithDOM = isDomEventTarget(this);
            if (listenWithDOM) {
                if (typeof handler === 'string') {
                    domEvents.removeDelegateListener(this, eventName, handler, queue);
                } else {
                    domEvents.removeEventListener(this, eventName, handler, queue);
                }
            } else {
                if (this[offEventSymbol]) {
                    this[offEventSymbol](eventName, handler, queue);
                } else if ('removeEventListener' in this) {
                    this.removeEventListener(eventName, handler, queue);
                } else if (this[offKeyValueSymbol]) {
                    canReflect.offKeyValue(this, eventName, handler, queue);
                } else {
                    if (!eventName && this[offValueSymbol]) {
                        canReflect.offValue(this, handler, queue);
                    } else {
                        throw new Error('can-event-queue: Unable to unbind ' + eventName);
                    }
                }
            }
            return this;
        }
    };
    var symbols = {
        'can.onKeyValue': function (key, handler, queueName) {
            ensureMeta(this).handlers.add([
                key,
                'onKeyValue',
                queueName || 'mutate',
                handler
            ]);
        },
        'can.offKeyValue': function (key, handler, queueName) {
            ensureMeta(this).handlers.delete([
                key,
                'onKeyValue',
                queueName || 'mutate',
                handler
            ]);
        },
        'can.isBound': function () {
            return !ensureMeta(this).handlers.isEmpty();
        },
        'can.getWhatIChange': function getWhatIChange(key) {
        },
        'can.onPatches': function (handler, queue) {
            var handlers = ensureMeta(this).handlers;
            handlers.add([
                'can.patches',
                'onKeyValue',
                queue || 'notify',
                handler
            ]);
        },
        'can.offPatches': function (handler, queue) {
            var handlers = ensureMeta(this).handlers;
            handlers.delete([
                'can.patches',
                'onKeyValue',
                queue || 'notify',
                handler
            ]);
        }
    };
    function defineNonEnumerable(obj, prop, value) {
        Object.defineProperty(obj, prop, {
            enumerable: false,
            value: value
        });
    }
    legacyMapBindings = function (obj) {
        canReflect.assignMap(obj, props);
        return canReflect.assignSymbols(obj, symbols);
    };
    defineNonEnumerable(legacyMapBindings, 'addHandlers', addHandlers);
    defineNonEnumerable(legacyMapBindings, 'stopListeningArgumentsToKeys', stopListeningArgumentsToKeys);
    props.bind = props.addEventListener;
    props.unbind = props.removeEventListener;
    canReflect.assignMap(legacyMapBindings, props);
    canReflect.assignSymbols(legacyMapBindings, symbols);
    defineNonEnumerable(legacyMapBindings, 'start', function () {
        console.warn('use can-queues.batch.start()');
        queues.batch.start();
    });
    defineNonEnumerable(legacyMapBindings, 'stop', function () {
        console.warn('use can-queues.batch.stop()');
        queues.batch.stop();
    });
    defineNonEnumerable(legacyMapBindings, 'flush', function () {
        console.warn('use can-queues.flush()');
        queues.flush();
    });
    defineNonEnumerable(legacyMapBindings, 'afterPreviousEvents', function (handler) {
        console.warn('don\'t use afterPreviousEvents');
        queues.mutateQueue.enqueue(function afterPreviousEvents() {
            queues.mutateQueue.enqueue(handler);
        });
        queues.flush();
    });
    defineNonEnumerable(legacyMapBindings, 'after', function (handler) {
        console.warn('don\'t use after');
        queues.mutateQueue.enqueue(handler);
        queues.flush();
    });
    module.exports = legacyMapBindings;
});
/*can-simple-observable@2.4.1#resolver/resolver*/
define('can-simple-observable@2.4.1#resolver/resolver', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    'can-observation-recorder',
    'can-observation',
    'can-queues',
    'can-event-queue/map/map',
    '../settable/settable',
    '../can-simple-observable'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var ObservationRecorder = require('can-observation-recorder');
    var Observation = require('can-observation');
    var queues = require('can-queues');
    var mapEventBindings = require('can-event-queue/map/map');
    var SettableObservable = require('../settable/settable');
    var SimpleObservable = require('../can-simple-observable');
    var getChangesSymbol = canSymbol.for('can.getChangesDependencyRecord');
    function ResolverObservable(resolver, context, initialValue) {
        this.resolver = ObservationRecorder.ignore(resolver);
        this.context = context;
        this._valueOptions = {
            resolve: this.resolve.bind(this),
            listenTo: this.listenTo.bind(this),
            stopListening: this.stopListening.bind(this),
            lastSet: new SimpleObservable(initialValue)
        };
        this.update = this.update.bind(this);
        this.contextHandlers = new WeakMap();
        this.teardown = null;
        this.binder = {};
    }
    ResolverObservable.prototype = Object.create(SettableObservable.prototype);
    function deleteHandler(bindTarget, event, queue, handler) {
        mapEventBindings.off.call(bindTarget, event, handler, queue);
    }
    canReflect.assignMap(ResolverObservable.prototype, {
        constructor: ResolverObservable,
        listenTo: function (bindTarget, event, handler, queueName) {
            if (canReflect.isPrimitive(bindTarget)) {
                handler = event;
                event = bindTarget;
                bindTarget = this.context;
            }
            if (typeof event === 'function') {
                handler = event;
                event = undefined;
            }
            var resolverInstance = this;
            var contextHandler = handler.bind(this.context);
            contextHandler[getChangesSymbol] = function getChangesDependencyRecord() {
                var s = new Set();
                s.add(resolverInstance);
                return { valueDependencies: s };
            };
            this.contextHandlers.set(handler, contextHandler);
            mapEventBindings.listenTo.call(this.binder, bindTarget, event, contextHandler, queueName || 'notify');
        },
        stopListening: function () {
            var meta = this.binder[canSymbol.for('can.meta')];
            var listenHandlers = meta && meta.listenHandlers;
            if (listenHandlers) {
                var keys = mapEventBindings.stopListeningArgumentsToKeys.call({
                    context: this.context,
                    defaultQueue: 'notify'
                });
                listenHandlers.delete(keys, deleteHandler);
            }
            return this;
        },
        resolve: function (newVal) {
            this._value = newVal;
            if (this.isBinding) {
                this.lastValue = this._value;
                return newVal;
            }
            if (this._value !== this.lastValue) {
                var enqueueMeta = {};
                queues.batch.start();
                queues.deriveQueue.enqueue(this.update, this, [], enqueueMeta);
                queues.batch.stop();
            }
            return newVal;
        },
        update: function () {
            if (this.lastValue !== this._value) {
                var old = this.lastValue;
                this.lastValue = this._value;
                queues.enqueueByQueue(this.handlers.getNode([]), this, [
                    this._value,
                    old
                ]);
            }
        },
        activate: function () {
            this.isBinding = true;
            this.teardown = this.resolver.call(this.context, this._valueOptions);
            this.isBinding = false;
        },
        onUnbound: function () {
            this.bound = false;
            mapEventBindings.stopListening.call(this.binder);
            if (this.teardown != null) {
                this.teardown();
                this.teardown = null;
            }
        },
        set: function (value) {
            this._valueOptions.lastSet.set(value);
        },
        get: function () {
            if (ObservationRecorder.isRecording()) {
                ObservationRecorder.add(this);
                if (!this.bound) {
                    this.onBound();
                }
            }
            if (this.bound === true) {
                return this._value;
            } else {
                var handler = function () {
                };
                this.on(handler);
                var val = this._value;
                this.off(handler);
                return val;
            }
        },
        hasDependencies: function hasDependencies() {
            var hasDependencies = false;
            if (this.bound) {
                var meta = this.binder[canSymbol.for('can.meta')];
                var listenHandlers = meta && meta.listenHandlers;
                hasDependencies = !!listenHandlers.size();
            }
            return hasDependencies;
        },
        getValueDependencies: function getValueDependencies() {
            if (this.bound) {
                var meta = this.binder[canSymbol.for('can.meta')];
                var listenHandlers = meta && meta.listenHandlers;
                var keyDeps = new Map();
                var valueDeps = new Set();
                if (listenHandlers) {
                    canReflect.each(listenHandlers.root, function (events, obj) {
                        canReflect.each(events, function (queues, eventName) {
                            if (eventName === undefined) {
                                valueDeps.add(obj);
                            } else {
                                var entry = keyDeps.get(obj);
                                if (!entry) {
                                    entry = new Set();
                                    keyDeps.set(obj, entry);
                                }
                                entry.add(eventName);
                            }
                        });
                    });
                    if (valueDeps.size || keyDeps.size) {
                        var result = {};
                        if (keyDeps.size) {
                            result.keyDependencies = keyDeps;
                        }
                        if (valueDeps.size) {
                            result.valueDependencies = valueDeps;
                        }
                        return result;
                    }
                }
            }
        }
    });
    canReflect.assignSymbols(ResolverObservable.prototype, {
        'can.getValue': ResolverObservable.prototype.get,
        'can.setValue': ResolverObservable.prototype.set,
        'can.isMapLike': false,
        'can.getPriority': function () {
            return this.priority || 0;
        },
        'can.setPriority': function (newPriority) {
            this.priority = newPriority;
        },
        'can.valueHasDependencies': ResolverObservable.prototype.hasDependencies,
        'can.getValueDependencies': ResolverObservable.prototype.getValueDependencies
    });
    module.exports = ResolverObservable;
});
/*can-event-queue@1.1.4#type/type*/
define('can-event-queue@1.1.4#type/type', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    'can-key-tree',
    'can-queues'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var KeyTree = require('can-key-tree');
    var queues = require('can-queues');
    var metaSymbol = canSymbol.for('can.meta');
    function addHandlers(obj, meta) {
        if (!meta.lifecycleHandlers) {
            meta.lifecycleHandlers = new KeyTree([
                Object,
                Array
            ]);
        }
        if (!meta.instancePatchesHandlers) {
            meta.instancePatchesHandlers = new KeyTree([
                Object,
                Array
            ]);
        }
    }
    function ensureMeta(obj) {
        var meta = obj[metaSymbol];
        if (!meta) {
            meta = {};
            canReflect.setKeyValue(obj, metaSymbol, meta);
        }
        addHandlers(obj, meta);
        return meta;
    }
    var props = {};
    function onOffAndDispatch(symbolName, dispatchName, handlersName) {
        props['can.on' + symbolName] = function (handler, queueName) {
            ensureMeta(this)[handlersName].add([
                queueName || 'mutate',
                handler
            ]);
        };
        props['can.off' + symbolName] = function (handler, queueName) {
            ensureMeta(this)[handlersName].delete([
                queueName || 'mutate',
                handler
            ]);
        };
        props['can.' + dispatchName] = function (instance, arg) {
            queues.enqueueByQueue(ensureMeta(this)[handlersName].getNode([]), this, [
                instance,
                arg
            ]);
        };
    }
    onOffAndDispatch('InstancePatches', 'dispatchInstanceOnPatches', 'instancePatchesHandlers');
    onOffAndDispatch('InstanceBoundChange', 'dispatchInstanceBoundChange', 'lifecycleHandlers');
    function mixinTypeBindings(obj) {
        return canReflect.assignSymbols(obj, props);
    }
    Object.defineProperty(mixinTypeBindings, 'addHandlers', {
        enumerable: false,
        value: addHandlers
    });
    module.exports = mixinTypeBindings;
});
/*can-string-to-any@1.2.0#can-string-to-any*/
define('can-string-to-any@1.2.0#can-string-to-any', function (require, exports, module) {
    'use strict';
    module.exports = function (str) {
        switch (str) {
        case 'NaN':
        case 'Infinity':
            return +str;
        case 'null':
            return null;
        case 'undefined':
            return undefined;
        case 'true':
        case 'false':
            return str === 'true';
        default:
            var val = +str;
            if (!isNaN(val)) {
                return val;
            } else {
                return str;
            }
        }
    };
});
/*can-data-types@1.2.0#maybe-boolean/maybe-boolean*/
define('can-data-types@1.2.0#maybe-boolean/maybe-boolean', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    function toBoolean(val) {
        if (val == null) {
            return val;
        }
        if (val === 'false' || val === '0' || !val) {
            return false;
        }
        return true;
    }
    module.exports = canReflect.assignSymbols(toBoolean, {
        'can.new': toBoolean,
        'can.getSchema': function () {
            return {
                type: 'Or',
                values: [
                    true,
                    false,
                    undefined,
                    null
                ]
            };
        },
        'can.getName': function () {
            return 'MaybeBoolean';
        },
        'can.isMember': function (value) {
            return value == null || typeof value === 'boolean';
        }
    });
});
/*can-data-types@1.2.0#maybe-date/maybe-date*/
define('can-data-types@1.2.0#maybe-date/maybe-date', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    function toDate(str) {
        var type = typeof str;
        if (type === 'string') {
            str = Date.parse(str);
            return isNaN(str) ? null : new Date(str);
        } else if (type === 'number') {
            return new Date(str);
        } else {
            return str;
        }
    }
    function DateStringSet(dateStr) {
        this.setValue = dateStr;
        var date = toDate(dateStr);
        this.value = date == null ? date : date.getTime();
    }
    DateStringSet.prototype.valueOf = function () {
        return this.value;
    };
    canReflect.assignSymbols(DateStringSet.prototype, {
        'can.serialize': function () {
            return this.setValue;
        }
    });
    module.exports = canReflect.assignSymbols(toDate, {
        'can.new': toDate,
        'can.getSchema': function () {
            return {
                type: 'Or',
                values: [
                    Date,
                    undefined,
                    null
                ]
            };
        },
        'can.ComparisonSetType': DateStringSet,
        'can.getName': function () {
            return 'MaybeDate';
        },
        'can.isMember': function (value) {
            return value == null || value instanceof Date;
        }
    });
});
/*can-data-types@1.2.0#maybe-number/maybe-number*/
define('can-data-types@1.2.0#maybe-number/maybe-number', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    function toNumber(val) {
        if (val == null) {
            return val;
        }
        return +val;
    }
    module.exports = canReflect.assignSymbols(toNumber, {
        'can.new': toNumber,
        'can.getSchema': function () {
            return {
                type: 'Or',
                values: [
                    Number,
                    undefined,
                    null
                ]
            };
        },
        'can.getName': function () {
            return 'MaybeNumber';
        },
        'can.isMember': function (value) {
            return value == null || typeof value === 'number';
        }
    });
});
/*can-data-types@1.2.0#maybe-string/maybe-string*/
define('can-data-types@1.2.0#maybe-string/maybe-string', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    function toString(val) {
        if (val == null) {
            return val;
        }
        return '' + val;
    }
    module.exports = canReflect.assignSymbols(toString, {
        'can.new': toString,
        'can.getSchema': function () {
            return {
                type: 'Or',
                values: [
                    String,
                    undefined,
                    null
                ]
            };
        },
        'can.getName': function () {
            return 'MaybeString';
        },
        'can.isMember': function (value) {
            return value == null || typeof value === 'string';
        }
    });
});
/*can-define@2.7.5#can-define*/
define('can-define@2.7.5#can-define', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-symbol',
    'can-reflect',
    'can-observation',
    'can-observation-recorder',
    'can-simple-observable/async/async',
    'can-simple-observable/settable/settable',
    'can-simple-observable/resolver/resolver',
    'can-event-queue/map/map',
    'can-event-queue/type/type',
    'can-queues',
    'can-assign',
    'can-log/dev/dev',
    'can-string-to-any',
    'can-define-lazy-value',
    'can-data-types/maybe-boolean/maybe-boolean',
    'can-data-types/maybe-date/maybe-date',
    'can-data-types/maybe-number/maybe-number',
    'can-data-types/maybe-string/maybe-string'
], function (require, exports, module) {
    'use strict';
    'format cjs';
    var ns = require('can-namespace');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var Observation = require('can-observation');
    var ObservationRecorder = require('can-observation-recorder');
    var AsyncObservable = require('can-simple-observable/async/async');
    var SettableObservable = require('can-simple-observable/settable/settable');
    var ResolverObservable = require('can-simple-observable/resolver/resolver');
    var eventQueue = require('can-event-queue/map/map');
    var addTypeEvents = require('can-event-queue/type/type');
    var queues = require('can-queues');
    var assign = require('can-assign');
    var canLogDev = require('can-log/dev/dev');
    var stringToAny = require('can-string-to-any');
    var defineLazyValue = require('can-define-lazy-value');
    var MaybeBoolean = require('can-data-types/maybe-boolean/maybe-boolean'), MaybeDate = require('can-data-types/maybe-date/maybe-date'), MaybeNumber = require('can-data-types/maybe-number/maybe-number'), MaybeString = require('can-data-types/maybe-string/maybe-string');
    var newSymbol = canSymbol.for('can.new'), serializeSymbol = canSymbol.for('can.serialize');
    var eventsProto, define, make, makeDefinition, getDefinitionsAndMethods, getDefinitionOrMethod;
    function isDefineType(func) {
        return func && (func.canDefineType === true || func[newSymbol]);
    }
    var peek = ObservationRecorder.ignore(canReflect.getValue.bind(canReflect));
    var Object_defineNamedPrototypeProperty = Object.defineProperty;
    function defineConfigurableAndNotEnumerable(obj, prop, value) {
        Object.defineProperty(obj, prop, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: value
        });
    }
    function eachPropertyDescriptor(map, cb) {
        for (var prop in map) {
            if (map.hasOwnProperty(prop)) {
                cb.call(map, prop, Object.getOwnPropertyDescriptor(map, prop));
            }
        }
    }
    function getEveryPropertyAndSymbol(obj) {
        var props = Object.getOwnPropertyNames(obj);
        var symbols = 'getOwnPropertySymbols' in Object ? Object.getOwnPropertySymbols(obj) : [];
        return props.concat(symbols);
    }
    function cleanUpDefinition(prop, definition, shouldWarn, typePrototype) {
        if (definition.value !== undefined && (typeof definition.value !== 'function' || definition.value.length === 0)) {
            definition.default = definition.value;
            delete definition.value;
        }
        if (definition.Value !== undefined) {
            definition.Default = definition.Value;
            delete definition.Value;
        }
    }
    function isValueResolver(definition) {
        return typeof definition.value === 'function' && definition.value.length;
    }
    module.exports = define = ns.define = function (typePrototype, defines, baseDefine) {
        var prop, dataInitializers = Object.create(baseDefine ? baseDefine.dataInitializers : null), computedInitializers = Object.create(baseDefine ? baseDefine.computedInitializers : null);
        var result = getDefinitionsAndMethods(defines, baseDefine, typePrototype);
        result.dataInitializers = dataInitializers;
        result.computedInitializers = computedInitializers;
        canReflect.eachKey(result.definitions, function (definition, property) {
            define.property(typePrototype, property, definition, dataInitializers, computedInitializers, result.defaultDefinition);
        });
        if (typePrototype.hasOwnProperty('_data')) {
            for (prop in dataInitializers) {
                defineLazyValue(typePrototype._data, prop, dataInitializers[prop].bind(typePrototype), true);
            }
        } else {
            defineLazyValue(typePrototype, '_data', function () {
                var map = this;
                var data = {};
                for (var prop in dataInitializers) {
                    defineLazyValue(data, prop, dataInitializers[prop].bind(map), true);
                }
                return data;
            });
        }
        if (typePrototype.hasOwnProperty('_computed')) {
            for (prop in computedInitializers) {
                defineLazyValue(typePrototype._computed, prop, computedInitializers[prop].bind(typePrototype));
            }
        } else {
            defineLazyValue(typePrototype, '_computed', function () {
                var map = this;
                var data = Object.create(null);
                for (var prop in computedInitializers) {
                    defineLazyValue(data, prop, computedInitializers[prop].bind(map));
                }
                return data;
            });
        }
        getEveryPropertyAndSymbol(eventsProto).forEach(function (prop) {
            Object.defineProperty(typePrototype, prop, {
                enumerable: false,
                value: eventsProto[prop],
                configurable: true,
                writable: true
            });
        });
        Object.defineProperty(typePrototype, '_define', {
            enumerable: false,
            value: result,
            configurable: true,
            writable: true
        });
        var iteratorSymbol = canSymbol.iterator || canSymbol.for('iterator');
        if (!typePrototype[iteratorSymbol]) {
            defineConfigurableAndNotEnumerable(typePrototype, iteratorSymbol, function () {
                return new define.Iterator(this);
            });
        }
        return result;
    };
    var onlyType = function (obj) {
        for (var prop in obj) {
            if (prop !== 'type') {
                return false;
            }
        }
        return true;
    };
    define.extensions = function () {
    };
    define.property = function (typePrototype, prop, definition, dataInitializers, computedInitializers, defaultDefinition) {
        var propertyDefinition = define.extensions.apply(this, arguments);
        if (propertyDefinition) {
            definition = makeDefinition(prop, propertyDefinition, defaultDefinition || {}, typePrototype);
        }
        var type = definition.type;
        if (type && onlyType(definition) && type === define.types['*']) {
            Object_defineNamedPrototypeProperty(typePrototype, prop, {
                get: make.get.data(prop),
                set: make.set.events(prop, make.get.data(prop), make.set.data(prop), make.eventType.data(prop)),
                enumerable: true,
                configurable: true
            });
            return;
        }
        definition.type = type;
        var dataProperty = definition.get || isValueResolver(definition) ? 'computed' : 'data', reader = make.read[dataProperty](prop), getter = make.get[dataProperty](prop), setter = make.set[dataProperty](prop), getInitialValue;
        var typeConvert = function (val) {
            return val;
        };
        if (definition.Type) {
            typeConvert = make.set.Type(prop, definition.Type, typeConvert);
        }
        if (type) {
            typeConvert = make.set.type(prop, type, typeConvert);
        }
        var eventsSetter = make.set.events(prop, reader, setter, make.eventType[dataProperty](prop));
        if (isValueResolver(definition)) {
            computedInitializers[prop] = make.valueResolver(prop, definition, typeConvert);
        } else if (definition.default !== undefined || definition.Default !== undefined) {
            getInitialValue = ObservationRecorder.ignore(make.get.defaultValue(prop, definition, typeConvert, eventsSetter));
        }
        if (definition.get) {
            computedInitializers[prop] = make.compute(prop, definition.get, getInitialValue);
        } else if (getInitialValue) {
            dataInitializers[prop] = getInitialValue;
        }
        if (definition.get && definition.set) {
            setter = make.set.setter(prop, definition.set, make.read.lastSet(prop), setter, true);
        } else if (definition.set) {
            setter = make.set.setter(prop, definition.set, reader, eventsSetter, false);
        } else if (dataProperty === 'data') {
            setter = eventsSetter;
        } else if (definition.get && definition.get.length < 1) {
            setter = function () {
            };
        }
        if (type) {
            setter = make.set.type(prop, type, setter);
        }
        if (definition.Type) {
            setter = make.set.Type(prop, definition.Type, setter);
        }
        Object_defineNamedPrototypeProperty(typePrototype, prop, {
            get: getter,
            set: setter,
            enumerable: 'serialize' in definition ? !!definition.serialize : !definition.get,
            configurable: true
        });
    };
    define.makeDefineInstanceKey = function (constructor) {
        constructor[canSymbol.for('can.defineInstanceKey')] = function (property, value) {
            var defineResult = this.prototype._define;
            if (typeof value === 'object') {
                cleanUpDefinition(property, value, false, this);
            }
            var definition = getDefinitionOrMethod(property, value, defineResult.defaultDefinition, this);
            if (definition && typeof definition === 'object') {
                define.property(constructor.prototype, property, definition, defineResult.dataInitializers, defineResult.computedInitializers, defineResult.defaultDefinition);
                defineResult.definitions[property] = definition;
            } else {
                defineResult.methods[property] = definition;
            }
            this.prototype.dispatch({
                type: 'can.keys',
                target: this.prototype
            });
        };
    };
    define.Constructor = function (defines, sealed) {
        var constructor = function DefineConstructor(props) {
            Object.defineProperty(this, '__inSetup', {
                configurable: true,
                enumerable: false,
                value: true,
                writable: true
            });
            define.setup.call(this, props, sealed);
            this.__inSetup = false;
        };
        var result = define(constructor.prototype, defines);
        addTypeEvents(constructor);
        define.makeDefineInstanceKey(constructor, result);
        return constructor;
    };
    make = {
        computeObj: function (map, prop, observable) {
            var computeObj = {
                oldValue: undefined,
                compute: observable,
                count: 0,
                handler: function (newVal) {
                    var oldValue = computeObj.oldValue;
                    computeObj.oldValue = newVal;
                    map.dispatch({
                        type: prop,
                        target: map
                    }, [
                        newVal,
                        oldValue
                    ]);
                }
            };
            return computeObj;
        },
        valueResolver: function (prop, definition, typeConvert) {
            var getDefault = make.get.defaultValue(prop, definition, typeConvert);
            return function () {
                var map = this;
                var defaultValue = getDefault.call(this);
                var computeObj = make.computeObj(map, prop, new ResolverObservable(definition.value, map, defaultValue));
                return computeObj;
            };
        },
        compute: function (prop, get, defaultValueFn) {
            return function () {
                var map = this, defaultValue = defaultValueFn && defaultValueFn.call(this), observable, computeObj;
                if (get.length === 0) {
                    observable = new Observation(get, map);
                } else if (get.length === 1) {
                    observable = new SettableObservable(get, map, defaultValue);
                } else {
                    observable = new AsyncObservable(get, map, defaultValue);
                }
                computeObj = make.computeObj(map, prop, observable);
                return computeObj;
            };
        },
        set: {
            data: function (prop) {
                return function (newVal) {
                    this._data[prop] = newVal;
                };
            },
            computed: function (prop) {
                return function (val) {
                    canReflect.setValue(this._computed[prop].compute, val);
                };
            },
            events: function (prop, getCurrent, setData, eventType) {
                return function (newVal) {
                    if (this.__inSetup) {
                        setData.call(this, newVal);
                    } else {
                        var current = getCurrent.call(this);
                        if (newVal !== current) {
                            var dispatched;
                            setData.call(this, newVal);
                            dispatched = {
                                patches: [{
                                        type: 'set',
                                        key: prop,
                                        value: newVal
                                    }],
                                type: prop,
                                target: this
                            };
                            this.dispatch(dispatched, [
                                newVal,
                                current
                            ]);
                        }
                    }
                };
            },
            setter: function (prop, setter, getCurrent, setEvents, hasGetter) {
                return function (value) {
                    var self = this;
                    queues.batch.start();
                    var setterCalled = false, current = getCurrent.call(this), setValue = setter.call(this, value, function (value) {
                            setEvents.call(self, value);
                            setterCalled = true;
                        }, current);
                    if (setterCalled) {
                        queues.batch.stop();
                    } else {
                        if (hasGetter) {
                            if (setValue !== undefined) {
                                if (current !== setValue) {
                                    setEvents.call(this, setValue);
                                }
                                queues.batch.stop();
                            } else if (setter.length === 0) {
                                setEvents.call(this, value);
                                queues.batch.stop();
                                return;
                            } else if (setter.length === 1) {
                                queues.batch.stop();
                            } else {
                                queues.batch.stop();
                                return;
                            }
                        } else {
                            if (setValue !== undefined) {
                                setEvents.call(this, setValue);
                                queues.batch.stop();
                            } else if (setter.length === 0) {
                                setEvents.call(this, value);
                                queues.batch.stop();
                                return;
                            } else if (setter.length === 1) {
                                setEvents.call(this, undefined);
                                queues.batch.stop();
                            } else {
                                queues.batch.stop();
                                return;
                            }
                        }
                    }
                };
            },
            type: function (prop, type, set) {
                function setter(newValue) {
                    return set.call(this, type.call(this, newValue, prop));
                }
                if (isDefineType(type)) {
                    if (type.canDefineType) {
                        return setter;
                    } else {
                        return function setter(newValue) {
                            return set.call(this, canReflect.convert(newValue, type));
                        };
                    }
                }
                if (typeof type === 'object') {
                    return make.set.Type(prop, type, set);
                } else {
                    return setter;
                }
            },
            Type: function (prop, Type, set) {
                if (Array.isArray(Type) && define.DefineList) {
                    Type = define.DefineList.extend({ '#': Type[0] });
                } else if (typeof Type === 'object') {
                    if (define.DefineMap) {
                        Type = define.DefineMap.extend(Type);
                    } else {
                        Type = define.Constructor(Type);
                    }
                }
                return function (newValue) {
                    if (newValue instanceof Type || newValue == null) {
                        return set.call(this, newValue);
                    } else {
                        return set.call(this, new Type(newValue));
                    }
                };
            }
        },
        eventType: {
            data: function (prop) {
                return function (newVal, oldVal) {
                    return oldVal !== undefined || this._data.hasOwnProperty(prop) ? 'set' : 'add';
                };
            },
            computed: function () {
                return function () {
                    return 'set';
                };
            }
        },
        read: {
            data: function (prop) {
                return function () {
                    return this._data[prop];
                };
            },
            computed: function (prop) {
                return function () {
                    return canReflect.getValue(this._computed[prop].compute);
                };
            },
            lastSet: function (prop) {
                return function () {
                    var observable = this._computed[prop].compute;
                    if (observable.lastSetValue) {
                        return canReflect.getValue(observable.lastSetValue);
                    }
                };
            }
        },
        get: {
            defaultValue: function (prop, definition, typeConvert, callSetter) {
                return function () {
                    var value = definition.default;
                    if (value !== undefined) {
                        if (typeof value === 'function') {
                            value = value.call(this);
                        }
                        value = typeConvert.call(this, value);
                    } else {
                        var Default = definition.Default;
                        if (Default) {
                            value = typeConvert.call(this, new Default());
                        }
                    }
                    if (definition.set) {
                        var VALUE;
                        var sync = true;
                        var setter = make.set.setter(prop, definition.set, function () {
                        }, function (value) {
                            if (sync) {
                                VALUE = value;
                            } else {
                                callSetter.call(this, value);
                            }
                        }, definition.get);
                        setter.call(this, value);
                        sync = false;
                        return VALUE;
                    }
                    return value;
                };
            },
            data: function (prop) {
                return function () {
                    if (!this.__inSetup) {
                        ObservationRecorder.add(this, prop);
                    }
                    return this._data[prop];
                };
            },
            computed: function (prop) {
                return function (val) {
                    var compute = this._computed[prop].compute;
                    if (ObservationRecorder.isRecording()) {
                        ObservationRecorder.add(this, prop);
                        if (!canReflect.isBound(compute)) {
                            Observation.temporarilyBind(compute);
                        }
                    }
                    return peek(compute);
                };
            }
        }
    };
    define.behaviors = [
        'get',
        'set',
        'value',
        'Value',
        'type',
        'Type',
        'serialize'
    ];
    var addBehaviorToDefinition = function (definition, behavior, value) {
        if (behavior === 'enumerable') {
            definition.serialize = !!value;
        } else if (behavior === 'type') {
            var behaviorDef = value;
            if (typeof behaviorDef === 'string') {
                behaviorDef = define.types[behaviorDef];
                if (typeof behaviorDef === 'object' && !isDefineType(behaviorDef)) {
                    assign(definition, behaviorDef);
                    behaviorDef = behaviorDef[behavior];
                }
            }
            if (typeof behaviorDef !== 'undefined') {
                definition[behavior] = behaviorDef;
            }
        } else {
            definition[behavior] = value;
        }
    };
    makeDefinition = function (prop, def, defaultDefinition, typePrototype) {
        var definition = {};
        canReflect.eachKey(def, function (value, behavior) {
            addBehaviorToDefinition(definition, behavior, value);
        });
        canReflect.eachKey(defaultDefinition, function (value, prop) {
            if (definition[prop] === undefined) {
                if (prop !== 'type' && prop !== 'Type') {
                    definition[prop] = value;
                }
            }
        });
        if (def.Type) {
            var value = def.Type;
            var serialize = value[serializeSymbol];
            if (serialize) {
                definition.serialize = function (val) {
                    return serialize.call(val);
                };
            }
            if (value[newSymbol]) {
                definition.type = value;
                delete definition.Type;
            }
        }
        if (typeof def.type !== 'string') {
            if (!definition.type && !definition.Type) {
                var defaultsCopy = canReflect.assignMap({}, defaultDefinition);
                definition = canReflect.assignMap(defaultsCopy, definition);
            }
            if (canReflect.size(definition) === 0) {
                definition.type = define.types['*'];
            }
        }
        cleanUpDefinition(prop, definition, true, typePrototype);
        return definition;
    };
    getDefinitionOrMethod = function (prop, value, defaultDefinition, typePrototype) {
        var definition;
        if (typeof value === 'string') {
            definition = { type: value };
        } else if (value && (value[serializeSymbol] || value[newSymbol])) {
            definition = { Type: value };
        } else if (typeof value === 'function') {
            if (canReflect.isConstructorLike(value)) {
                definition = { Type: value };
            }
        } else if (Array.isArray(value)) {
            definition = { Type: value };
        } else if (canReflect.isPlainObject(value)) {
            definition = value;
        }
        if (definition) {
            return makeDefinition(prop, definition, defaultDefinition, typePrototype);
        } else {
            return value;
        }
    };
    getDefinitionsAndMethods = function (defines, baseDefines, typePrototype) {
        var definitions = Object.create(baseDefines ? baseDefines.definitions : null);
        var methods = {};
        var defaults = defines['*'], defaultDefinition;
        if (defaults) {
            delete defines['*'];
            defaultDefinition = getDefinitionOrMethod('*', defaults, {});
        } else {
            defaultDefinition = Object.create(null);
        }
        eachPropertyDescriptor(defines, function (prop, propertyDescriptor) {
            var value;
            if (propertyDescriptor.get || propertyDescriptor.set) {
                value = {
                    get: propertyDescriptor.get,
                    set: propertyDescriptor.set
                };
            } else {
                value = propertyDescriptor.value;
            }
            if (prop === 'constructor') {
                methods[prop] = value;
                return;
            } else {
                var result = getDefinitionOrMethod(prop, value, defaultDefinition, typePrototype);
                if (result && typeof result === 'object' && canReflect.size(result) > 0) {
                    definitions[prop] = result;
                } else {
                    if (typeof result === 'function') {
                        methods[prop] = result;
                    }
                }
            }
        });
        if (defaults) {
            defineConfigurableAndNotEnumerable(defines, '*', defaults);
        }
        return {
            definitions: definitions,
            methods: methods,
            defaultDefinition: defaultDefinition
        };
    };
    eventsProto = eventQueue({});
    function setupComputed(instance, eventName) {
        var computedBinding = instance._computed && instance._computed[eventName];
        if (computedBinding && computedBinding.compute) {
            if (!computedBinding.count) {
                computedBinding.count = 1;
                canReflect.onValue(computedBinding.compute, computedBinding.handler, 'notify');
                computedBinding.oldValue = peek(computedBinding.compute);
            } else {
                computedBinding.count++;
            }
        }
    }
    function teardownComputed(instance, eventName) {
        var computedBinding = instance._computed && instance._computed[eventName];
        if (computedBinding) {
            if (computedBinding.count === 1) {
                computedBinding.count = 0;
                canReflect.offValue(computedBinding.compute, computedBinding.handler, 'notify');
            } else {
                computedBinding.count--;
            }
        }
    }
    var canMetaSymbol = canSymbol.for('can.meta');
    assign(eventsProto, {
        _eventSetup: function () {
        },
        _eventTeardown: function () {
        },
        addEventListener: function (eventName, handler, queue) {
            setupComputed(this, eventName);
            return eventQueue.addEventListener.apply(this, arguments);
        },
        removeEventListener: function (eventName, handler) {
            teardownComputed(this, eventName);
            return eventQueue.removeEventListener.apply(this, arguments);
        }
    });
    eventsProto.on = eventsProto.bind = eventsProto.addEventListener;
    eventsProto.off = eventsProto.unbind = eventsProto.removeEventListener;
    var onKeyValueSymbol = canSymbol.for('can.onKeyValue');
    var offKeyValueSymbol = canSymbol.for('can.offKeyValue');
    canReflect.assignSymbols(eventsProto, {
        'can.onKeyValue': function (key) {
            setupComputed(this, key);
            return eventQueue[onKeyValueSymbol].apply(this, arguments);
        },
        'can.offKeyValue': function (key) {
            teardownComputed(this, key);
            return eventQueue[offKeyValueSymbol].apply(this, arguments);
        }
    });
    delete eventsProto.one;
    define.setup = function (props, sealed) {
        Object.defineProperty(this, 'constructor', {
            value: this.constructor,
            enumerable: false,
            writable: false
        });
        Object.defineProperty(this, canMetaSymbol, {
            value: Object.create(null),
            enumerable: false,
            writable: false
        });
        var definitions = this._define.definitions;
        var instanceDefinitions = Object.create(null);
        var map = this;
        canReflect.eachKey(props, function (value, prop) {
            if (definitions[prop] !== undefined) {
                map[prop] = value;
            } else {
                define.expando(map, prop, value);
            }
        });
        if (canReflect.size(instanceDefinitions) > 0) {
            defineConfigurableAndNotEnumerable(this, '_instanceDefinitions', instanceDefinitions);
        }
    };
    var returnFirstArg = function (arg) {
        return arg;
    };
    define.expando = function (map, prop, value) {
        if (define._specialKeys[prop]) {
            return true;
        }
        var constructorDefines = map._define.definitions;
        if (constructorDefines && constructorDefines[prop]) {
            return;
        }
        var instanceDefines = map._instanceDefinitions;
        if (!instanceDefines) {
            if (Object.isSealed(map)) {
                return;
            }
            Object.defineProperty(map, '_instanceDefinitions', {
                configurable: true,
                enumerable: false,
                writable: true,
                value: {}
            });
            instanceDefines = map._instanceDefinitions;
        }
        if (!instanceDefines[prop]) {
            var defaultDefinition = map._define.defaultDefinition || { type: define.types.observable };
            define.property(map, prop, defaultDefinition, {}, {});
            if (defaultDefinition.type) {
                map._data[prop] = define.make.set.type(prop, defaultDefinition.type, returnFirstArg).call(map, value);
            } else {
                map._data[prop] = define.types.observable(value);
            }
            instanceDefines[prop] = defaultDefinition;
            if (!map.__inSetup) {
                queues.batch.start();
                map.dispatch({
                    type: 'can.keys',
                    target: map
                });
                if (Object.prototype.hasOwnProperty.call(map._data, prop)) {
                    map.dispatch({
                        type: prop,
                        target: map,
                        patches: [{
                                type: 'add',
                                key: prop,
                                value: map._data[prop]
                            }]
                    }, [
                        map._data[prop],
                        undefined
                    ]);
                } else {
                    map.dispatch({
                        type: 'set',
                        target: map,
                        patches: [{
                                type: 'add',
                                key: prop,
                                value: map._data[prop]
                            }]
                    }, [
                        map._data[prop],
                        undefined
                    ]);
                }
                queues.batch.stop();
            }
            return true;
        }
    };
    define.replaceWith = defineLazyValue;
    define.eventsProto = eventsProto;
    define.defineConfigurableAndNotEnumerable = defineConfigurableAndNotEnumerable;
    define.make = make;
    define.getDefinitionOrMethod = getDefinitionOrMethod;
    define._specialKeys = {
        _data: true,
        _computed: true
    };
    var simpleGetterSetters = {};
    define.makeSimpleGetterSetter = function (prop) {
        if (simpleGetterSetters[prop] === undefined) {
            var setter = make.set.events(prop, make.get.data(prop), make.set.data(prop), make.eventType.data(prop));
            simpleGetterSetters[prop] = {
                get: make.get.data(prop),
                set: function (newVal) {
                    return setter.call(this, define.types.observable(newVal));
                },
                enumerable: true,
                configurable: true
            };
        }
        return simpleGetterSetters[prop];
    };
    define.Iterator = function (obj) {
        this.obj = obj;
        this.definitions = Object.keys(obj._define.definitions);
        this.instanceDefinitions = obj._instanceDefinitions ? Object.keys(obj._instanceDefinitions) : Object.keys(obj);
        this.hasGet = typeof obj.get === 'function';
    };
    define.Iterator.prototype.next = function () {
        var key;
        if (this.definitions.length) {
            key = this.definitions.shift();
            var def = this.obj._define.definitions[key];
            if (def.get) {
                return this.next();
            }
        } else if (this.instanceDefinitions.length) {
            key = this.instanceDefinitions.shift();
        } else {
            return {
                value: undefined,
                done: true
            };
        }
        return {
            value: [
                key,
                this.hasGet ? this.obj.get(key) : this.obj[key]
            ],
            done: false
        };
    };
    function isObservableValue(obj) {
        return canReflect.isValueLike(obj) && canReflect.isObservableLike(obj);
    }
    define.types = {
        'date': MaybeDate,
        'number': MaybeNumber,
        'boolean': MaybeBoolean,
        'observable': function (newVal) {
            if (Array.isArray(newVal) && define.DefineList) {
                newVal = new define.DefineList(newVal);
            } else if (canReflect.isPlainObject(newVal) && define.DefineMap) {
                newVal = new define.DefineMap(newVal);
            }
            return newVal;
        },
        'stringOrObservable': function (newVal) {
            if (Array.isArray(newVal)) {
                return new define.DefaultList(newVal);
            } else if (canReflect.isPlainObject(newVal)) {
                return new define.DefaultMap(newVal);
            } else {
                return canReflect.convert(newVal, define.types.string);
            }
        },
        'htmlbool': function (val) {
            if (val === '') {
                return true;
            }
            return !!stringToAny(val);
        },
        '*': function (val) {
            return val;
        },
        'any': function (val) {
            return val;
        },
        'string': MaybeString,
        'compute': {
            set: function (newValue, setVal, setErr, oldValue) {
                if (isObservableValue(newValue)) {
                    return newValue;
                }
                if (isObservableValue(oldValue)) {
                    canReflect.setValue(oldValue, newValue);
                    return oldValue;
                }
                return newValue;
            },
            get: function (value) {
                return isObservableValue(value) ? canReflect.getValue(value) : value;
            }
        }
    };
    define.updateSchemaKeys = function (schema, definitions) {
        for (var prop in definitions) {
            var definition = definitions[prop];
            if (definition.serialize !== false) {
                if (definition.Type) {
                    schema.keys[prop] = definition.Type;
                } else if (definition.type) {
                    schema.keys[prop] = definition.type;
                } else {
                    schema.keys[prop] = function (val) {
                        return val;
                    };
                }
                if (definitions[prop].identity === true) {
                    schema.identity.push(prop);
                }
            }
        }
        return schema;
    };
});
/*can-define@2.7.5#ensure-meta*/
define('can-define@2.7.5#ensure-meta', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    module.exports = function ensureMeta(obj) {
        var metaSymbol = canSymbol.for('can.meta');
        var meta = obj[metaSymbol];
        if (!meta) {
            meta = {};
            canReflect.setKeyValue(obj, metaSymbol, meta);
        }
        return meta;
    };
});
/*can-define@2.7.5#define-helpers/define-helpers*/
define('can-define@2.7.5#define-helpers/define-helpers', [
    'require',
    'exports',
    'module',
    'can-define',
    'can-reflect',
    'can-queues',
    'can-log/dev/dev',
    '../ensure-meta'
], function (require, exports, module) {
    'use strict';
    var define = require('can-define');
    var canReflect = require('can-reflect');
    var queues = require('can-queues');
    var dev = require('can-log/dev/dev');
    var ensureMeta = require('../ensure-meta');
    var defineHelpers = {
        defineExpando: define.expando,
        reflectSerialize: function (unwrapped) {
            var constructorDefinitions = this._define.definitions;
            var defaultDefinition = this._define.defaultDefinition;
            this.forEach(function (val, name) {
                var propDef = constructorDefinitions[name];
                if (propDef && typeof propDef.serialize === 'function') {
                    val = propDef.serialize.call(this, val, name);
                } else if (defaultDefinition && typeof defaultDefinition.serialize === 'function') {
                    val = defaultDefinition.serialize.call(this, val, name);
                } else {
                    val = canReflect.serialize(val);
                }
                if (val !== undefined) {
                    unwrapped[name] = val;
                }
            }, this);
            return unwrapped;
        },
        reflectUnwrap: function (unwrapped) {
            this.forEach(function (value, key) {
                if (value !== undefined) {
                    unwrapped[key] = canReflect.unwrap(value);
                }
            });
            return unwrapped;
        },
        log: function (key) {
            var instance = this;
            var quoteString = function quoteString(x) {
                return typeof x === 'string' ? JSON.stringify(x) : x;
            };
            var meta = ensureMeta(instance);
            var allowed = meta.allowedLogKeysSet || new Set();
            meta.allowedLogKeysSet = allowed;
            if (key) {
                allowed.add(key);
            }
            meta._log = function (event, data) {
                var type = event.type;
                if (type === 'can.onPatches' || key && !allowed.has(type) || type === 'can.keys' || key && !allowed.has(type)) {
                    return;
                }
                if (type === 'add' || type === 'remove') {
                    dev.log(canReflect.getName(instance), '\n how   ', quoteString(type), '\n what  ', quoteString(data[0]), '\n index ', quoteString(data[1]));
                } else {
                    dev.log(canReflect.getName(instance), '\n key ', quoteString(type), '\n is  ', quoteString(data[0]), '\n was ', quoteString(data[1]));
                }
            };
        },
        deleteKey: function (prop) {
            var instanceDefines = this._instanceDefinitions;
            if (instanceDefines && Object.prototype.hasOwnProperty.call(instanceDefines, prop) && !Object.isSealed(this)) {
                delete instanceDefines[prop];
                queues.batch.start();
                this.dispatch({
                    type: 'can.keys',
                    target: this
                });
                var oldValue = this._data[prop];
                if (oldValue !== undefined) {
                    delete this._data[prop];
                    this.dispatch({
                        type: prop,
                        target: this,
                        patches: [{
                                type: 'delete',
                                key: prop
                            }]
                    }, [
                        undefined,
                        oldValue
                    ]);
                }
                queues.batch.stop();
            } else {
                this.set(prop, undefined);
            }
            return this;
        }
    };
    module.exports = defineHelpers;
});
/*can-define@2.7.5#map/map*/
define('can-define@2.7.5#map/map', [
    'require',
    'exports',
    'module',
    'can-construct',
    'can-define',
    '../define-helpers/define-helpers',
    'can-observation-recorder',
    'can-namespace',
    'can-log',
    'can-log/dev/dev',
    'can-reflect',
    'can-symbol',
    'can-queues',
    'can-event-queue/type/type'
], function (require, exports, module) {
    'use strict';
    var Construct = require('can-construct');
    var define = require('can-define');
    var defineHelpers = require('../define-helpers/define-helpers');
    var ObservationRecorder = require('can-observation-recorder');
    var ns = require('can-namespace');
    var canLog = require('can-log');
    var canLogDev = require('can-log/dev/dev');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var queues = require('can-queues');
    var addTypeEvents = require('can-event-queue/type/type');
    var keysForDefinition = function (definitions) {
        var keys = [];
        for (var prop in definitions) {
            var definition = definitions[prop];
            if (typeof definition !== 'object' || ('serialize' in definition ? !!definition.serialize : !definition.get)) {
                keys.push(prop);
            }
        }
        return keys;
    };
    function assign(source) {
        queues.batch.start();
        canReflect.assignMap(this, source || {});
        queues.batch.stop();
    }
    function update(source) {
        queues.batch.start();
        canReflect.updateMap(this, source || {});
        queues.batch.stop();
    }
    function assignDeep(source) {
        queues.batch.start();
        canReflect.assignDeepMap(this, source || {});
        queues.batch.stop();
    }
    function updateDeep(source) {
        queues.batch.start();
        canReflect.updateDeepMap(this, source || {});
        queues.batch.stop();
    }
    function setKeyValue(key, value) {
        var defined = defineHelpers.defineExpando(this, key, value);
        if (!defined) {
            this[key] = value;
        }
    }
    function getKeyValue(key) {
        var value = this[key];
        if (value !== undefined || key in this || Object.isSealed(this)) {
            return value;
        } else {
            ObservationRecorder.add(this, key);
            return this[key];
        }
    }
    var getSchemaSymbol = canSymbol.for('can.getSchema');
    function getSchema() {
        var def = this.prototype._define;
        var definitions = def ? def.definitions : {};
        var schema = {
            type: 'map',
            identity: [],
            keys: {}
        };
        return define.updateSchemaKeys(schema, definitions);
    }
    var sealedSetup = function (props) {
        define.setup.call(this, props || {}, this.constructor.seal);
    };
    var DefineMap = Construct.extend('DefineMap', {
        setup: function (base) {
            var key, prototype = this.prototype;
            if (DefineMap) {
                var result = define(prototype, prototype, base.prototype._define);
                define.makeDefineInstanceKey(this, result);
                addTypeEvents(this);
                for (key in DefineMap.prototype) {
                    define.defineConfigurableAndNotEnumerable(prototype, key, prototype[key]);
                }
                if (prototype.setup === DefineMap.prototype.setup) {
                    define.defineConfigurableAndNotEnumerable(prototype, 'setup', sealedSetup);
                }
                var _computedGetter = Object.getOwnPropertyDescriptor(prototype, '_computed').get;
                Object.defineProperty(prototype, '_computed', {
                    configurable: true,
                    enumerable: false,
                    get: function () {
                        if (this === prototype) {
                            return;
                        }
                        return _computedGetter.call(this, arguments);
                    }
                });
            } else {
                for (key in prototype) {
                    define.defineConfigurableAndNotEnumerable(prototype, key, prototype[key]);
                }
            }
            define.defineConfigurableAndNotEnumerable(prototype, 'constructor', this);
            this[getSchemaSymbol] = getSchema;
        }
    }, {
        setup: function (props, sealed) {
            if (!this._define) {
                Object.defineProperty(this, '_define', {
                    enumerable: false,
                    value: { definitions: {} }
                });
                Object.defineProperty(this, '_data', {
                    enumerable: false,
                    value: {}
                });
            }
            define.setup.call(this, props || {}, sealed === true);
        },
        get: function (prop) {
            if (prop) {
                return getKeyValue.call(this, prop);
            } else {
                return canReflect.unwrap(this, Map);
            }
        },
        set: function (prop, value) {
            if (typeof prop === 'object') {
                if (value === true) {
                    updateDeep.call(this, prop);
                } else {
                    assignDeep.call(this, prop);
                }
            } else {
                setKeyValue.call(this, prop, value);
            }
            return this;
        },
        assignDeep: function (prop) {
            assignDeep.call(this, prop);
            return this;
        },
        updateDeep: function (prop) {
            updateDeep.call(this, prop);
            return this;
        },
        assign: function (prop) {
            assign.call(this, prop);
            return this;
        },
        update: function (prop) {
            update.call(this, prop);
            return this;
        },
        serialize: function () {
            return canReflect.serialize(this, Map);
        },
        deleteKey: defineHelpers.deleteKey,
        forEach: function () {
            var forEach = function (list, cb, thisarg) {
                    return canReflect.eachKey(list, cb, thisarg);
                }, noObserve = ObservationRecorder.ignore(forEach);
            return function (cb, thisarg, observe) {
                return observe === false ? noObserve(this, cb, thisarg) : forEach(this, cb, thisarg);
            };
        }(),
        '*': { type: define.types.observable }
    });
    var defineMapProto = {
        'can.isMapLike': true,
        'can.isListLike': false,
        'can.isValueLike': false,
        'can.getKeyValue': getKeyValue,
        'can.setKeyValue': setKeyValue,
        'can.deleteKeyValue': defineHelpers.deleteKey,
        'can.getOwnKeys': function () {
            var keys = canReflect.getOwnEnumerableKeys(this);
            if (this._computed) {
                var computedKeys = canReflect.getOwnKeys(this._computed);
                var key;
                for (var i = 0; i < computedKeys.length; i++) {
                    key = computedKeys[i];
                    if (keys.indexOf(key) < 0) {
                        keys.push(key);
                    }
                }
            }
            return keys;
        },
        'can.getOwnEnumerableKeys': function () {
            ObservationRecorder.add(this, 'can.keys');
            ObservationRecorder.add(Object.getPrototypeOf(this), 'can.keys');
            return keysForDefinition(this._define.definitions).concat(keysForDefinition(this._instanceDefinitions));
        },
        'can.hasOwnKey': function (key) {
            return Object.hasOwnProperty.call(this._define.definitions, key) || this._instanceDefinitions !== undefined && Object.hasOwnProperty.call(this._instanceDefinitions, key);
        },
        'can.hasKey': function (key) {
            return key in this._define.definitions || this._instanceDefinitions !== undefined && key in this._instanceDefinitions;
        },
        'can.assignDeep': assignDeep,
        'can.updateDeep': updateDeep,
        'can.unwrap': defineHelpers.reflectUnwrap,
        'can.serialize': defineHelpers.reflectSerialize,
        'can.keyHasDependencies': function (key) {
            return !!(this._computed && this._computed[key] && this._computed[key].compute);
        },
        'can.getKeyDependencies': function (key) {
            var ret;
            if (this._computed && this._computed[key] && this._computed[key].compute) {
                ret = {};
                ret.valueDependencies = new Set();
                ret.valueDependencies.add(this._computed[key].compute);
            }
            return ret;
        }
    };
    canReflect.assignSymbols(DefineMap.prototype, defineMapProto);
    canReflect.setKeyValue(DefineMap.prototype, canSymbol.iterator, function () {
        return new define.Iterator(this);
    });
    for (var prop in define.eventsProto) {
        DefineMap[prop] = define.eventsProto[prop];
        Object.defineProperty(DefineMap.prototype, prop, {
            enumerable: false,
            value: define.eventsProto[prop],
            writable: true
        });
    }
    function getSymbolsForIE(obj) {
        return Object.getOwnPropertyNames(obj).filter(function (name) {
            return name.indexOf('@@symbol') === 0;
        });
    }
    var eventsProtoSymbols = 'getOwnPropertySymbols' in Object ? Object.getOwnPropertySymbols(define.eventsProto) : getSymbolsForIE(define.eventsProto);
    eventsProtoSymbols.forEach(function (sym) {
        Object.defineProperty(DefineMap.prototype, sym, {
            configurable: true,
            enumerable: false,
            value: define.eventsProto[sym],
            writable: true
        });
    });
    define.DefineMap = DefineMap;
    Object.defineProperty(DefineMap.prototype, 'toObject', {
        enumerable: false,
        writable: true,
        value: function () {
            canLog.warn('Use DefineMap::get instead of DefineMap::toObject');
            return this.get();
        }
    });
    module.exports = ns.DefineMap = DefineMap;
});
/*can-globals@1.2.1#location/location*/
define('can-globals@1.2.1#location/location', [
    'require',
    'exports',
    'module',
    'can-globals/global/global',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        require('can-globals/global/global');
        var globals = require('can-globals/can-globals-instance');
        globals.define('location', function () {
            return globals.getKeyValue('global').location;
        });
        module.exports = globals.makeExport('location');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#mutation-observer/mutation-observer*/
define('can-globals@1.2.1#mutation-observer/mutation-observer', [
    'require',
    'exports',
    'module',
    'can-globals/global/global',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        require('can-globals/global/global');
        var globals = require('can-globals/can-globals-instance');
        globals.define('MutationObserver', function () {
            var GLOBAL = globals.getKeyValue('global');
            return GLOBAL.MutationObserver || GLOBAL.WebKitMutationObserver || GLOBAL.MozMutationObserver;
        });
        module.exports = globals.makeExport('MutationObserver');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#custom-elements/custom-elements*/
define('can-globals@1.2.1#custom-elements/custom-elements', [
    'require',
    'exports',
    'module',
    'can-globals/global/global',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        require('can-globals/global/global');
        var globals = require('can-globals/can-globals-instance');
        globals.define('customElements', function () {
            var GLOBAL = globals.getKeyValue('global');
            return GLOBAL.customElements;
        });
        module.exports = globals.makeExport('customElements');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#can-globals*/
define('can-globals@1.2.1#can-globals', [
    'require',
    'exports',
    'module',
    'can-globals/can-globals-instance',
    './global/global',
    './document/document',
    './location/location',
    './mutation-observer/mutation-observer',
    './is-browser-window/is-browser-window',
    './is-node/is-node',
    './custom-elements/custom-elements'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals/can-globals-instance');
        require('./global/global');
        require('./document/document');
        require('./location/location');
        require('./mutation-observer/mutation-observer');
        require('./is-browser-window/is-browser-window');
        require('./is-node/is-node');
        require('./custom-elements/custom-elements');
        module.exports = globals;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-debug@2.0.5#src/proxy-namespace*/
define('can-debug@2.0.5#src/proxy-namespace', function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var warned = false;
        module.exports = function proxyNamespace(namespace) {
            return new Proxy(namespace, {
                get: function get(target, name) {
                    if (!warned) {
                        console.warn('Warning: use of \'can\' global should be for debugging purposes only.');
                        warned = true;
                    }
                    return target[name];
                }
            });
        };
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-debug@2.0.5#src/temporarily-bind*/
define('can-debug@2.0.5#src/temporarily-bind', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var onValueSymbol = canSymbol.for('can.onValue');
    var offValueSymbol = canSymbol.for('can.offValue');
    var onKeyValueSymbol = canSymbol.for('can.onKeyValue');
    var offKeyValueSymbol = canSymbol.for('can.offKeyValue');
    var noop = function noop() {
    };
    function isFunction(value) {
        return typeof value === 'function';
    }
    function withKey(obj, key, fn) {
        var result;
        if (isFunction(obj[onKeyValueSymbol])) {
            canReflect.onKeyValue(obj, key, noop);
        }
        result = fn(obj, key);
        if (isFunction(obj[offKeyValueSymbol])) {
            canReflect.offKeyValue(obj, key, noop);
        }
        return result;
    }
    function withoutKey(obj, fn) {
        var result;
        if (isFunction(obj[onValueSymbol])) {
            canReflect.onValue(obj, noop);
        }
        result = fn(obj);
        if (isFunction(obj[offValueSymbol])) {
            canReflect.offValue(obj, noop);
        }
        return result;
    }
    module.exports = function temporarilyBind(fn) {
        return function (obj, key) {
            var gotKey = arguments.length === 2;
            return gotKey ? withKey(obj, key, fn) : withoutKey(obj, fn);
        };
    };
});
/*can-debug@2.0.5#src/graph/graph*/
define('can-debug@2.0.5#src/graph/graph', [
    'require',
    'exports',
    'module',
    'can-assign'
], function (require, exports, module) {
    'use strict';
    var canAssign = require('can-assign');
    function Graph() {
        this.nodes = [];
        this.arrows = new Map();
        this.arrowsMeta = new Map();
    }
    Graph.prototype.addNode = function addNode(node) {
        this.nodes.push(node);
        this.arrows.set(node, new Set());
    };
    Graph.prototype.addArrow = function addArrow(head, tail, meta) {
        var graph = this;
        graph.arrows.get(head).add(tail);
        if (meta) {
            addArrowMeta(graph, head, tail, meta);
        }
    };
    Graph.prototype.hasArrow = function hasArrow(head, tail) {
        return this.getNeighbors(head).has(tail);
    };
    Graph.prototype.getArrowMeta = function getArrowMeta(head, tail) {
        return this.arrowsMeta.get(head) && this.arrowsMeta.get(head).get(tail);
    };
    Graph.prototype.setArrowMeta = function setArrowMeta(head, tail, meta) {
        addArrowMeta(this, head, tail, meta);
    };
    Graph.prototype.getNeighbors = function getNeighbors(node) {
        return this.arrows.get(node);
    };
    Graph.prototype.findNode = function findNode(cb) {
        var found = null;
        var graph = this;
        var i, node;
        for (i = 0; i < graph.nodes.length; i++) {
            node = graph.nodes[i];
            if (cb(node)) {
                found = node;
                break;
            }
        }
        return found;
    };
    Graph.prototype.bfs = function bfs(visit) {
        var graph = this;
        var node = graph.nodes[0];
        var queue = [node];
        var visited = new Map();
        visited.set(node, true);
        while (queue.length) {
            node = queue.shift();
            visit(node);
            graph.arrows.get(node).forEach(function (adj) {
                if (!visited.has(adj)) {
                    queue.push(adj);
                    visited.set(adj, true);
                }
            });
        }
    };
    Graph.prototype.dfs = function dfs(visit) {
        var graph = this;
        var node = graph.nodes[0];
        var stack = [node];
        var visited = new Map();
        while (stack.length) {
            node = stack.pop();
            visit(node);
            if (!visited.has(node)) {
                visited.set(node, true);
                graph.arrows.get(node).forEach(function (adj) {
                    stack.push(adj);
                });
            }
        }
    };
    Graph.prototype.reverse = function reverse() {
        var graph = this;
        var reversed = new Graph();
        graph.nodes.forEach(reversed.addNode.bind(reversed));
        graph.nodes.forEach(function (node) {
            graph.getNeighbors(node).forEach(function (adj) {
                var meta = graph.getArrowMeta(node, adj);
                reversed.addArrow(adj, node, meta);
            });
        });
        return reversed;
    };
    function addArrowMeta(graph, head, tail, meta) {
        var entry = graph.arrowsMeta.get(head);
        if (entry) {
            var arrowMeta = entry.get(tail);
            if (!arrowMeta) {
                arrowMeta = {};
            }
            entry.set(tail, canAssign(arrowMeta, meta));
        } else {
            entry = new Map();
            entry.set(tail, meta);
            graph.arrowsMeta.set(head, entry);
        }
    }
    module.exports = Graph;
});
/*can-debug@2.0.5#src/get-graph/make-node*/
define('can-debug@2.0.5#src/get-graph/make-node', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    module.exports = function makeNode(obj, key) {
        var gotKey = arguments.length === 2;
        var node = {
            obj: obj,
            name: canReflect.getName(obj),
            value: gotKey ? canReflect.getKeyValue(obj, key) : canReflect.getValue(obj)
        };
        if (gotKey) {
            node.key = key;
        }
        return node;
    };
});
/*can-reflect-dependencies@1.1.1#src/add-mutated-by*/
define('can-reflect-dependencies@1.1.1#src/add-mutated-by', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var makeDependencyRecord = function makeDependencyRecord() {
        return {
            keyDependencies: new Map(),
            valueDependencies: new Set()
        };
    };
    var makeRootRecord = function makeRootRecord() {
        return {
            mutateDependenciesForKey: new Map(),
            mutateDependenciesForValue: makeDependencyRecord()
        };
    };
    module.exports = function (mutatedByMap) {
        return function addMutatedBy(mutated, key, mutator) {
            var gotKey = arguments.length === 3;
            if (arguments.length === 2) {
                mutator = key;
                key = undefined;
            }
            if (!mutator.keyDependencies && !mutator.valueDependencies) {
                var s = new Set();
                s.add(mutator);
                mutator = { valueDependencies: s };
            }
            var root = mutatedByMap.get(mutated);
            if (!root) {
                root = makeRootRecord();
                mutatedByMap.set(mutated, root);
            }
            if (gotKey && !root.mutateDependenciesForKey.get(key)) {
                root.mutateDependenciesForKey.set(key, makeDependencyRecord());
            }
            var dependencyRecord = gotKey ? root.mutateDependenciesForKey.get(key) : root.mutateDependenciesForValue;
            if (mutator.valueDependencies) {
                canReflect.addValues(dependencyRecord.valueDependencies, mutator.valueDependencies);
            }
            if (mutator.keyDependencies) {
                canReflect.each(mutator.keyDependencies, function (keysSet, obj) {
                    var entry = dependencyRecord.keyDependencies.get(obj);
                    if (!entry) {
                        entry = new Set();
                        dependencyRecord.keyDependencies.set(obj, entry);
                    }
                    canReflect.addValues(entry, keysSet);
                });
            }
        };
    };
});
/*can-reflect-dependencies@1.1.1#src/delete-mutated-by*/
define('can-reflect-dependencies@1.1.1#src/delete-mutated-by', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    module.exports = function (mutatedByMap) {
        return function deleteMutatedBy(mutated, key, mutator) {
            var gotKey = arguments.length === 3;
            var root = mutatedByMap.get(mutated);
            if (arguments.length === 2) {
                mutator = key;
                key = undefined;
            }
            if (!mutator.keyDependencies && !mutator.valueDependencies) {
                var s = new Set();
                s.add(mutator);
                mutator = { valueDependencies: s };
            }
            var dependencyRecord = gotKey ? root.mutateDependenciesForKey.get(key) : root.mutateDependenciesForValue;
            if (mutator.valueDependencies) {
                canReflect.removeValues(dependencyRecord.valueDependencies, mutator.valueDependencies);
            }
            if (mutator.keyDependencies) {
                canReflect.each(mutator.keyDependencies, function (keysSet, obj) {
                    var entry = dependencyRecord.keyDependencies.get(obj);
                    if (entry) {
                        canReflect.removeValues(entry, keysSet);
                        if (!entry.size) {
                            dependencyRecord.keyDependencies.delete(obj);
                        }
                    }
                });
            }
        };
    };
});
/*can-reflect-dependencies@1.1.1#src/is-function*/
define('can-reflect-dependencies@1.1.1#src/is-function', function (require, exports, module) {
    'use strict';
    module.exports = function isFunction(value) {
        return typeof value === 'function';
    };
});
/*can-reflect-dependencies@1.1.1#src/get-dependency-data-of*/
define('can-reflect-dependencies@1.1.1#src/get-dependency-data-of', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect',
    './is-function',
    'can-assign'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var isFunction = require('./is-function');
    var canAssign = require('can-assign');
    var getWhatIChangeSymbol = canSymbol.for('can.getWhatIChange');
    var getKeyDependenciesSymbol = canSymbol.for('can.getKeyDependencies');
    var getValueDependenciesSymbol = canSymbol.for('can.getValueDependencies');
    var getKeyDependencies = function getKeyDependencies(obj, key) {
        if (isFunction(obj[getKeyDependenciesSymbol])) {
            return canReflect.getKeyDependencies(obj, key);
        }
    };
    var getValueDependencies = function getValueDependencies(obj) {
        if (isFunction(obj[getValueDependenciesSymbol])) {
            return canReflect.getValueDependencies(obj);
        }
    };
    var getMutatedKeyDependencies = function getMutatedKeyDependencies(mutatedByMap, obj, key) {
        var root = mutatedByMap.get(obj);
        var dependencyRecord;
        if (root && root.mutateDependenciesForKey.has(key)) {
            dependencyRecord = root.mutateDependenciesForKey.get(key);
        }
        return dependencyRecord;
    };
    var getMutatedValueDependencies = function getMutatedValueDependencies(mutatedByMap, obj) {
        var result;
        var root = mutatedByMap.get(obj);
        if (root) {
            var dependencyRecord = root.mutateDependenciesForValue;
            if (dependencyRecord.keyDependencies.size) {
                result = result || {};
                result.keyDependencies = dependencyRecord.keyDependencies;
            }
            if (dependencyRecord.valueDependencies.size) {
                result = result || {};
                result.valueDependencies = dependencyRecord.valueDependencies;
            }
        }
        return result;
    };
    var getWhatIChange = function getWhatIChange(obj, key) {
        if (isFunction(obj[getWhatIChangeSymbol])) {
            var gotKey = arguments.length === 2;
            return gotKey ? canReflect.getWhatIChange(obj, key) : canReflect.getWhatIChange(obj);
        }
    };
    var isEmptyRecord = function isEmptyRecord(record) {
        return record == null || !Object.keys(record).length || record.keyDependencies && !record.keyDependencies.size && (record.valueDependencies && !record.valueDependencies.size);
    };
    var getWhatChangesMe = function getWhatChangesMe(mutatedByMap, obj, key) {
        var gotKey = arguments.length === 3;
        var mutate = gotKey ? getMutatedKeyDependencies(mutatedByMap, obj, key) : getMutatedValueDependencies(mutatedByMap, obj);
        var derive = gotKey ? getKeyDependencies(obj, key) : getValueDependencies(obj);
        if (!isEmptyRecord(mutate) || !isEmptyRecord(derive)) {
            return canAssign(canAssign({}, mutate ? { mutate: mutate } : null), derive ? { derive: derive } : null);
        }
    };
    module.exports = function (mutatedByMap) {
        return function getDependencyDataOf(obj, key) {
            var gotKey = arguments.length === 2;
            var whatChangesMe = gotKey ? getWhatChangesMe(mutatedByMap, obj, key) : getWhatChangesMe(mutatedByMap, obj);
            var whatIChange = gotKey ? getWhatIChange(obj, key) : getWhatIChange(obj);
            if (whatChangesMe || whatIChange) {
                return canAssign(canAssign({}, whatIChange ? { whatIChange: whatIChange } : null), whatChangesMe ? { whatChangesMe: whatChangesMe } : null);
            }
        };
    };
});
/*can-reflect-dependencies@1.1.1#can-reflect-dependencies*/
define('can-reflect-dependencies@1.1.1#can-reflect-dependencies', [
    'require',
    'exports',
    'module',
    './src/add-mutated-by',
    './src/delete-mutated-by',
    './src/get-dependency-data-of'
], function (require, exports, module) {
    'use strict';
    var addMutatedBy = require('./src/add-mutated-by');
    var deleteMutatedBy = require('./src/delete-mutated-by');
    var getDependencyDataOf = require('./src/get-dependency-data-of');
    var mutatedByMap = new WeakMap();
    module.exports = {
        addMutatedBy: addMutatedBy(mutatedByMap),
        deleteMutatedBy: deleteMutatedBy(mutatedByMap),
        getDependencyDataOf: getDependencyDataOf(mutatedByMap)
    };
});
/*can-debug@2.0.5#src/get-graph/get-graph*/
define('can-debug@2.0.5#src/get-graph/get-graph', [
    'require',
    'exports',
    'module',
    '../graph/graph',
    './make-node',
    'can-reflect',
    'can-reflect-dependencies'
], function (require, exports, module) {
    'use strict';
    var Graph = require('../graph/graph');
    var makeNode = require('./make-node');
    var canReflect = require('can-reflect');
    var mutateDeps = require('can-reflect-dependencies');
    module.exports = function getGraph(obj, key) {
        var order = 0;
        var graph = new Graph();
        var gotKey = arguments.length === 2;
        var addArrow = function addArrow(direction, parent, child, meta) {
            switch (direction) {
            case 'whatIChange':
                graph.addArrow(parent, child, meta);
                break;
            case 'whatChangesMe':
                graph.addArrow(child, parent, meta);
                break;
            default:
                throw new Error('Unknown direction value: ', meta.direction);
            }
        };
        var visitKeyDependencies = function visitKeyDependencies(source, meta, cb) {
            canReflect.eachKey(source.keyDependencies || {}, function (keys, obj) {
                canReflect.each(keys, function (key) {
                    cb(obj, meta, key);
                });
            });
        };
        var visitValueDependencies = function visitValueDependencies(source, meta, cb) {
            canReflect.eachIndex(source.valueDependencies || [], function (obj) {
                cb(obj, meta);
            });
        };
        var visit = function visit(obj, meta, key) {
            var gotKey = arguments.length === 3;
            var node = graph.findNode(function (node) {
                return gotKey ? node.obj === obj && node.key === key : node.obj === obj;
            });
            if (node) {
                if (meta.parent) {
                    addArrow(meta.direction, meta.parent, node, {
                        kind: meta.kind,
                        direction: meta.direction
                    });
                }
                return graph;
            }
            order += 1;
            node = gotKey ? makeNode(obj, key) : makeNode(obj);
            node.order = order;
            graph.addNode(node);
            if (meta.parent) {
                addArrow(meta.direction, meta.parent, node, {
                    kind: meta.kind,
                    direction: meta.direction
                });
            }
            var nextMeta;
            var data = gotKey ? mutateDeps.getDependencyDataOf(obj, key) : mutateDeps.getDependencyDataOf(obj);
            if (data && data.whatIChange) {
                nextMeta = {
                    direction: 'whatIChange',
                    parent: node
                };
                canReflect.eachKey(data.whatIChange, function (dependencyRecord, kind) {
                    nextMeta.kind = kind;
                    visitKeyDependencies(dependencyRecord, nextMeta, visit);
                    visitValueDependencies(dependencyRecord, nextMeta, visit);
                });
            }
            if (data && data.whatChangesMe) {
                nextMeta = {
                    direction: 'whatChangesMe',
                    parent: node
                };
                canReflect.eachKey(data.whatChangesMe, function (dependencyRecord, kind) {
                    nextMeta.kind = kind;
                    visitKeyDependencies(dependencyRecord, nextMeta, visit);
                    visitValueDependencies(dependencyRecord, nextMeta, visit);
                });
            }
            return graph;
        };
        return gotKey ? visit(obj, {}, key) : visit(obj, {});
    };
});
/*can-debug@2.0.5#src/format-graph/format-graph*/
define('can-debug@2.0.5#src/format-graph/format-graph', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-assign'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canAssign = require('can-assign');
    module.exports = function formatGraph(graph) {
        var nodeIdMap = new Map();
        graph.nodes.forEach(function (node, index) {
            nodeIdMap.set(node, index + 1);
        });
        var nodesDataSet = graph.nodes.map(function (node) {
            return {
                shape: 'box',
                id: nodeIdMap.get(node),
                label: canReflect.getName(node.obj) + (node.key ? '.' + node.key : '')
            };
        });
        var getArrowData = function getArrowData(meta) {
            var regular = { arrows: 'to' };
            var withDashes = {
                arrows: 'to',
                dashes: true
            };
            var map = {
                derive: regular,
                mutate: withDashes
            };
            return map[meta.kind];
        };
        var visited = new Map();
        var arrowsDataSet = [];
        graph.nodes.forEach(function (node) {
            var visit = function (node) {
                if (!visited.has(node)) {
                    visited.set(node, true);
                    var arrows = graph.arrows.get(node);
                    var headId = nodeIdMap.get(node);
                    arrows.forEach(function (neighbor) {
                        var tailId = nodeIdMap.get(neighbor);
                        var meta = graph.arrowsMeta.get(node).get(neighbor);
                        arrowsDataSet.push(canAssign({
                            from: headId,
                            to: tailId
                        }, getArrowData(meta)));
                        visit(neighbor);
                    });
                }
            };
            visit(node);
        });
        return {
            nodes: nodesDataSet,
            edges: arrowsDataSet
        };
    };
});
/*can-debug@2.0.5#src/log-data/log-data*/
define('can-debug@2.0.5#src/log-data/log-data', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var quoteString = function quoteString(x) {
        return typeof x === 'string' ? JSON.stringify(x) : x;
    };
    module.exports = function log(data) {
        var node = data.node;
        var nameParts = [
            node.name,
            'key' in node ? '.' + node.key : ''
        ];
        console.group(nameParts.join(''));
        console.log('value  ', quoteString(node.value));
        console.log('object ', node.obj);
        if (data.derive.length) {
            console.group('DERIVED FROM');
            canReflect.eachIndex(data.derive, log);
            console.groupEnd();
        }
        if (data.mutations.length) {
            console.group('MUTATED BY');
            canReflect.eachIndex(data.mutations, log);
            console.groupEnd();
        }
        if (data.twoWay.length) {
            console.group('TWO WAY');
            canReflect.eachIndex(data.twoWay, log);
            console.groupEnd();
        }
        console.groupEnd();
    };
});
/*can-debug@2.0.5#src/label-cycles/label-cycles*/
define('can-debug@2.0.5#src/label-cycles/label-cycles', [
    'require',
    'exports',
    'module',
    '../graph/graph'
], function (require, exports, module) {
    'use strict';
    var Graph = require('../graph/graph');
    module.exports = function labelCycles(graph) {
        var visited = new Map();
        var result = new Graph();
        graph.nodes.forEach(function (node) {
            result.addNode(node);
        });
        var visit = function visit(node) {
            visited.set(node, true);
            graph.getNeighbors(node).forEach(function (adj) {
                if (visited.has(adj)) {
                    var isTwoWay = graph.hasArrow(node, adj);
                    if (isTwoWay) {
                        result.addArrow(adj, node, { kind: 'twoWay' });
                    }
                } else {
                    result.addArrow(node, adj, graph.getArrowMeta(node, adj));
                    visit(adj);
                }
            });
        };
        visit(graph.nodes[0]);
        return result;
    };
});
/*can-debug@2.0.5#src/get-data/get-data*/
define('can-debug@2.0.5#src/get-data/get-data', [
    'require',
    'exports',
    'module',
    '../label-cycles/label-cycles'
], function (require, exports, module) {
    'use strict';
    var labelCycles = require('../label-cycles/label-cycles');
    var isDisconnected = function isDisconnected(data) {
        return !data.derive.length && !data.mutations.length && !data.twoWay.length;
    };
    module.exports = function getDebugData(inputGraph, direction) {
        var visited = new Map();
        var graph = labelCycles(direction === 'whatChangesMe' ? inputGraph.reverse() : inputGraph);
        var visit = function visit(node) {
            var data = {
                node: node,
                derive: [],
                mutations: [],
                twoWay: []
            };
            visited.set(node, true);
            graph.getNeighbors(node).forEach(function (adj) {
                var meta = graph.getArrowMeta(node, adj);
                if (!visited.has(adj)) {
                    switch (meta.kind) {
                    case 'twoWay':
                        data.twoWay.push(visit(adj));
                        break;
                    case 'derive':
                        data.derive.push(visit(adj));
                        break;
                    case 'mutate':
                        data.mutations.push(visit(adj));
                        break;
                    default:
                        throw new Error('Unknow meta.kind value: ', meta.kind);
                    }
                }
            });
            return data;
        };
        var result = visit(graph.nodes[0]);
        return isDisconnected(result) ? null : result;
    };
});
/*can-debug@2.0.5#src/what-i-change/what-i-change*/
define('can-debug@2.0.5#src/what-i-change/what-i-change', [
    'require',
    'exports',
    'module',
    '../log-data/log-data',
    '../get-data/get-data',
    '../get-graph/get-graph'
], function (require, exports, module) {
    'use strict';
    var log = require('../log-data/log-data');
    var getData = require('../get-data/get-data');
    var getGraph = require('../get-graph/get-graph');
    module.exports = function logWhatIChange(obj, key) {
        var gotKey = arguments.length === 2;
        var data = getData(gotKey ? getGraph(obj, key) : getGraph(obj), 'whatIChange');
        if (data) {
            log(data);
        }
    };
});
/*can-debug@2.0.5#src/what-changes-me/what-changes-me*/
define('can-debug@2.0.5#src/what-changes-me/what-changes-me', [
    'require',
    'exports',
    'module',
    '../log-data/log-data',
    '../get-data/get-data',
    '../get-graph/get-graph'
], function (require, exports, module) {
    'use strict';
    var log = require('../log-data/log-data');
    var getData = require('../get-data/get-data');
    var getGraph = require('../get-graph/get-graph');
    module.exports = function logWhatChangesMe(obj, key) {
        var gotKey = arguments.length === 2;
        var data = getData(gotKey ? getGraph(obj, key) : getGraph(obj), 'whatChangesMe');
        if (data) {
            log(data);
        }
    };
});
/*can-debug@2.0.5#src/get-what-i-change/get-what-i-change*/
define('can-debug@2.0.5#src/get-what-i-change/get-what-i-change', [
    'require',
    'exports',
    'module',
    '../get-data/get-data',
    '../get-graph/get-graph'
], function (require, exports, module) {
    'use strict';
    var getData = require('../get-data/get-data');
    var getGraph = require('../get-graph/get-graph');
    module.exports = function getWhatChangesMe(obj, key) {
        var gotKey = arguments.length === 2;
        return getData(gotKey ? getGraph(obj, key) : getGraph(obj), 'whatIChange');
    };
});
/*can-debug@2.0.5#src/get-what-changes-me/get-what-changes-me*/
define('can-debug@2.0.5#src/get-what-changes-me/get-what-changes-me', [
    'require',
    'exports',
    'module',
    '../get-data/get-data',
    '../get-graph/get-graph'
], function (require, exports, module) {
    'use strict';
    var getData = require('../get-data/get-data');
    var getGraph = require('../get-graph/get-graph');
    module.exports = function getWhatChangesMe(obj, key) {
        var gotKey = arguments.length === 2;
        return getData(gotKey ? getGraph(obj, key) : getGraph(obj), 'whatChangesMe');
    };
});
/*can-diff@1.4.4#list/list*/
define('can-diff@1.4.4#list/list', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var slice = [].slice;
    function defaultIdentity(a, b) {
        return a === b;
    }
    function makeIdentityFromMapSchema(typeSchema) {
        if (typeSchema.identity && typeSchema.identity.length) {
            return function identityCheck(a, b) {
                var aId = canReflect.getIdentity(a, typeSchema), bId = canReflect.getIdentity(b, typeSchema);
                return aId === bId;
            };
        } else {
            return defaultIdentity;
        }
    }
    function makeIdentityFromListSchema(listSchema) {
        return listSchema.values != null ? makeIdentityFromMapSchema(canReflect.getSchema(listSchema.values)) : defaultIdentity;
    }
    function makeIdentity(oldList, oldListLength) {
        var listSchema = canReflect.getSchema(oldList), typeSchema;
        if (listSchema != null) {
            if (listSchema.values != null) {
                typeSchema = canReflect.getSchema(listSchema.values);
            } else {
                return defaultIdentity;
            }
        }
        if (typeSchema == null && oldListLength > 0) {
            typeSchema = canReflect.getSchema(canReflect.getKeyValue(oldList, 0));
        }
        if (typeSchema) {
            return makeIdentityFromMapSchema(typeSchema);
        } else {
            return defaultIdentity;
        }
    }
    function reverseDiff(oldDiffStopIndex, newDiffStopIndex, oldList, newList, identity) {
        var oldIndex = oldList.length - 1, newIndex = newList.length - 1;
        while (oldIndex > oldDiffStopIndex && newIndex > newDiffStopIndex) {
            var oldItem = oldList[oldIndex], newItem = newList[newIndex];
            if (identity(oldItem, newItem, oldIndex)) {
                oldIndex--;
                newIndex--;
                continue;
            } else {
                return [{
                        type: 'splice',
                        index: newDiffStopIndex,
                        deleteCount: oldIndex - oldDiffStopIndex + 1,
                        insert: slice.call(newList, newDiffStopIndex, newIndex + 1)
                    }];
            }
        }
        return [{
                type: 'splice',
                index: newDiffStopIndex,
                deleteCount: oldIndex - oldDiffStopIndex + 1,
                insert: slice.call(newList, newDiffStopIndex, newIndex + 1)
            }];
    }
    module.exports = function (oldList, newList, schemaOrIdentity) {
        var oldIndex = 0, newIndex = 0, oldLength = canReflect.size(oldList), newLength = canReflect.size(newList), patches = [];
        var schemaType = typeof schemaOrIdentity, identity;
        if (schemaType === 'function') {
            identity = schemaOrIdentity;
        } else if (schemaOrIdentity != null) {
            if (schemaOrIdentity.type === 'map') {
                identity = makeIdentityFromMapSchema(schemaOrIdentity);
            } else {
                identity = makeIdentityFromListSchema(schemaOrIdentity);
            }
        } else {
            identity = makeIdentity(oldList, oldLength);
        }
        while (oldIndex < oldLength && newIndex < newLength) {
            var oldItem = oldList[oldIndex], newItem = newList[newIndex];
            if (identity(oldItem, newItem, oldIndex)) {
                oldIndex++;
                newIndex++;
                continue;
            }
            if (newIndex + 1 < newLength && identity(oldItem, newList[newIndex + 1], oldIndex)) {
                patches.push({
                    index: newIndex,
                    deleteCount: 0,
                    insert: [newList[newIndex]],
                    type: 'splice'
                });
                oldIndex++;
                newIndex += 2;
                continue;
            } else if (oldIndex + 1 < oldLength && identity(oldList[oldIndex + 1], newItem, oldIndex + 1)) {
                patches.push({
                    index: newIndex,
                    deleteCount: 1,
                    insert: [],
                    type: 'splice'
                });
                oldIndex += 2;
                newIndex++;
                continue;
            } else {
                patches.push.apply(patches, reverseDiff(oldIndex, newIndex, oldList, newList, identity));
                return patches;
            }
        }
        if (newIndex === newLength && oldIndex === oldLength) {
            return patches;
        }
        patches.push({
            type: 'splice',
            index: newIndex,
            deleteCount: oldLength - oldIndex,
            insert: slice.call(newList, newIndex)
        });
        return patches;
    };
});
/*can-diff@1.4.4#merge-deep/merge-deep*/
define('can-diff@1.4.4#merge-deep/merge-deep', [
    'require',
    'exports',
    'module',
    'can-reflect',
    '../list/list'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var diffList = require('../list/list');
    function smartMerge(instance, props) {
        props = canReflect.serialize(props);
        if (canReflect.isMoreListLikeThanMapLike(instance)) {
            mergeList(instance, props);
        } else {
            mergeMap(instance, props);
        }
        return instance;
    }
    function mergeMap(instance, data) {
        canReflect.eachKey(instance, function (value, prop) {
            if (!canReflect.hasKey(data, prop)) {
                canReflect.deleteKeyValue(instance, prop);
                return;
            }
            var newValue = canReflect.getKeyValue(data, prop);
            canReflect.deleteKeyValue(data, prop);
            if (canReflect.isPrimitive(value)) {
                canReflect.setKeyValue(instance, prop, newValue);
                return;
            }
            var newValueIsList = Array.isArray(newValue), currentValueIsList = canReflect.isMoreListLikeThanMapLike(value);
            if (currentValueIsList && newValueIsList) {
                mergeList(value, newValue);
            } else if (!newValueIsList && !currentValueIsList && canReflect.isMapLike(value) && canReflect.isPlainObject(newValue)) {
                var schema = canReflect.getSchema(value);
                if (schema && schema.identity && schema.identity.length) {
                    var id = canReflect.getIdentity(value, schema);
                    if (id != null && id === canReflect.getIdentity(newValue, schema)) {
                        mergeMap(value, newValue);
                        return;
                    }
                }
                canReflect.setKeyValue(instance, prop, canReflect.new(value.constructor, newValue));
            } else {
                canReflect.setKeyValue(instance, prop, newValue);
            }
        });
        canReflect.eachKey(data, function (value, prop) {
            canReflect.setKeyValue(instance, prop, value);
        });
    }
    function mergeList(list, data) {
        var ItemType, itemSchema;
        var listSchema = canReflect.getSchema(list);
        if (listSchema) {
            ItemType = listSchema.values;
        }
        if (ItemType) {
            itemSchema = canReflect.getSchema(ItemType);
        }
        if (!itemSchema && canReflect.size(list) > 0) {
            itemSchema = canReflect.getSchema(canReflect.getKeyValue(list, 0));
        }
        var identity;
        if (itemSchema && itemSchema.identity && itemSchema.identity.length) {
            identity = function (a, b) {
                var aId = canReflect.getIdentity(a, itemSchema), bId = canReflect.getIdentity(b, itemSchema);
                var eq = aId === bId;
                if (eq) {
                    mergeMap(a, b);
                }
                return eq;
            };
        } else {
            identity = function (a, b) {
                var eq = a === b;
                if (eq) {
                    if (!canReflect.isPrimitive(a)) {
                        mergeMap(a, b);
                    }
                }
                return eq;
            };
        }
        var patches = diffList(list, data, identity);
        var hydrate = ItemType ? canReflect.new.bind(canReflect, ItemType) : function (v) {
            return v;
        };
        if (!patches.length) {
            return list;
        }
        patches.forEach(function (patch) {
            applyPatch(list, patch, hydrate);
        });
    }
    function applyPatch(list, patch, makeInstance) {
        var insert = makeInstance && patch.insert.map(function (val) {
            return makeInstance(val);
        }) || patch.insert;
        var args = [
            patch.index,
            patch.deleteCount
        ].concat(insert);
        list.splice.apply(list, args);
        return list;
    }
    smartMerge.applyPatch = applyPatch;
    module.exports = smartMerge;
});
/*can-debug@2.0.5#can-debug*/
define('can-debug@2.0.5#can-debug', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-globals',
    './src/proxy-namespace',
    './src/temporarily-bind',
    './src/get-graph/get-graph',
    './src/format-graph/format-graph',
    './src/what-i-change/what-i-change',
    './src/what-changes-me/what-changes-me',
    './src/get-what-i-change/get-what-i-change',
    './src/get-what-changes-me/get-what-changes-me',
    'can-symbol',
    'can-reflect',
    'can-queues',
    'can-diff/merge-deep/merge-deep'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var globals = require('can-globals');
        var proxyNamespace = require('./src/proxy-namespace');
        var temporarilyBind = require('./src/temporarily-bind');
        var getGraph = require('./src/get-graph/get-graph');
        var formatGraph = require('./src/format-graph/format-graph');
        var logWhatIChange = require('./src/what-i-change/what-i-change');
        var logWhatChangesMe = require('./src/what-changes-me/what-changes-me');
        var getWhatIChange = require('./src/get-what-i-change/get-what-i-change');
        var getWhatChangesMe = require('./src/get-what-changes-me/get-what-changes-me');
        var canSymbol = require('can-symbol');
        var canReflect = require('can-reflect');
        var canQueues = require('can-queues');
        var mergeDeep = require('can-diff/merge-deep/merge-deep');
        var global = globals.getKeyValue('global');
        var devtoolsRegistrationComplete = false;
        function registerWithDevtools() {
            if (devtoolsRegistrationComplete) {
                return;
            }
            var devtoolsGlobalName = '__CANJS_DEVTOOLS__';
            var devtoolsCanModules = {
                Symbol: canSymbol,
                Reflect: canReflect,
                queues: canQueues,
                getGraph: namespace.debug.getGraph,
                formatGraph: namespace.debug.formatGraph,
                mergeDeep: mergeDeep
            };
            if (global[devtoolsGlobalName]) {
                global[devtoolsGlobalName].register(devtoolsCanModules);
            } else {
                Object.defineProperty(global, devtoolsGlobalName, {
                    set: function (devtoolsGlobal) {
                        Object.defineProperty(global, devtoolsGlobalName, { value: devtoolsGlobal });
                        devtoolsGlobal.register(devtoolsCanModules);
                    },
                    configurable: true
                });
            }
            devtoolsRegistrationComplete = true;
        }
        module.exports = function () {
            namespace.debug = {
                getGraph: temporarilyBind(getGraph),
                formatGraph: temporarilyBind(formatGraph),
                getWhatIChange: temporarilyBind(getWhatIChange),
                getWhatChangesMe: temporarilyBind(getWhatChangesMe),
                logWhatIChange: temporarilyBind(logWhatIChange),
                logWhatChangesMe: temporarilyBind(logWhatChangesMe)
            };
            registerWithDevtools();
            global.can = typeof Proxy !== 'undefined' ? proxyNamespace(namespace) : namespace;
            return namespace.debug;
        };
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can@5.21.4#enable-can-debug*/
define('can@5.21.4#enable-can-debug', ['can-debug@2.0.5#can-debug'], function (_canDebug) {
    'use strict';
    var _canDebug2 = _interopRequireDefault(_canDebug);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
});
/*can-reflect-promise@2.2.0#can-reflect-promise*/
define('can-reflect-promise@2.2.0#can-reflect-promise', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    'can-observation-recorder',
    'can-queues',
    'can-key-tree',
    'can-log/dev/dev'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var ObservationRecorder = require('can-observation-recorder');
    var queues = require('can-queues');
    var KeyTree = require('can-key-tree');
    var dev = require('can-log/dev/dev');
    var getKeyValueSymbol = canSymbol.for('can.getKeyValue'), observeDataSymbol = canSymbol.for('can.meta');
    var promiseDataPrototype = {
        isPending: true,
        state: 'pending',
        isResolved: false,
        isRejected: false,
        value: undefined,
        reason: undefined
    };
    function setVirtualProp(promise, property, value) {
        var observeData = promise[observeDataSymbol];
        var old = observeData[property];
        observeData[property] = value;
        queues.enqueueByQueue(observeData.handlers.getNode([property]), promise, [
            value,
            old
        ], function () {
            return {};
        }, [
            'Promise',
            promise,
            'resolved with value',
            value,
            'and changed virtual property: ' + property
        ]);
    }
    function initPromise(promise) {
        var observeData = promise[observeDataSymbol];
        if (!observeData) {
            Object.defineProperty(promise, observeDataSymbol, {
                enumerable: false,
                configurable: false,
                writable: false,
                value: Object.create(promiseDataPrototype)
            });
            observeData = promise[observeDataSymbol];
            observeData.handlers = new KeyTree([
                Object,
                Object,
                Array
            ]);
        }
        promise.then(function (value) {
            queues.batch.start();
            setVirtualProp(promise, 'isPending', false);
            setVirtualProp(promise, 'isResolved', true);
            setVirtualProp(promise, 'value', value);
            setVirtualProp(promise, 'state', 'resolved');
            queues.batch.stop();
        }, function (reason) {
            queues.batch.start();
            setVirtualProp(promise, 'isPending', false);
            setVirtualProp(promise, 'isRejected', true);
            setVirtualProp(promise, 'reason', reason);
            setVirtualProp(promise, 'state', 'rejected');
            queues.batch.stop();
        });
    }
    function setupPromise(value) {
        var oldPromiseFn;
        var proto = 'getPrototypeOf' in Object ? Object.getPrototypeOf(value) : value.__proto__;
        if (value[getKeyValueSymbol] && value[observeDataSymbol]) {
            return;
        }
        if (proto === null || proto === Object.prototype) {
            proto = value;
            if (typeof proto.promise === 'function') {
                oldPromiseFn = proto.promise;
                proto.promise = function () {
                    var result = oldPromiseFn.call(proto);
                    setupPromise(result);
                    return result;
                };
            }
        }
        canReflect.assignSymbols(proto, {
            'can.getKeyValue': function (key) {
                if (!this[observeDataSymbol]) {
                    initPromise(this);
                }
                ObservationRecorder.add(this, key);
                switch (key) {
                case 'state':
                case 'isPending':
                case 'isResolved':
                case 'isRejected':
                case 'value':
                case 'reason':
                    return this[observeDataSymbol][key];
                default:
                    return this[key];
                }
            },
            'can.getValue': function () {
                return this[getKeyValueSymbol]('value');
            },
            'can.isValueLike': false,
            'can.onKeyValue': function (key, handler, queue) {
                if (!this[observeDataSymbol]) {
                    initPromise(this);
                }
                this[observeDataSymbol].handlers.add([
                    key,
                    queue || 'mutate',
                    handler
                ]);
            },
            'can.offKeyValue': function (key, handler, queue) {
                if (!this[observeDataSymbol]) {
                    initPromise(this);
                }
                this[observeDataSymbol].handlers.delete([
                    key,
                    queue || 'mutate',
                    handler
                ]);
            },
            'can.hasOwnKey': function (key) {
                if (!this[observeDataSymbol]) {
                    initPromise(this);
                }
                return key in this[observeDataSymbol];
            }
        });
    }
    module.exports = setupPromise;
});
/*can-stache-key@1.4.0#can-stache-key*/
define('can-stache-key@1.4.0#can-stache-key', [
    'require',
    'exports',
    'module',
    'can-observation-recorder',
    'can-log/dev/dev',
    'can-symbol',
    'can-reflect',
    'can-reflect-promise'
], function (require, exports, module) {
    'use strict';
    var ObservationRecorder = require('can-observation-recorder');
    var dev = require('can-log/dev/dev');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var canReflectPromise = require('can-reflect-promise');
    var getValueSymbol = canSymbol.for('can.getValue');
    var setValueSymbol = canSymbol.for('can.setValue');
    var isValueLikeSymbol = canSymbol.for('can.isValueLike');
    var peek = ObservationRecorder.ignore(canReflect.getKeyValue.bind(canReflect));
    var observeReader;
    var bindName = Function.prototype.bind;
    var isAt = function (index, reads) {
        var prevRead = reads[index - 1];
        return prevRead && prevRead.at;
    };
    var readValue = function (value, index, reads, options, state, prev) {
        var usedValueReader;
        do {
            usedValueReader = false;
            for (var i = 0, len = observeReader.valueReaders.length; i < len; i++) {
                if (observeReader.valueReaders[i].test(value, index, reads, options)) {
                    value = observeReader.valueReaders[i].read(value, index, reads, options, state, prev);
                }
            }
        } while (usedValueReader);
        return value;
    };
    var specialRead = {
        index: true,
        key: true,
        event: true,
        element: true,
        viewModel: true
    };
    var checkForObservableAndNotify = function (options, state, getObserves, value, index) {
        if (options.foundObservable && !state.foundObservable) {
            if (ObservationRecorder.trapsCount()) {
                ObservationRecorder.addMany(getObserves());
                options.foundObservable(value, index);
                state.foundObservable = true;
            }
        }
    };
    var objHasKeyAtIndex = function (obj, reads, index) {
        return !!(reads && reads.length && canReflect.hasKey(obj, reads[index].key));
    };
    observeReader = {
        read: function (parent, reads, options) {
            options = options || {};
            var state = { foundObservable: false };
            var getObserves;
            if (options.foundObservable) {
                getObserves = ObservationRecorder.trap();
            }
            var cur = readValue(parent, 0, reads, options, state), type, prev, readLength = reads.length, i = 0, last, parentHasKey;
            checkForObservableAndNotify(options, state, getObserves, parent, 0);
            while (i < readLength) {
                prev = cur;
                for (var r = 0, readersLength = observeReader.propertyReaders.length; r < readersLength; r++) {
                    var reader = observeReader.propertyReaders[r];
                    if (reader.test(cur)) {
                        cur = reader.read(cur, reads[i], i, options, state);
                        break;
                    }
                }
                checkForObservableAndNotify(options, state, getObserves, prev, i);
                last = cur;
                i = i + 1;
                cur = readValue(cur, i, reads, options, state, prev);
                checkForObservableAndNotify(options, state, getObserves, prev, i - 1);
                type = typeof cur;
                if (i < reads.length && (cur === null || cur === undefined)) {
                    parentHasKey = objHasKeyAtIndex(prev, reads, i - 1);
                    if (options.earlyExit && !parentHasKey) {
                        options.earlyExit(prev, i - 1, cur);
                    }
                    return {
                        value: undefined,
                        parent: prev,
                        parentHasKey: parentHasKey,
                        foundLastParent: false
                    };
                }
            }
            parentHasKey = objHasKeyAtIndex(prev, reads, reads.length - 1);
            if (cur === undefined && !parentHasKey) {
                if (options.earlyExit) {
                    options.earlyExit(prev, i - 1);
                }
            }
            return {
                value: cur,
                parent: prev,
                parentHasKey: parentHasKey,
                foundLastParent: true
            };
        },
        get: function (parent, reads, options) {
            return observeReader.read(parent, observeReader.reads(reads), options || {}).value;
        },
        valueReadersMap: {},
        valueReaders: [
            {
                name: 'function',
                test: function (value) {
                    return value && canReflect.isFunctionLike(value) && !canReflect.isConstructorLike(value);
                },
                read: function (value, i, reads, options, state, prev) {
                    if (options.callMethodsOnObservables && canReflect.isObservableLike(prev) && canReflect.isMapLike(prev)) {
                        dev.warn('can-stache-key: read() called with `callMethodsOnObservables: true`.');
                        return value.apply(prev, options.args || []);
                    }
                    return options.proxyMethods !== false ? bindName.call(value, prev) : value;
                }
            },
            {
                name: 'isValueLike',
                test: function (value, i, reads, options) {
                    return value && value[getValueSymbol] && value[isValueLikeSymbol] !== false && (options.foundAt || !isAt(i, reads));
                },
                read: function (value, i, reads, options) {
                    if (options.readCompute === false && i === reads.length) {
                        return value;
                    }
                    return canReflect.getValue(value);
                },
                write: function (base, newVal) {
                    if (base[setValueSymbol]) {
                        base[setValueSymbol](newVal);
                    } else if (base.set) {
                        base.set(newVal);
                    } else {
                        base(newVal);
                    }
                }
            }
        ],
        propertyReadersMap: {},
        propertyReaders: [
            {
                name: 'map',
                test: function (value) {
                    if (canReflect.isPromise(value) || typeof value === 'object' && value && typeof value.then === 'function') {
                        canReflectPromise(value);
                    }
                    return canReflect.isObservableLike(value) && canReflect.isMapLike(value);
                },
                read: function (value, prop) {
                    var res = canReflect.getKeyValue(value, prop.key);
                    if (res !== undefined) {
                        return res;
                    } else {
                        return value[prop.key];
                    }
                },
                write: canReflect.setKeyValue
            },
            {
                name: 'object',
                test: function () {
                    return true;
                },
                read: function (value, prop, i, options) {
                    if (value == null) {
                        return undefined;
                    } else {
                        if (typeof value === 'object') {
                            if (prop.key in value) {
                                return value[prop.key];
                            }
                        } else {
                            return value[prop.key];
                        }
                    }
                },
                write: function (base, prop, newVal) {
                    var propValue = base[prop];
                    if (newVal != null && typeof newVal === 'object' && canReflect.isMapLike(propValue)) {
                        dev.warn('can-stache-key: Merging data into "' + prop + '" because its parent is non-observable');
                        canReflect.update(propValue, newVal);
                    } else if (propValue != null && propValue[setValueSymbol] !== undefined) {
                        canReflect.setValue(propValue, newVal);
                    } else {
                        base[prop] = newVal;
                    }
                }
            }
        ],
        reads: function (keyArg) {
            var key = '' + keyArg;
            var keys = [];
            var last = 0;
            var at = false;
            if (key.charAt(0) === '@') {
                last = 1;
                at = true;
            }
            var keyToAdd = '';
            for (var i = last; i < key.length; i++) {
                var character = key.charAt(i);
                if (character === '.' || character === '@') {
                    if (key.charAt(i - 1) !== '\\') {
                        keys.push({
                            key: keyToAdd,
                            at: at
                        });
                        at = character === '@';
                        keyToAdd = '';
                    } else {
                        keyToAdd = keyToAdd.substr(0, keyToAdd.length - 1) + '.';
                    }
                } else {
                    keyToAdd += character;
                }
            }
            keys.push({
                key: keyToAdd,
                at: at
            });
            return keys;
        },
        write: function (parent, key, value, options) {
            var keys = typeof key === 'string' ? observeReader.reads(key) : key;
            var last;
            options = options || {};
            if (keys.length > 1) {
                last = keys.pop();
                parent = observeReader.read(parent, keys, options).value;
                keys.push(last);
            } else {
                last = keys[0];
            }
            if (!parent) {
                return;
            }
            var keyValue = peek(parent, last.key);
            if (observeReader.valueReadersMap.isValueLike.test(keyValue, keys.length - 1, keys, options)) {
                observeReader.valueReadersMap.isValueLike.write(keyValue, value, options);
            } else {
                if (observeReader.valueReadersMap.isValueLike.test(parent, keys.length - 1, keys, options)) {
                    parent = parent[getValueSymbol]();
                }
                if (observeReader.propertyReadersMap.map.test(parent)) {
                    observeReader.propertyReadersMap.map.write(parent, last.key, value, options);
                } else if (observeReader.propertyReadersMap.object.test(parent)) {
                    observeReader.propertyReadersMap.object.write(parent, last.key, value, options);
                    if (options.observation) {
                        options.observation.update();
                    }
                }
            }
        }
    };
    observeReader.propertyReaders.forEach(function (reader) {
        observeReader.propertyReadersMap[reader.name] = reader;
    });
    observeReader.valueReaders.forEach(function (reader) {
        observeReader.valueReadersMap[reader.name] = reader;
    });
    observeReader.set = observeReader.write;
    module.exports = observeReader;
});
/*can-key@1.2.0#utils*/
define('can-key@1.2.0#utils', function (require, exports, module) {
    'use strict';
    var utils = {
        isContainer: function (current) {
            var type = typeof current;
            return current && (type === 'object' || type === 'function');
        },
        strReplacer: /\{([^\}]+)\}/g,
        parts: function (name) {
            if (Array.isArray(name)) {
                return name;
            } else {
                return typeof name !== 'undefined' ? (name + '').replace(/\[/g, '.').replace(/]/g, '').split('.') : [];
            }
        }
    };
    module.exports = utils;
});
/*can-key@1.2.0#get/get*/
define('can-key@1.2.0#get/get', [
    'require',
    'exports',
    'module',
    'can-reflect',
    '../utils'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var utils = require('../utils');
    function get(obj, name) {
        var parts = utils.parts(name);
        var length = parts.length, current, i, container;
        if (!length) {
            return obj;
        }
        current = obj;
        for (i = 0; i < length && utils.isContainer(current) && current !== null; i++) {
            container = current;
            current = canReflect.getKeyValue(container, parts[i]);
        }
        return current;
    }
    module.exports = get;
});
/*can-dom-mutate@1.3.6#-util*/
define('can-dom-mutate@1.3.6#-util', [
    'require',
    'exports',
    'module',
    'can-globals/document/document'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getDocument = require('can-globals/document/document');
        function eliminate(array, item) {
            var index = array.indexOf(item);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }
        function addToSet(items, set) {
            for (var i = 0, length = items.length; i < length; i++) {
                set.add(items[i]);
            }
        }
        function contains(parent, child) {
            if (parent.contains) {
                return parent.contains(child);
            }
            if (parent.nodeType === Node.DOCUMENT_NODE && parent.documentElement) {
                return contains(parent.documentElement, child);
            } else {
                child = child.parentNode;
                if (child === parent) {
                    return true;
                }
                return false;
            }
        }
        function isInDocument(node) {
            var root = getDocument();
            if (root === node) {
                return true;
            }
            return contains(root, node);
        }
        function isDocumentElement(node) {
            return getDocument().documentElement === node;
        }
        function isFragment(node) {
            return !!(node && node.nodeType === 11);
        }
        function isElementNode(node) {
            return !!(node && node.nodeType === 1);
        }
        function getChildren(parentNode) {
            var nodes = [];
            var node = parentNode.firstChild;
            while (node) {
                nodes.push(node);
                node = node.nextSibling;
            }
            return nodes;
        }
        function getParents(node) {
            var nodes;
            if (isFragment(node)) {
                nodes = getChildren(node);
            } else {
                nodes = [node];
            }
            return nodes;
        }
        function getNodesLegacyB(node) {
            var skip, tmp;
            var depth = 0;
            var items = isFragment(node) ? [] : [node];
            if (node.firstChild == null) {
                return items;
            }
            do {
                if (!skip && (tmp = node.firstChild)) {
                    depth++;
                    items.push(tmp);
                } else if (tmp = node.nextSibling) {
                    skip = false;
                    items.push(tmp);
                } else {
                    tmp = node.parentNode;
                    depth--;
                    skip = true;
                }
                node = tmp;
            } while (depth > 0);
            return items;
        }
        function treeWalkerFilterFunction() {
            return NodeFilter.FILTER_ACCEPT;
        }
        var treeWalkerFilter = treeWalkerFilterFunction;
        treeWalkerFilter.acceptNode = treeWalkerFilterFunction;
        function getNodesWithTreeWalker(rootNode) {
            var result = isFragment(rootNode) ? [] : [rootNode];
            var walker = isElementNode(rootNode) && getDocument().createTreeWalker(rootNode, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, treeWalkerFilter, false);
            var node;
            while (node = walker && walker.nextNode()) {
                result.push(node);
            }
            return result;
        }
        function getAllNodes(node) {
            if (getDocument().createTreeWalker !== undefined) {
                return getNodesWithTreeWalker(node);
            } else {
                return getNodesLegacyB(node);
            }
        }
        function subscription(fn) {
            return function _subscription() {
                var disposal = fn.apply(this, arguments);
                var isDisposed = false;
                return function _disposal() {
                    if (isDisposed) {
                        var fnName = fn.name || fn.displayName || 'an anonymous function';
                        var message = 'Disposal function returned by ' + fnName + ' called more than once.';
                        throw new Error(message);
                    }
                    disposal.apply(this, arguments);
                    isDisposed = true;
                };
            };
        }
        module.exports = {
            eliminate: eliminate,
            isInDocument: isInDocument,
            getDocument: getDocument,
            isDocumentElement: isDocumentElement,
            isFragment: isFragment,
            getParents: getParents,
            getAllNodes: getAllNodes,
            getChildren: getChildren,
            subscription: subscription,
            addToSet: addToSet
        };
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-dom-mutate@1.3.6#can-dom-mutate*/
define('can-dom-mutate@1.3.6#can-dom-mutate', [
    'require',
    'exports',
    'module',
    'can-globals',
    'can-globals/global/global',
    'can-globals/mutation-observer/mutation-observer',
    'can-namespace',
    'can-globals/document/document',
    'can-reflect',
    './-util'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals');
        var getRoot = require('can-globals/global/global');
        var getMutationObserver = require('can-globals/mutation-observer/mutation-observer');
        var namespace = require('can-namespace');
        var DOCUMENT = require('can-globals/document/document');
        var canReflect = require('can-reflect');
        var util = require('./-util');
        var eliminate = util.eliminate;
        var subscription = util.subscription;
        var isDocumentElement = util.isDocumentElement;
        var getAllNodes = util.getAllNodes;
        var slice = Array.prototype.slice;
        var domMutate, dispatchInsertion, dispatchRemoval;
        var dataStore = new WeakMap();
        function getRelatedData(node, key) {
            var data = dataStore.get(node);
            if (data) {
                return data[key];
            }
        }
        function setRelatedData(node, key, targetListenersMap) {
            var data = dataStore.get(node);
            if (!data) {
                data = {};
                dataStore.set(node, data);
            }
            data[key] = targetListenersMap;
        }
        function deleteRelatedData(node, key) {
            var data = dataStore.get(node);
            return delete data[key];
        }
        function toMutationEvents(nodes) {
            var events = [];
            for (var i = 0; i < nodes.length; i++) {
                events.push({ target: nodes[i] });
            }
            return events;
        }
        function batch(processBatchItems) {
            return function batchAdd(items, callback) {
                processBatchItems(items);
                if (callback) {
                    callback();
                }
            };
        }
        function getDocumentListeners(target, key) {
            var doc = DOCUMENT();
            var data = getRelatedData(doc, key);
            if (data) {
                return data.listeners;
            }
        }
        function getTargetListeners(target, key) {
            var doc = DOCUMENT();
            var targetListenersMap = getRelatedData(doc, key);
            if (!targetListenersMap) {
                return;
            }
            return targetListenersMap.get(target);
        }
        function addTargetListener(target, key, listener) {
            var doc = DOCUMENT();
            var targetListenersMap = getRelatedData(doc, key);
            if (!targetListenersMap) {
                targetListenersMap = new Map();
                setRelatedData(doc, key, targetListenersMap);
            }
            var targetListeners = targetListenersMap.get(target);
            if (!targetListeners) {
                targetListeners = [];
                targetListenersMap.set(target, targetListeners);
            }
            targetListeners.push(listener);
        }
        function removeTargetListener(target, key, listener) {
            var doc = DOCUMENT();
            var targetListenersMap = getRelatedData(doc, key);
            if (!targetListenersMap) {
                return;
            }
            var targetListeners = targetListenersMap.get(target);
            if (!targetListeners) {
                return;
            }
            eliminate(targetListeners, listener);
            if (targetListeners.length === 0) {
                targetListenersMap['delete'](target);
                if (targetListenersMap.size === 0) {
                    deleteRelatedData(doc, key);
                }
            }
        }
        function fire(callbacks, arg) {
            var safeCallbacks = slice.call(callbacks, 0);
            var safeCallbackCount = safeCallbacks.length;
            for (var i = 0; i < safeCallbackCount; i++) {
                safeCallbacks[i](arg);
            }
        }
        function dispatch(listenerKey, documentDataKey) {
            return function dispatchEvents(events) {
                for (var e = 0; e < events.length; e++) {
                    var event = events[e];
                    var target = event.target;
                    var targetListeners = getTargetListeners(target, listenerKey);
                    if (targetListeners) {
                        fire(targetListeners, event);
                    }
                    if (!documentDataKey) {
                        continue;
                    }
                    var documentListeners = getDocumentListeners(target, documentDataKey);
                    if (documentListeners) {
                        fire(documentListeners, event);
                    }
                }
            };
        }
        var count = 0;
        function observeMutations(target, observerKey, config, handler) {
            var observerData = getRelatedData(target, observerKey);
            if (!observerData) {
                observerData = { observingCount: 0 };
                setRelatedData(target, observerKey, observerData);
            }
            var setupObserver = function () {
                if (observerData.observer) {
                    observerData.observer.disconnect();
                    observerData.observer = null;
                }
                var MutationObserver = getMutationObserver();
                if (MutationObserver) {
                    var Node = getRoot().Node;
                    var isRealNode = !!(Node && target instanceof Node);
                    if (isRealNode) {
                        var targetObserver = new MutationObserver(handler);
                        targetObserver.id = count++;
                        targetObserver.observe(target, config);
                        observerData.observer = targetObserver;
                    }
                }
            };
            if (observerData.observingCount === 0) {
                globals.onKeyValue('MutationObserver', setupObserver);
                setupObserver();
            }
            observerData.observingCount++;
            return function stopObservingMutations() {
                var observerData = getRelatedData(target, observerKey);
                if (observerData) {
                    observerData.observingCount--;
                    if (observerData.observingCount <= 0) {
                        if (observerData.observer) {
                            observerData.observer.disconnect();
                        }
                        deleteRelatedData(target, observerKey);
                        globals.offKeyValue('MutationObserver', setupObserver);
                    }
                }
            };
        }
        function handleTreeMutations(mutations) {
            if (typeof Set === 'undefined') {
                return;
            }
            var mutationCount = mutations.length;
            var added = new Set(), removed = new Set();
            for (var m = 0; m < mutationCount; m++) {
                var mutation = mutations[m];
                var addedCount = mutation.addedNodes.length;
                for (var a = 0; a < addedCount; a++) {
                    util.addToSet(getAllNodes(mutation.addedNodes[a]), added);
                }
                var removedCount = mutation.removedNodes.length;
                for (var r = 0; r < removedCount; r++) {
                    util.addToSet(getAllNodes(mutation.removedNodes[r]), removed);
                }
            }
            dispatchRemoval(toMutationEvents(canReflect.toArray(removed)));
            dispatchInsertion(toMutationEvents(canReflect.toArray(added)));
        }
        function handleAttributeMutations(mutations) {
            var mutationCount = mutations.length;
            for (var m = 0; m < mutationCount; m++) {
                var mutation = mutations[m];
                if (mutation.type === 'attributes') {
                    var node = mutation.target;
                    var attributeName = mutation.attributeName;
                    var oldValue = mutation.oldValue;
                    domMutate.dispatchNodeAttributeChange(node, attributeName, oldValue);
                }
            }
        }
        var treeMutationConfig = {
            subtree: true,
            childList: true
        };
        var attributeMutationConfig = {
            attributes: true,
            attributeOldValue: true
        };
        function addNodeListener(listenerKey, observerKey, isAttributes) {
            return subscription(function _addNodeListener(target, listener) {
                if (target.nodeType === 11) {
                    return Function.prototype;
                }
                var stopObserving;
                if (isAttributes) {
                    stopObserving = observeMutations(target, observerKey, attributeMutationConfig, handleAttributeMutations);
                } else {
                    stopObserving = observeMutations(DOCUMENT(), observerKey, treeMutationConfig, handleTreeMutations);
                }
                addTargetListener(target, listenerKey, listener);
                return function removeNodeListener() {
                    stopObserving();
                    removeTargetListener(target, listenerKey, listener);
                };
            });
        }
        function addGlobalListener(globalDataKey, addNodeListener) {
            return subscription(function addGlobalGroupListener(documentElement, listener) {
                if (!isDocumentElement(documentElement)) {
                    throw new Error('Global mutation listeners must pass a documentElement');
                }
                var doc = DOCUMENT();
                var documentData = getRelatedData(doc, globalDataKey);
                if (!documentData) {
                    documentData = { listeners: [] };
                    setRelatedData(doc, globalDataKey, documentData);
                }
                var listeners = documentData.listeners;
                if (listeners.length === 0) {
                    documentData.removeListener = addNodeListener(doc, function () {
                    });
                }
                listeners.push(listener);
                return function removeGlobalGroupListener() {
                    var documentData = getRelatedData(doc, globalDataKey);
                    if (!documentData) {
                        return;
                    }
                    var listeners = documentData.listeners;
                    eliminate(listeners, listener);
                    if (listeners.length === 0) {
                        documentData.removeListener();
                        deleteRelatedData(doc, globalDataKey);
                    }
                };
            });
        }
        var domMutationPrefix = 'domMutation';
        var insertionDataKey = domMutationPrefix + 'InsertionData';
        var removalDataKey = domMutationPrefix + 'RemovalData';
        var attributeChangeDataKey = domMutationPrefix + 'AttributeChangeData';
        var documentInsertionDataKey = domMutationPrefix + 'DocumentInsertionData';
        var documentRemovalDataKey = domMutationPrefix + 'DocumentRemovalData';
        var documentAttributeChangeDataKey = domMutationPrefix + 'DocumentAttributeChangeData';
        var treeDataKey = domMutationPrefix + 'TreeData';
        var attributeDataKey = domMutationPrefix + 'AttributeData';
        dispatchInsertion = batch(dispatch(insertionDataKey, documentInsertionDataKey));
        dispatchRemoval = batch(dispatch(removalDataKey, documentRemovalDataKey));
        var dispatchAttributeChange = batch(dispatch(attributeChangeDataKey, documentAttributeChangeDataKey));
        var addNodeInsertionListener = addNodeListener(insertionDataKey, treeDataKey);
        var addNodeRemovalListener = addNodeListener(removalDataKey, treeDataKey);
        var addNodeAttributeChangeListener = addNodeListener(attributeChangeDataKey, attributeDataKey, true);
        var addInsertionListener = addGlobalListener(documentInsertionDataKey, addNodeInsertionListener);
        var addRemovalListener = addGlobalListener(documentRemovalDataKey, addNodeRemovalListener);
        var addAttributeChangeListener = addGlobalListener(documentAttributeChangeDataKey, addNodeAttributeChangeListener);
        domMutate = {
            dispatchNodeInsertion: function (node, callback) {
                var nodes = new Set();
                util.addToSet(getAllNodes(node), nodes);
                var events = toMutationEvents(canReflect.toArray(nodes));
                dispatchInsertion(events, callback);
            },
            dispatchNodeRemoval: function (node, callback) {
                var nodes = new Set();
                util.addToSet(getAllNodes(node), nodes);
                var events = toMutationEvents(canReflect.toArray(nodes));
                dispatchRemoval(events, callback);
            },
            dispatchNodeAttributeChange: function (target, attributeName, oldValue, callback) {
                dispatchAttributeChange([{
                        target: target,
                        attributeName: attributeName,
                        oldValue: oldValue
                    }], callback);
            },
            onNodeInsertion: addNodeInsertionListener,
            onNodeRemoval: addNodeRemovalListener,
            onNodeAttributeChange: addNodeAttributeChangeListener,
            onRemoval: addRemovalListener,
            onInsertion: addInsertionListener,
            onAttributeChange: addAttributeChangeListener
        };
        module.exports = namespace.domMutate = domMutate;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-control@4.4.1#can-control*/
define('can-control@4.4.1#can-control', [
    'require',
    'exports',
    'module',
    'can-construct',
    'can-namespace',
    'can-assign',
    'can-stache-key',
    'can-reflect',
    'can-observation',
    'can-event-queue/map/map',
    'can-log/dev/dev',
    'can-string',
    'can-key/get/get',
    'can-dom-mutate',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var Construct = require('can-construct');
    var namespace = require('can-namespace');
    var assign = require('can-assign');
    var observeReader = require('can-stache-key');
    var canReflect = require('can-reflect');
    var Observation = require('can-observation');
    var canEvent = require('can-event-queue/map/map');
    var dev = require('can-log/dev/dev');
    var string = require('can-string');
    var get = require('can-key/get/get');
    var domMutate = require('can-dom-mutate');
    var canSymbol = require('can-symbol');
    var controlsSymbol = canSymbol.for('can.controls');
    var processors;
    var bind = function (el, ev, callback, queue) {
            canEvent.on.call(el, ev, callback, queue);
            return function () {
                canEvent.off.call(el, ev, callback, queue);
            };
        }, slice = [].slice, paramReplacer = /\{([^\}]+)\}/g, delegate = function (el, selector, ev, callback) {
            canEvent.on.call(el, ev, selector, callback);
            return function () {
                canEvent.off.call(el, ev, selector, callback);
            };
        }, binder = function (el, ev, callback, selector) {
            return selector ? delegate(el, selector.trim(), ev, callback) : bind(el, ev, callback);
        }, basicProcessor;
    var Control = Construct.extend('Control', {
        setup: function () {
            Construct.setup.apply(this, arguments);
            if (Control) {
                var control = this, funcName;
                control.actions = {};
                for (funcName in control.prototype) {
                    if (control._isAction(funcName)) {
                        control.actions[funcName] = control._action(funcName);
                    }
                }
            }
        },
        _shifter: function (context, name) {
            var method = typeof name === 'string' ? context[name] : name;
            if (typeof method !== 'function') {
                method = context[method];
            }
            var Control = this;
            function controlMethod() {
                var wrapped = Control.wrapElement(this);
                context.called = name;
                return method.apply(context, [wrapped].concat(slice.call(arguments, 0)));
            }
            return controlMethod;
        },
        _isAction: function (methodName) {
            var val = this.prototype[methodName], type = typeof val;
            return methodName !== 'constructor' && (type === 'function' || type === 'string' && typeof this.prototype[val] === 'function') && !!(Control.isSpecial(methodName) || processors[methodName] || /[^\w]/.test(methodName));
        },
        _action: function (methodName, options, controlInstance) {
            var readyCompute, unableToBind;
            paramReplacer.lastIndex = 0;
            if (options || !paramReplacer.test(methodName)) {
                var controlActionData = function () {
                    var delegate;
                    var name = methodName.replace(paramReplacer, function (matched, key) {
                        var value, parent;
                        if (this._isDelegate(options, key)) {
                            delegate = this._getDelegate(options, key);
                            return '';
                        }
                        key = this._removeDelegateFromKey(key);
                        parent = this._lookup(options)[0];
                        value = observeReader.read(parent, observeReader.reads(key), { readCompute: false }).value;
                        if (value === undefined && typeof window !== 'undefined') {
                            value = get(window, key);
                        }
                        if (!parent || !(canReflect.isObservableLike(parent) && canReflect.isMapLike(parent)) && !value) {
                            unableToBind = true;
                            return null;
                        }
                        if (typeof value === 'string') {
                            return value;
                        } else {
                            delegate = value;
                            return '';
                        }
                    }.bind(this));
                    name = name.trim();
                    var parts = name.split(/\s+/g), event = parts.pop();
                    return {
                        processor: this.processors[event] || basicProcessor,
                        parts: [
                            name,
                            parts.join(' '),
                            event
                        ],
                        delegate: delegate || undefined
                    };
                };
                readyCompute = new Observation(controlActionData, this);
                if (controlInstance) {
                    var handler = function (actionData) {
                        controlInstance._bindings.control[methodName](controlInstance.element);
                        controlInstance._bindings.control[methodName] = actionData.processor(actionData.delegate || controlInstance.element, actionData.parts[2], actionData.parts[1], methodName, controlInstance);
                    };
                    canReflect.onValue(readyCompute, handler, 'mutate');
                    controlInstance._bindings.readyComputes[methodName] = {
                        compute: readyCompute,
                        handler: handler
                    };
                }
                return readyCompute.get();
            }
        },
        _lookup: function (options) {
            return [
                options,
                window
            ];
        },
        _removeDelegateFromKey: function (key) {
            return key;
        },
        _isDelegate: function (options, key) {
            return key === 'element';
        },
        _getDelegate: function (options, key) {
            return undefined;
        },
        processors: {},
        defaults: {},
        convertElement: function (element) {
            element = typeof element === 'string' ? document.querySelector(element) : element;
            return this.wrapElement(element);
        },
        wrapElement: function (el) {
            return el;
        },
        unwrapElement: function (el) {
            return el;
        },
        isSpecial: function (eventName) {
            return eventName === 'inserted' || eventName === 'removed';
        }
    }, {
        setup: function (element, options) {
            var cls = this.constructor, pluginname = cls.pluginName || cls.shortName, arr;
            if (!element) {
                throw new Error('Creating an instance of a named control without passing an element');
            }
            this.element = cls.convertElement(element);
            if (pluginname && pluginname !== 'Control' && this.element.classList) {
                this.element.classList.add(pluginname);
            }
            arr = this.element[controlsSymbol];
            if (!arr) {
                arr = [];
                this.element[controlsSymbol] = arr;
            }
            arr.push(this);
            if (canReflect.isObservableLike(options) && canReflect.isMapLike(options)) {
                for (var prop in cls.defaults) {
                    if (!options.hasOwnProperty(prop)) {
                        observeReader.set(options, prop, cls.defaults[prop]);
                    }
                }
                this.options = options;
            } else {
                this.options = assign(assign({}, cls.defaults), options);
            }
            this.on();
            return [
                this.element,
                this.options
            ];
        },
        on: function (el, selector, eventName, func) {
            if (!el) {
                this.off();
                var cls = this.constructor, bindings = this._bindings, actions = cls.actions, element = this.constructor.unwrapElement(this.element), destroyCB = Control._shifter(this, 'destroy'), funcName, ready;
                for (funcName in actions) {
                    if (actions.hasOwnProperty(funcName)) {
                        ready = actions[funcName] || cls._action(funcName, this.options, this);
                        if (ready) {
                            bindings.control[funcName] = ready.processor(ready.delegate || element, ready.parts[2], ready.parts[1], funcName, this);
                        }
                    }
                }
                var removalDisposal = domMutate.onNodeRemoval(element, function () {
                    var doc = element.ownerDocument;
                    var ownerNode = doc.contains ? doc : doc.documentElement;
                    if (!ownerNode || ownerNode.contains(element) === false) {
                        destroyCB();
                    }
                });
                bindings.user.push(function () {
                    if (removalDisposal) {
                        removalDisposal();
                        removalDisposal = undefined;
                    }
                });
                return bindings.user.length;
            }
            if (typeof el === 'string') {
                func = eventName;
                eventName = selector;
                selector = el;
                el = this.element;
            }
            if (func === undefined) {
                func = eventName;
                eventName = selector;
                selector = null;
            }
            if (typeof func === 'string') {
                func = Control._shifter(this, func);
            }
            this._bindings.user.push(binder(el, eventName, func, selector));
            return this._bindings.user.length;
        },
        off: function () {
            var el = this.constructor.unwrapElement(this.element), bindings = this._bindings;
            if (bindings) {
                (bindings.user || []).forEach(function (value) {
                    value(el);
                });
                canReflect.eachKey(bindings.control || {}, function (value) {
                    value(el);
                });
                canReflect.eachKey(bindings.readyComputes || {}, function (value) {
                    canReflect.offValue(value.compute, value.handler, 'mutate');
                });
            }
            this._bindings = {
                user: [],
                control: {},
                readyComputes: {}
            };
        },
        destroy: function () {
            if (this.element === null) {
                return;
            }
            var Class = this.constructor, pluginName = Class.pluginName || Class.shortName && string.underscore(Class.shortName), controls;
            this.off();
            if (pluginName && pluginName !== 'can_control' && this.element.classList) {
                this.element.classList.remove(pluginName);
            }
            controls = this.element[controlsSymbol];
            if (controls) {
                controls.splice(controls.indexOf(this), 1);
            }
            this.element = null;
        }
    });
    processors = Control.processors;
    basicProcessor = function (el, event, selector, methodName, control) {
        return binder(el, event, Control._shifter(control, methodName), selector);
    };
    [
        'beforeremove',
        'change',
        'click',
        'contextmenu',
        'dblclick',
        'keydown',
        'keyup',
        'keypress',
        'mousedown',
        'mousemove',
        'mouseout',
        'mouseover',
        'mouseup',
        'reset',
        'resize',
        'scroll',
        'select',
        'submit',
        'focusin',
        'focusout',
        'mouseenter',
        'mouseleave',
        'touchstart',
        'touchmove',
        'touchcancel',
        'touchend',
        'touchleave',
        'inserted',
        'removed',
        'dragstart',
        'dragenter',
        'dragover',
        'dragleave',
        'drag',
        'drop',
        'dragend'
    ].forEach(function (v) {
        processors[v] = basicProcessor;
    });
    module.exports = namespace.Control = Control;
});
/*can-component@4.4.11#control/control*/
define('can-component@4.4.11#control/control', [
    'require',
    'exports',
    'module',
    'can-control',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var Control = require('can-control');
    var canReflect = require('can-reflect');
    var paramReplacer = /\{([^\}]+)\}/g;
    var ComponentControl = Control.extend({
        _lookup: function (options) {
            return [
                options.scope,
                options,
                window
            ];
        },
        _removeDelegateFromKey: function (key) {
            return key.replace(/^(scope|^viewModel)\./, '');
        },
        _isDelegate: function (options, key) {
            return key === 'scope' || key === 'viewModel';
        },
        _getDelegate: function (options, key) {
            return options[key];
        },
        _action: function (methodName, options, controlInstance) {
            var hasObjectLookup;
            paramReplacer.lastIndex = 0;
            hasObjectLookup = paramReplacer.test(methodName);
            if (!controlInstance && hasObjectLookup) {
                return;
            } else {
                return Control._action.apply(this, arguments);
            }
        }
    }, {
        setup: function (el, options) {
            this.scope = options.scope;
            this.viewModel = options.viewModel;
            return Control.prototype.setup.call(this, el, options);
        },
        off: function () {
            if (this._bindings) {
                canReflect.eachKey(this._bindings.readyComputes || {}, function (value) {
                    canReflect.offValue(value.compute, value.handler);
                });
            }
            Control.prototype.off.apply(this, arguments);
            this._bindings.readyComputes = {};
        },
        destroy: function () {
            Control.prototype.destroy.apply(this, arguments);
            if (typeof this.options.destroy === 'function') {
                this.options.destroy.apply(this, arguments);
            }
        }
    });
    module.exports = ComponentControl;
});
/*can-bind@1.3.0#can-bind*/
define('can-bind@1.3.0#can-bind', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    'can-namespace',
    'can-queues',
    'can-assign'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var namespace = require('can-namespace');
    var queues = require('can-queues');
    var canAssign = require('can-assign');
    var getChangesSymbol = canSymbol.for('can.getChangesDependencyRecord');
    var getValueSymbol = canSymbol.for('can.getValue');
    var onValueSymbol = canSymbol.for('can.onValue');
    var onEmitSymbol = canSymbol.for('can.onEmit');
    var offEmitSymbol = canSymbol.for('can.offEmit');
    var setValueSymbol = canSymbol.for('can.setValue');
    function defaultSetValue(newValue, observable) {
        canReflect.setValue(observable, newValue);
    }
    function onEmit(listenToObservable, updateFunction, queue) {
        return listenToObservable[onEmitSymbol](updateFunction, queue);
    }
    function offEmit(listenToObservable, updateFunction, queue) {
        return listenToObservable[offEmitSymbol](updateFunction, queue);
    }
    function turnOffListeningAndUpdate(listenToObservable, updateObservable, updateFunction, queue) {
        var offValueOrOffEmitFn;
        if (listenToObservable[onValueSymbol]) {
            offValueOrOffEmitFn = canReflect.offValue;
        } else if (listenToObservable[onEmitSymbol]) {
            offValueOrOffEmitFn = offEmit;
        }
        if (offValueOrOffEmitFn) {
            offValueOrOffEmitFn(listenToObservable, updateFunction, queue);
        }
    }
    function turnOnListeningAndUpdate(listenToObservable, updateObservable, updateFunction, queue) {
        var onValueOrOnEmitFn;
        if (listenToObservable[onValueSymbol]) {
            onValueOrOnEmitFn = canReflect.onValue;
        } else if (listenToObservable[onEmitSymbol]) {
            onValueOrOnEmitFn = onEmit;
        }
        if (onValueOrOnEmitFn) {
            onValueOrOnEmitFn(listenToObservable, updateFunction, queue);
        }
    }
    function Semaphore(binding, type) {
        this.value = 0;
        this._binding = binding;
        this._type = type;
    }
    canAssign(Semaphore.prototype, {
        decrement: function () {
            this.value -= 1;
        },
        increment: function (args) {
            this._incremented = true;
            this.value += 1;
        }
    });
    function Bind(options) {
        this._options = options;
        if (options.queue === undefined) {
            options.queue = 'domUI';
        }
        if (options.cycles > 0 === false) {
            options.cycles = 0;
        }
        options.onInitDoNotUpdateChild = typeof options.onInitDoNotUpdateChild === 'boolean' ? options.onInitDoNotUpdateChild : false;
        options.onInitDoNotUpdateParent = typeof options.onInitDoNotUpdateParent === 'boolean' ? options.onInitDoNotUpdateParent : false;
        options.onInitSetUndefinedParentIfChildIsDefined = typeof options.onInitSetUndefinedParentIfChildIsDefined === 'boolean' ? options.onInitSetUndefinedParentIfChildIsDefined : true;
        var childSemaphore = new Semaphore(this, 'child');
        var parentSemaphore = new Semaphore(this, 'parent');
        var childToParent = true;
        if (typeof options.childToParent === 'boolean') {
            childToParent = options.childToParent;
        } else if (options.child[getValueSymbol] == null) {
            childToParent = false;
        } else if (options.setParent === undefined && options.parent[setValueSymbol] == null) {
            childToParent = false;
        }
        var parentToChild = true;
        if (typeof options.parentToChild === 'boolean') {
            parentToChild = options.parentToChild;
        } else if (options.parent[getValueSymbol] == null) {
            parentToChild = false;
        } else if (options.setChild === undefined && options.child[setValueSymbol] == null) {
            parentToChild = false;
        }
        if (childToParent === false && parentToChild === false) {
            throw new Error('Neither the child nor parent will be updated; this is a no-way binding');
        }
        this._childToParent = childToParent;
        this._parentToChild = parentToChild;
        if (options.setChild === undefined) {
            options.setChild = defaultSetValue;
        }
        if (options.setParent === undefined) {
            options.setParent = defaultSetValue;
        }
        if (options.priority !== undefined) {
            canReflect.setPriority(options.child, options.priority);
            canReflect.setPriority(options.parent, options.priority);
        }
        var allowedUpdates = options.cycles * 2;
        var allowedChildUpdates = allowedUpdates + (options.sticky === 'childSticksToParent' ? 1 : 0);
        var allowedParentUpdates = allowedUpdates + (options.sticky === 'parentSticksToChild' ? 1 : 0);
        this._bindingState = {
            child: false,
            parent: false
        };
        this._updateChild = function (newValue) {
            updateValue.call(this, {
                bindingState: this._bindingState,
                newValue: newValue,
                debugObservableName: 'child',
                debugPartnerName: 'parent',
                observable: options.child,
                setValue: options.setChild,
                semaphore: childSemaphore,
                allowedUpdates: allowedChildUpdates,
                sticky: options.sticky === 'parentSticksToChild',
                partner: options.parent,
                setPartner: options.setParent,
                partnerSemaphore: parentSemaphore
            });
        }.bind(this);
        this._updateParent = function (newValue) {
            updateValue.call(this, {
                bindingState: this._bindingState,
                newValue: newValue,
                debugObservableName: 'parent',
                debugPartnerName: 'child',
                observable: options.parent,
                setValue: options.setParent,
                semaphore: parentSemaphore,
                allowedUpdates: allowedParentUpdates,
                sticky: options.sticky === 'childSticksToParent',
                partner: options.child,
                setPartner: options.setChild,
                partnerSemaphore: childSemaphore
            });
        }.bind(this);
    }
    Object.defineProperty(Bind.prototype, 'parentValue', {
        get: function () {
            return canReflect.getValue(this._options.parent);
        }
    });
    canAssign(Bind.prototype, {
        start: function () {
            var childValue;
            var options = this._options;
            var parentValue;
            this.startParent();
            this.startChild();
            if (this._childToParent === true && this._parentToChild === true) {
                parentValue = canReflect.getValue(options.parent);
                if (parentValue === undefined) {
                    childValue = canReflect.getValue(options.child);
                    if (childValue === undefined) {
                        if (options.onInitDoNotUpdateChild === false) {
                            this._updateChild(parentValue);
                        }
                    } else if (options.onInitDoNotUpdateParent === false && options.onInitSetUndefinedParentIfChildIsDefined === true) {
                        this._updateParent(childValue);
                    }
                } else {
                    if (options.onInitDoNotUpdateChild === false) {
                        this._updateChild(parentValue);
                    }
                }
            } else if (this._childToParent === true) {
                if (options.onInitDoNotUpdateParent === false) {
                    childValue = canReflect.getValue(options.child);
                    this._updateParent(childValue);
                }
            } else if (this._parentToChild === true) {
                if (options.onInitDoNotUpdateChild === false) {
                    parentValue = canReflect.getValue(options.parent);
                    this._updateChild(parentValue);
                }
            }
        },
        startChild: function () {
            if (this._bindingState.child === false && this._childToParent === true) {
                var options = this._options;
                this._bindingState.child = true;
                turnOnListeningAndUpdate(options.child, options.parent, this._updateParent, options.queue);
            }
        },
        startParent: function () {
            if (this._bindingState.parent === false && this._parentToChild === true) {
                var options = this._options;
                this._bindingState.parent = true;
                turnOnListeningAndUpdate(options.parent, options.child, this._updateChild, options.queue);
            }
        },
        stop: function () {
            var bindingState = this._bindingState;
            var options = this._options;
            if (bindingState.parent === true && this._parentToChild === true) {
                bindingState.parent = false;
                turnOffListeningAndUpdate(options.parent, options.child, this._updateChild, options.queue);
            }
            if (bindingState.child === true && this._childToParent === true) {
                bindingState.child = false;
                turnOffListeningAndUpdate(options.child, options.parent, this._updateParent, options.queue);
            }
        }
    });
    function updateValue(args) {
        var bindingState = args.bindingState;
        if (bindingState.child === false && bindingState.parent === false) {
            return;
        }
        var semaphore = args.semaphore;
        if (semaphore.value + args.partnerSemaphore.value <= args.allowedUpdates) {
            queues.batch.start();
            semaphore.increment(args);
            args.setValue(args.newValue, args.observable);
            queues.mutateQueue.enqueue(semaphore.decrement, semaphore, []);
            queues.batch.stop();
            if (args.sticky) {
                var observableValue = canReflect.getValue(args.observable);
                if (observableValue !== canReflect.getValue(args.partner)) {
                    args.setPartner(observableValue, args.partner);
                }
            }
        } else {
        }
    }
    module.exports = namespace.Bind = Bind;
});
/*can-attribute-encoder@1.1.2#can-attribute-encoder*/
define('can-attribute-encoder@1.1.2#can-attribute-encoder', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-log/dev/dev'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var dev = require('can-log/dev/dev');
    function each(items, callback) {
        for (var i = 0; i < items.length; i++) {
            callback(items[i], i);
        }
    }
    function makeMap(str) {
        var obj = {}, items = str.split(',');
        each(items, function (name) {
            obj[name] = true;
        });
        return obj;
    }
    var caseMattersAttributes = makeMap('allowReorder,attributeName,attributeType,autoReverse,baseFrequency,baseProfile,calcMode,clipPathUnits,contentScriptType,contentStyleType,diffuseConstant,edgeMode,externalResourcesRequired,filterRes,filterUnits,glyphRef,gradientTransform,gradientUnits,kernelMatrix,kernelUnitLength,keyPoints,keySplines,keyTimes,lengthAdjust,limitingConeAngle,markerHeight,markerUnits,markerWidth,maskContentUnits,maskUnits,patternContentUnits,patternTransform,patternUnits,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,repeatCount,repeatDur,requiredExtensions,requiredFeatures,specularConstant,specularExponent,spreadMethod,startOffset,stdDeviation,stitchTiles,surfaceScale,systemLanguage,tableValues,textLength,viewBox,viewTarget,xChannelSelector,yChannelSelector');
    function camelCaseToSpinalCase(match, lowerCaseChar, upperCaseChar) {
        return lowerCaseChar + '-' + upperCaseChar.toLowerCase();
    }
    function startsWith(allOfIt, startsWith) {
        return allOfIt.indexOf(startsWith) === 0;
    }
    function endsWith(allOfIt, endsWith) {
        return allOfIt.length - allOfIt.lastIndexOf(endsWith) === endsWith.length;
    }
    var regexes = {
        leftParens: /\(/g,
        rightParens: /\)/g,
        leftBrace: /\{/g,
        rightBrace: /\}/g,
        camelCase: /([a-z]|[0-9]|^)([A-Z])/g,
        forwardSlash: /\//g,
        space: /\s/g,
        uppercase: /[A-Z]/g,
        uppercaseDelimiterThenChar: /:u:([a-z])/g,
        caret: /\^/g,
        dollar: /\$/g,
        at: /@/g
    };
    var delimiters = {
        prependUppercase: ':u:',
        replaceSpace: ':s:',
        replaceForwardSlash: ':f:',
        replaceLeftParens: ':lp:',
        replaceRightParens: ':rp:',
        replaceLeftBrace: ':lb:',
        replaceRightBrace: ':rb:',
        replaceCaret: ':c:',
        replaceDollar: ':d:',
        replaceAt: ':at:'
    };
    var encoder = {};
    encoder.encode = function (name) {
        var encoded = name;
        if (!caseMattersAttributes[encoded] && encoded.match(regexes.camelCase)) {
            if (startsWith(encoded, 'on:') || endsWith(encoded, ':to') || endsWith(encoded, ':from') || endsWith(encoded, ':bind') || endsWith(encoded, ':raw')) {
                encoded = encoded.replace(regexes.uppercase, function (char) {
                    return delimiters.prependUppercase + char.toLowerCase();
                });
            } else if (startsWith(encoded, '(') || startsWith(encoded, '{')) {
                encoded = encoded.replace(regexes.camelCase, camelCaseToSpinalCase);
            }
        }
        encoded = encoded.replace(regexes.space, delimiters.replaceSpace).replace(regexes.forwardSlash, delimiters.replaceForwardSlash).replace(regexes.leftParens, delimiters.replaceLeftParens).replace(regexes.rightParens, delimiters.replaceRightParens).replace(regexes.leftBrace, delimiters.replaceLeftBrace).replace(regexes.rightBrace, delimiters.replaceRightBrace).replace(regexes.caret, delimiters.replaceCaret).replace(regexes.dollar, delimiters.replaceDollar).replace(regexes.at, delimiters.replaceAt);
        return encoded;
    };
    encoder.decode = function (name) {
        var decoded = name;
        if (!caseMattersAttributes[decoded] && regexes.uppercaseDelimiterThenChar.test(decoded)) {
            if (startsWith(decoded, 'on:') || endsWith(decoded, ':to') || endsWith(decoded, ':from') || endsWith(decoded, ':bind') || endsWith(decoded, ':raw')) {
                decoded = decoded.replace(regexes.uppercaseDelimiterThenChar, function (match, char) {
                    return char.toUpperCase();
                });
            }
        }
        decoded = decoded.replace(delimiters.replaceLeftParens, '(').replace(delimiters.replaceRightParens, ')').replace(delimiters.replaceLeftBrace, '{').replace(delimiters.replaceRightBrace, '}').replace(delimiters.replaceForwardSlash, '/').replace(delimiters.replaceSpace, ' ').replace(delimiters.replaceCaret, '^').replace(delimiters.replaceDollar, '$').replace(delimiters.replaceAt, '@');
        return decoded;
    };
    if (namespace.encoder) {
        throw new Error('You can\'t have two versions of can-attribute-encoder, check your dependencies');
    } else {
        module.exports = namespace.encoder = encoder;
    }
});
/*can-view-parser@4.1.2#can-view-parser*/
define('can-view-parser@4.1.2#can-view-parser', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-log/dev/dev',
    'can-attribute-encoder'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace'), dev = require('can-log/dev/dev'), encoder = require('can-attribute-encoder');
    function each(items, callback) {
        for (var i = 0; i < items.length; i++) {
            callback(items[i], i);
        }
    }
    function makeMap(str) {
        var obj = {}, items = str.split(',');
        each(items, function (name) {
            obj[name] = true;
        });
        return obj;
    }
    function handleIntermediate(intermediate, handler) {
        for (var i = 0, len = intermediate.length; i < len; i++) {
            var item = intermediate[i];
            handler[item.tokenType].apply(handler, item.args);
        }
        return intermediate;
    }
    var alphaNumeric = 'A-Za-z0-9', alphaNumericHU = '-:_' + alphaNumeric, magicStart = '{{', endTag = new RegExp('^<\\/([' + alphaNumericHU + ']+)[^>]*>'), magicMatch = new RegExp('\\{\\{(![\\s\\S]*?!|[\\s\\S]*?)\\}\\}\\}?', 'g'), space = /\s/, alphaRegex = new RegExp('[' + alphaNumeric + ']'), attributeRegexp = new RegExp('[' + alphaNumericHU + ']+s*=s*("[^"]*"|\'[^\']*\')');
    var empty = makeMap('area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed');
    var caseMattersElements = makeMap('altGlyph,altGlyphDef,altGlyphItem,animateColor,animateMotion,animateTransform,clipPath,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,foreignObject,glyphRef,linearGradient,radialGradient,textPath');
    var closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr');
    var special = makeMap('script');
    var tokenTypes = 'start,end,close,attrStart,attrEnd,attrValue,chars,comment,special,done'.split(',');
    var startOppositesMap = {
        '{': '}',
        '(': ')'
    };
    var fn = function () {
    };
    var HTMLParser = function (html, handler, returnIntermediate) {
        if (typeof html === 'object') {
            return handleIntermediate(html, handler);
        }
        var intermediate = [];
        handler = handler || {};
        if (returnIntermediate) {
            each(tokenTypes, function (name) {
                var callback = handler[name] || fn;
                handler[name] = function () {
                    if (callback.apply(this, arguments) !== false) {
                        var end = arguments.length;
                        if (arguments[end - 1] === undefined) {
                            end = arguments.length - 1;
                        }
                        intermediate.push({
                            tokenType: name,
                            args: [].slice.call(arguments, 0, end)
                        });
                    }
                };
            });
        }
        function parseStartTag(tag, tagName, rest, unary) {
            tagName = caseMattersElements[tagName] ? tagName : tagName.toLowerCase();
            if (closeSelf[tagName] && stack.last() === tagName) {
                parseEndTag('', tagName);
            }
            unary = empty[tagName] || !!unary;
            handler.start(tagName, unary, lineNo);
            if (!unary) {
                stack.push(tagName);
            }
            HTMLParser.parseAttrs(rest, handler, lineNo);
            handler.end(tagName, unary, lineNo);
            if (tagName === 'html') {
                skipChars = true;
            }
        }
        function parseEndTag(tag, tagName) {
            var pos;
            if (!tagName) {
                pos = 0;
            } else {
                tagName = caseMattersElements[tagName] ? tagName : tagName.toLowerCase();
                for (pos = stack.length - 1; pos >= 0; pos--) {
                    if (stack[pos] === tagName) {
                        break;
                    }
                }
            }
            if (pos >= 0) {
                for (var i = stack.length - 1; i >= pos; i--) {
                    if (handler.close) {
                        handler.close(stack[i], lineNo);
                    }
                }
                stack.length = pos;
                if (tagName === 'body') {
                    skipChars = true;
                }
            }
        }
        function parseMustache(mustache, inside) {
            if (handler.special) {
                handler.special(inside, lineNo);
            }
        }
        var callChars = function () {
            if (charsText && !skipChars) {
                if (handler.chars) {
                    handler.chars(charsText, lineNo);
                }
            }
            skipChars = false;
            charsText = '';
        };
        var index, chars, skipChars, match, lineNo, stack = [], last = html, charsText = '';
        stack.last = function () {
            return this[this.length - 1];
        };
        while (html) {
            chars = true;
            if (!stack.last() || !special[stack.last()]) {
                if (html.indexOf('<!--') === 0) {
                    index = html.indexOf('-->');
                    if (index >= 0) {
                        callChars();
                        if (handler.comment) {
                            handler.comment(html.substring(4, index), lineNo);
                        }
                        html = html.substring(index + 3);
                        chars = false;
                    }
                } else if (html.indexOf('</') === 0) {
                    match = html.match(endTag);
                    if (match) {
                        callChars();
                        match[0].replace(endTag, parseEndTag);
                        html = html.substring(match[0].length);
                        chars = false;
                    }
                } else if (html.indexOf('<') === 0) {
                    var res = HTMLParser.searchStartTag(html);
                    if (res) {
                        callChars();
                        parseStartTag.apply(null, res.match);
                        html = res.html;
                        chars = false;
                    }
                } else if (html.indexOf(magicStart) === 0) {
                    match = html.match(magicMatch);
                    if (match) {
                        callChars();
                        match[0].replace(magicMatch, parseMustache);
                        html = html.substring(match[0].length);
                    }
                }
                if (chars) {
                    index = findBreak(html, magicStart);
                    if (index === 0 && html === last) {
                        charsText += html.charAt(0);
                        html = html.substr(1);
                        index = findBreak(html, magicStart);
                    }
                    var text = index < 0 ? html : html.substring(0, index);
                    html = index < 0 ? '' : html.substring(index);
                    if (text) {
                        charsText += text;
                    }
                }
            } else {
                html = html.replace(new RegExp('([\\s\\S]*?)</' + stack.last() + '[^>]*>'), function (all, text) {
                    text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, '$1$2');
                    if (handler.chars) {
                        handler.chars(text, lineNo);
                    }
                    return '';
                });
                parseEndTag('', stack.last());
            }
            if (html === last) {
                throw new Error('Parse Error: ' + html);
            }
            last = html;
        }
        callChars();
        parseEndTag();
        handler.done(lineNo);
        return intermediate;
    };
    var callAttrStart = function (state, curIndex, handler, rest, lineNo) {
        var attrName = rest.substring(typeof state.nameStart === 'number' ? state.nameStart : curIndex, curIndex), newAttrName = encoder.encode(attrName);
        state.attrStart = newAttrName;
        handler.attrStart(state.attrStart, lineNo);
        state.inName = false;
    };
    var callAttrEnd = function (state, curIndex, handler, rest, lineNo) {
        if (state.valueStart !== undefined && state.valueStart < curIndex) {
            var val = rest.substring(state.valueStart, curIndex);
            handler.attrValue(val, lineNo);
        }
        handler.attrEnd(state.attrStart, lineNo);
        state.attrStart = undefined;
        state.valueStart = undefined;
        state.inValue = false;
        state.inName = false;
        state.lookingForEq = false;
        state.inQuote = false;
        state.lookingForName = true;
    };
    var findBreak = function (str, magicStart) {
        var magicLength = magicStart.length;
        for (var i = 0, len = str.length; i < len; i++) {
            if (str[i] === '<' || str.substr(i, magicLength) === magicStart) {
                return i;
            }
        }
        return -1;
    };
    HTMLParser.parseAttrs = function (rest, handler, lineNo) {
        if (!rest) {
            return;
        }
        var i = 0;
        var curIndex;
        var state = {
            inName: false,
            nameStart: undefined,
            inValue: false,
            valueStart: undefined,
            inQuote: false,
            attrStart: undefined,
            lookingForName: true,
            lookingForValue: false,
            lookingForEq: false
        };
        while (i < rest.length) {
            curIndex = i;
            var cur = rest.charAt(i);
            i++;
            if (magicStart === rest.substr(curIndex, magicStart.length)) {
                if (state.inValue && curIndex > state.valueStart) {
                    handler.attrValue(rest.substring(state.valueStart, curIndex), lineNo);
                } else if (state.inName && state.nameStart < curIndex) {
                    callAttrStart(state, curIndex, handler, rest, lineNo);
                    callAttrEnd(state, curIndex, handler, rest, lineNo);
                } else if (state.lookingForValue) {
                    state.inValue = true;
                } else if (state.lookingForEq && state.attrStart) {
                    callAttrEnd(state, curIndex, handler, rest, lineNo);
                }
                magicMatch.lastIndex = curIndex;
                var match = magicMatch.exec(rest);
                if (match) {
                    handler.special(match[1], lineNo);
                    i = curIndex + match[0].length;
                    if (state.inValue) {
                        state.valueStart = curIndex + match[0].length;
                    }
                }
            } else if (state.inValue) {
                if (state.inQuote) {
                    if (cur === state.inQuote) {
                        callAttrEnd(state, curIndex, handler, rest, lineNo);
                    }
                } else if (space.test(cur)) {
                    callAttrEnd(state, curIndex, handler, rest, lineNo);
                }
            } else if (cur === '=' && (state.lookingForEq || state.lookingForName || state.inName)) {
                if (!state.attrStart) {
                    callAttrStart(state, curIndex, handler, rest, lineNo);
                }
                state.lookingForValue = true;
                state.lookingForEq = false;
                state.lookingForName = false;
            } else if (state.inName) {
                var started = rest[state.nameStart], otherStart, otherOpposite;
                if (startOppositesMap[started] === cur) {
                    otherStart = started === '{' ? '(' : '{';
                    otherOpposite = startOppositesMap[otherStart];
                    if (rest[curIndex + 1] === otherOpposite) {
                        callAttrStart(state, curIndex + 2, handler, rest, lineNo);
                        i++;
                    } else {
                        callAttrStart(state, curIndex + 1, handler, rest, lineNo);
                    }
                    state.lookingForEq = true;
                } else if (space.test(cur) && started !== '{' && started !== '(') {
                    callAttrStart(state, curIndex, handler, rest, lineNo);
                    state.lookingForEq = true;
                }
            } else if (state.lookingForName) {
                if (!space.test(cur)) {
                    if (state.attrStart) {
                        callAttrEnd(state, curIndex, handler, rest, lineNo);
                    }
                    state.nameStart = curIndex;
                    state.inName = true;
                }
            } else if (state.lookingForValue) {
                if (!space.test(cur)) {
                    state.lookingForValue = false;
                    state.inValue = true;
                    if (cur === '\'' || cur === '"') {
                        state.inQuote = cur;
                        state.valueStart = curIndex + 1;
                    } else {
                        state.valueStart = curIndex;
                    }
                } else if (i === rest.length) {
                    callAttrEnd(state, curIndex, handler, rest, lineNo);
                }
            }
        }
        if (state.inName) {
            callAttrStart(state, curIndex + 1, handler, rest, lineNo);
            callAttrEnd(state, curIndex + 1, handler, rest, lineNo);
        } else if (state.lookingForEq || state.lookingForValue || state.inValue) {
            callAttrEnd(state, curIndex + 1, handler, rest, lineNo);
        }
        magicMatch.lastIndex = 0;
    };
    HTMLParser.searchStartTag = function (html) {
        var closingIndex = html.indexOf('>');
        var attributeRange = attributeRegexp.exec(html.substring(1));
        var afterAttributeOffset = 1;
        while (attributeRange && closingIndex >= afterAttributeOffset + attributeRange.index) {
            afterAttributeOffset += attributeRange.index + attributeRange[0].length;
            while (closingIndex < afterAttributeOffset) {
                closingIndex += html.substring(closingIndex + 1).indexOf('>') + 1;
            }
            attributeRange = attributeRegexp.exec(html.substring(afterAttributeOffset));
        }
        if (closingIndex === -1 || !alphaRegex.test(html[1])) {
            return null;
        }
        var tagName, tagContent, match, rest = '', unary = '';
        var startTag = html.substring(0, closingIndex + 1);
        var isUnary = startTag[startTag.length - 2] === '/';
        var spaceIndex = startTag.search(space);
        if (isUnary) {
            unary = '/';
            tagContent = startTag.substring(1, startTag.length - 2).trim();
        } else {
            tagContent = startTag.substring(1, startTag.length - 1).trim();
        }
        if (spaceIndex === -1) {
            tagName = tagContent;
        } else {
            spaceIndex--;
            tagName = tagContent.substring(0, spaceIndex);
            rest = tagContent.substring(spaceIndex);
        }
        match = [
            startTag,
            tagName,
            rest,
            unary
        ];
        return {
            match: match,
            html: html.substring(startTag.length)
        };
    };
    module.exports = namespace.HTMLParser = HTMLParser;
});
/*can-dom-mutate@1.3.6#node/node*/
define('can-dom-mutate@1.3.6#node/node', [
    'require',
    'exports',
    'module',
    'can-globals',
    'can-namespace',
    '../can-dom-mutate',
    '../-util'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals');
        var namespace = require('can-namespace');
        var domMutate = require('../can-dom-mutate');
        var util = require('../-util');
        var isInDocument = util.isInDocument;
        var getParents = util.getParents;
        var synthetic = {
            dispatchNodeInsertion: function (container, node) {
                if (isInDocument(node)) {
                    domMutate.dispatchNodeInsertion(node);
                }
            },
            dispatchNodeRemoval: function (container, node) {
                if (isInDocument(container) && !isInDocument(node)) {
                    domMutate.dispatchNodeRemoval(node);
                }
            }
        };
        var compat = {
            replaceChild: function (newChild, oldChild) {
                var newChildren = getParents(newChild);
                var result = this.replaceChild(newChild, oldChild);
                synthetic.dispatchNodeRemoval(this, oldChild);
                for (var i = 0; i < newChildren.length; i++) {
                    synthetic.dispatchNodeInsertion(this, newChildren[i]);
                }
                return result;
            },
            setAttribute: function (name, value) {
                var oldAttributeValue = this.getAttribute(name);
                var result = this.setAttribute(name, value);
                var newAttributeValue = this.getAttribute(name);
                if (oldAttributeValue !== newAttributeValue) {
                    domMutate.dispatchNodeAttributeChange(this, name, oldAttributeValue);
                }
                return result;
            },
            removeAttribute: function (name) {
                var oldAttributeValue = this.getAttribute(name);
                var result = this.removeAttribute(name);
                if (oldAttributeValue) {
                    domMutate.dispatchNodeAttributeChange(this, name, oldAttributeValue);
                }
                return result;
            }
        };
        var compatData = [
            [
                'appendChild',
                'Insertion'
            ],
            [
                'insertBefore',
                'Insertion'
            ],
            [
                'removeChild',
                'Removal'
            ]
        ];
        compatData.forEach(function (pair) {
            var nodeMethod = pair[0];
            var dispatchMethod = 'dispatchNode' + pair[1];
            compat[nodeMethod] = function (node) {
                var nodes = getParents(node);
                var result = this[nodeMethod].apply(this, arguments);
                for (var i = 0; i < nodes.length; i++) {
                    synthetic[dispatchMethod](this, nodes[i]);
                }
                return result;
            };
        });
        var normal = {};
        var nodeMethods = [
            'appendChild',
            'insertBefore',
            'removeChild',
            'replaceChild',
            'setAttribute',
            'removeAttribute'
        ];
        nodeMethods.forEach(function (methodName) {
            normal[methodName] = function () {
                return this[methodName].apply(this, arguments);
            };
        });
        var mutate = {};
        function setMutateStrategy(observer) {
            var strategy = observer ? normal : compat;
            for (var key in strategy) {
                mutate[key] = strategy[key];
            }
        }
        var mutationObserverKey = 'MutationObserver';
        setMutateStrategy(globals.getKeyValue(mutationObserverKey));
        globals.onKeyValue(mutationObserverKey, setMutateStrategy);
        module.exports = namespace.domMutateNode = domMutate.node = mutate;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-dom-mutate@1.3.6#node*/
define('can-dom-mutate@1.3.6#node', [
    'require',
    'exports',
    'module',
    'can-namespace',
    './node/node'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var node = require('./node/node');
    module.exports = namespace.node = node;
});
/*can-view-nodelist@4.3.3#can-view-nodelist*/
define('can-view-nodelist@4.3.3#can-view-nodelist', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-dom-mutate/node'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var domMutate = require('can-dom-mutate/node');
    var nodeMap = new Map(), splice = [].splice, push = [].push, itemsInChildListTree = function (list) {
            var count = 0;
            for (var i = 0, len = list.length; i < len; i++) {
                var item = list[i];
                if (item.nodeType) {
                    count++;
                } else {
                    count += itemsInChildListTree(item);
                }
            }
            return count;
        }, replacementMap = function (replacements) {
            var map = new Map();
            for (var i = 0, len = replacements.length; i < len; i++) {
                var node = nodeLists.first(replacements[i]);
                map.set(node, replacements[i]);
            }
            return map;
        }, addUnfoundAsDeepChildren = function (list, rMap) {
            rMap.forEach(function (replacement) {
                list.newDeepChildren.push(replacement);
            });
        };
    var nodeLists = {
        update: function (nodeList, newNodes, oldNodes) {
            if (!oldNodes) {
                oldNodes = nodeLists.unregisterChildren(nodeList);
            }
            var arr = [];
            for (var i = 0, ref = arr.length = newNodes.length; i < ref; i++) {
                arr[i] = newNodes[i];
            }
            newNodes = arr;
            var oldListLength = nodeList.length;
            splice.apply(nodeList, [
                0,
                oldListLength
            ].concat(newNodes));
            if (nodeList.replacements) {
                nodeLists.nestReplacements(nodeList);
                nodeList.deepChildren = nodeList.newDeepChildren;
                nodeList.newDeepChildren = [];
            } else {
                nodeLists.nestList(nodeList);
            }
            return oldNodes;
        },
        nestReplacements: function (list) {
            var index = 0, rMap = replacementMap(list.replacements), rCount = list.replacements.length;
            while (index < list.length && rCount) {
                var node = list[index], replacement = rMap.get(node);
                if (replacement) {
                    rMap['delete'](node);
                    list.splice(index, itemsInChildListTree(replacement), replacement);
                    rCount--;
                }
                index++;
            }
            if (rCount) {
                addUnfoundAsDeepChildren(list, rMap);
            }
            list.replacements = [];
        },
        nestList: function (list) {
            var index = 0;
            while (index < list.length) {
                var node = list[index], childNodeList = nodeMap.get(node);
                if (childNodeList) {
                    if (childNodeList !== list) {
                        list.splice(index, itemsInChildListTree(childNodeList), childNodeList);
                    }
                } else {
                    nodeMap.set(node, list);
                }
                index++;
            }
        },
        last: function (nodeList) {
            var last = nodeList[nodeList.length - 1];
            if (last.nodeType) {
                return last;
            } else {
                return nodeLists.last(last);
            }
        },
        first: function (nodeList) {
            var first = nodeList[0];
            if (first.nodeType) {
                return first;
            } else {
                return nodeLists.first(first);
            }
        },
        flatten: function (nodeList) {
            var items = [];
            for (var i = 0; i < nodeList.length; i++) {
                var item = nodeList[i];
                if (item.nodeType) {
                    items.push(item);
                } else {
                    items.push.apply(items, nodeLists.flatten(item));
                }
            }
            return items;
        },
        register: function (nodeList, unregistered, parent, directlyNested) {
            nodeList.unregistered = unregistered;
            nodeList.parentList = parent;
            nodeList.nesting = parent && typeof parent.nesting !== 'undefined' ? parent.nesting + 1 : 0;
            if (parent) {
                nodeList.deepChildren = [];
                nodeList.newDeepChildren = [];
                nodeList.replacements = [];
                if (parent !== true) {
                    if (directlyNested) {
                        parent.replacements.push(nodeList);
                    } else {
                        parent.newDeepChildren.push(nodeList);
                    }
                }
            } else {
                nodeLists.nestList(nodeList);
            }
            return nodeList;
        },
        unregisterChildren: function (nodeList) {
            var nodes = [];
            for (var n = 0; n < nodeList.length; n++) {
                var node = nodeList[n];
                if (node.nodeType) {
                    if (!nodeList.replacements) {
                        nodeMap['delete'](node);
                    }
                    nodes.push(node);
                } else {
                    push.apply(nodes, nodeLists.unregister(node, true));
                }
            }
            var deepChildren = nodeList.deepChildren;
            if (deepChildren) {
                for (var l = 0; l < deepChildren.length; l++) {
                    nodeLists.unregister(deepChildren[l], true);
                }
            }
            return nodes;
        },
        unregister: function (nodeList, isChild) {
            var nodes = nodeLists.unregisterChildren(nodeList, true);
            nodeList.isUnregistered = true;
            if (nodeList.unregistered) {
                var unregisteredCallback = nodeList.unregistered;
                nodeList.replacements = nodeList.unregistered = null;
                if (!isChild) {
                    var deepChildren = nodeList.parentList && nodeList.parentList.deepChildren;
                    if (deepChildren) {
                        var index = deepChildren.indexOf(nodeList);
                        if (index !== -1) {
                            deepChildren.splice(index, 1);
                        }
                    }
                }
                unregisteredCallback();
            }
            return nodes;
        },
        after: function (oldElements, newFrag) {
            var last = oldElements[oldElements.length - 1];
            if (last.nextSibling) {
                domMutate.insertBefore.call(last.parentNode, newFrag, last.nextSibling);
            } else {
                domMutate.appendChild.call(last.parentNode, newFrag);
            }
        },
        replace: function (oldElements, newFrag) {
            var selectedValue, parentNode = oldElements[0].parentNode;
            if (parentNode.nodeName.toUpperCase() === 'SELECT' && parentNode.selectedIndex >= 0) {
                selectedValue = parentNode.value;
            }
            if (oldElements.length === 1) {
                domMutate.replaceChild.call(parentNode, newFrag, oldElements[0]);
            } else {
                nodeLists.after(oldElements, newFrag);
                nodeLists.remove(oldElements);
            }
            if (selectedValue !== undefined) {
                parentNode.value = selectedValue;
            }
        },
        remove: function (elementsToBeRemoved) {
            var parent = elementsToBeRemoved[0] && elementsToBeRemoved[0].parentNode;
            var child;
            for (var i = 0; i < elementsToBeRemoved.length; i++) {
                child = elementsToBeRemoved[i];
                if (child.parentNode === parent) {
                    domMutate.removeChild.call(parent, child);
                }
            }
        },
        nodeMap: nodeMap
    };
    module.exports = namespace.nodeLists = nodeLists;
});
/*can-child-nodes@1.2.0#can-child-nodes*/
define('can-child-nodes@1.2.0#can-child-nodes', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    function childNodes(node) {
        var childNodes = node.childNodes;
        if ('length' in childNodes) {
            return childNodes;
        } else {
            var cur = node.firstChild;
            var nodes = [];
            while (cur) {
                nodes.push(cur);
                cur = cur.nextSibling;
            }
            return nodes;
        }
    }
    module.exports = namespace.childNodes = childNodes;
});
/*can-fragment@1.3.0#can-fragment*/
define('can-fragment@1.3.0#can-fragment', [
    'require',
    'exports',
    'module',
    'can-globals/document/document',
    'can-namespace',
    'can-reflect',
    'can-child-nodes',
    'can-symbol'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getDocument = require('can-globals/document/document');
        var namespace = require('can-namespace');
        var canReflect = require('can-reflect');
        var childNodes = require('can-child-nodes');
        var canSymbol = require('can-symbol');
        var fragmentRE = /^\s*<(\w+)[^>]*>/, toString = {}.toString, toDOMSymbol = canSymbol.for('can.toDOM');
        function makeFragment(html, name, doc) {
            if (name === undefined) {
                name = fragmentRE.test(html) && RegExp.$1;
            }
            if (html && toString.call(html.replace) === '[object Function]') {
                html = html.replace(/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, '<$1></$2>');
            }
            var container = doc.createElement('div'), temp = doc.createElement('div');
            if (name === 'tbody' || name === 'tfoot' || name === 'thead' || name === 'colgroup') {
                temp.innerHTML = '<table>' + html + '</table>';
                container = temp.firstChild.nodeType === 3 ? temp.lastChild : temp.firstChild;
            } else if (name === 'col') {
                temp.innerHTML = '<table><colgroup>' + html + '</colgroup></table>';
                container = temp.firstChild.nodeType === 3 ? temp.lastChild : temp.firstChild.firstChild;
            } else if (name === 'tr') {
                temp.innerHTML = '<table><tbody>' + html + '</tbody></table>';
                container = temp.firstChild.nodeType === 3 ? temp.lastChild : temp.firstChild.firstChild;
            } else if (name === 'td' || name === 'th') {
                temp.innerHTML = '<table><tbody><tr>' + html + '</tr></tbody></table>';
                container = temp.firstChild.nodeType === 3 ? temp.lastChild : temp.firstChild.firstChild.firstChild;
            } else if (name === 'option') {
                temp.innerHTML = '<select>' + html + '</select>';
                container = temp.firstChild.nodeType === 3 ? temp.lastChild : temp.firstChild;
            } else {
                container.innerHTML = '' + html;
            }
            return [].slice.call(childNodes(container));
        }
        function fragment(html, doc) {
            if (html && html.nodeType === 11) {
                return html;
            }
            if (!doc) {
                doc = getDocument();
            } else if (doc.length) {
                doc = doc[0];
            }
            var parts = makeFragment(html, undefined, doc), frag = (doc || document).createDocumentFragment();
            for (var i = 0, length = parts.length; i < length; i++) {
                frag.appendChild(parts[i]);
            }
            return frag;
        }
        var makeFrag = function (item, doc) {
            var document = doc || getDocument();
            var frag;
            if (!item || typeof item === 'string') {
                frag = fragment(item == null ? '' : '' + item, document);
            } else if (typeof item[toDOMSymbol] === 'function') {
                return makeFrag(item[toDOMSymbol]());
            } else if (item.nodeType === 11) {
                return item;
            } else if (typeof item.nodeType === 'number') {
                frag = document.createDocumentFragment();
                frag.appendChild(item);
                return frag;
            } else if (canReflect.isListLike(item)) {
                frag = document.createDocumentFragment();
                canReflect.eachIndex(item, function (item) {
                    frag.appendChild(makeFrag(item));
                });
            } else {
                frag = fragment('' + item, document);
            }
            if (!childNodes(frag).length) {
                frag.appendChild(document.createTextNode(''));
            }
            return frag;
        };
        module.exports = namespace.fragment = namespace.frag = makeFrag;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-view-callbacks@4.3.6#can-view-callbacks*/
define('can-view-callbacks@4.3.6#can-view-callbacks', [
    'require',
    'exports',
    'module',
    'can-observation-recorder',
    'can-log/dev/dev',
    'can-globals/global/global',
    'can-globals/document/document',
    'can-dom-mutate',
    'can-dom-mutate/node',
    'can-namespace',
    'can-view-nodelist',
    'can-fragment',
    'can-globals',
    'can-symbol',
    'can-reflect'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var ObservationRecorder = require('can-observation-recorder');
        var dev = require('can-log/dev/dev');
        var getGlobal = require('can-globals/global/global');
        var getDocument = require('can-globals/document/document');
        var domMutate = require('can-dom-mutate');
        var domMutateNode = require('can-dom-mutate/node');
        var namespace = require('can-namespace');
        var nodeLists = require('can-view-nodelist');
        var makeFrag = require('can-fragment');
        var globals = require('can-globals');
        var canSymbol = require('can-symbol');
        var canReflect = require('can-reflect');
        var callbackMapSymbol = canSymbol.for('can.callbackMap');
        var tags = {};
        var automountEnabled = function () {
            var document = globals.getKeyValue('document');
            if (document == null || document.documentElement == null) {
                return false;
            }
            return document.documentElement.getAttribute('data-can-automount') !== 'false';
        };
        var renderedElements = new WeakMap();
        var mountElement = function (node) {
            var tagName = node.tagName && node.tagName.toLowerCase();
            var tagHandler = tags[tagName];
            if (tagHandler) {
                callbacks.tagHandler(node, tagName, {});
            }
        };
        var mutationObserverEnabled = false;
        var disableMutationObserver;
        var enableMutationObserver = function () {
            var docEl = getDocument().documentElement;
            if (mutationObserverEnabled) {
                if (mutationObserverEnabled === docEl) {
                    return;
                }
                disableMutationObserver();
            }
            var undoOnInsertionHandler = domMutate.onInsertion(docEl, function (mutation) {
                mountElement(mutation.target);
            });
            mutationObserverEnabled = true;
            disableMutationObserver = function () {
                undoOnInsertionHandler();
                mutationObserverEnabled = false;
            };
        };
        var renderTagsInDocument = function (tagName) {
            var nodes = getDocument().getElementsByTagName(tagName);
            for (var i = 0, node; (node = nodes[i]) !== undefined; i++) {
                mountElement(node);
            }
        };
        var attr = function (attributeName, attrHandler) {
            if (attrHandler) {
                if (typeof attributeName === 'string') {
                    attributes[attributeName] = attrHandler;
                } else {
                    regExpAttributes.push({
                        match: attributeName,
                        handler: attrHandler
                    });
                }
            } else {
                var cb = attributes[attributeName];
                if (!cb) {
                    for (var i = 0, len = regExpAttributes.length; i < len; i++) {
                        var attrMatcher = regExpAttributes[i];
                        if (attrMatcher.match.test(attributeName)) {
                            return attrMatcher.handler;
                        }
                    }
                }
                return cb;
            }
        };
        var attrs = function (attrMap) {
            var map = canReflect.getKeyValue(attrMap, callbackMapSymbol) || attrMap;
            if (attrMaps.has(map)) {
                return;
            } else {
                attrMaps.set(map, true);
            }
            canReflect.eachKey(map, function (callback, exp) {
                attr(exp, callback);
            });
        };
        var attributes = {}, regExpAttributes = [], attrMaps = new WeakMap(), automaticCustomElementCharacters = /[-\:]/;
        var defaultCallback = function () {
        };
        var tag = function (tagName, tagHandler) {
            if (tagHandler) {
                var GLOBAL = getGlobal();
                var validCustomElementName = automaticCustomElementCharacters.test(tagName), tagExists = typeof tags[tagName.toLowerCase()] !== 'undefined', customElementExists;
                if (GLOBAL.html5) {
                    GLOBAL.html5.elements += ' ' + tagName;
                    GLOBAL.html5.shivDocument();
                }
                tags[tagName.toLowerCase()] = tagHandler;
                if (automountEnabled()) {
                    var customElements = globals.getKeyValue('customElements');
                    if (customElements) {
                        customElementExists = customElements.get(tagName.toLowerCase());
                        if (validCustomElementName && !customElementExists) {
                            var CustomElement = function () {
                                return Reflect.construct(HTMLElement, [], CustomElement);
                            };
                            CustomElement.prototype = Object.create(HTMLElement.prototype);
                            CustomElement.prototype.connectedCallback = function () {
                                callbacks.tagHandler(this, tagName.toLowerCase(), {});
                            };
                            customElements.define(tagName, CustomElement);
                        }
                    } else {
                        enableMutationObserver();
                        renderTagsInDocument(tagName);
                    }
                } else if (mutationObserverEnabled) {
                    disableMutationObserver();
                }
            } else {
                var cb;
                if (tagHandler === null) {
                    delete tags[tagName.toLowerCase()];
                } else {
                    cb = tags[tagName.toLowerCase()];
                }
                if (!cb && automaticCustomElementCharacters.test(tagName)) {
                    cb = defaultCallback;
                }
                return cb;
            }
        };
        var callbacks = {
            _tags: tags,
            _attributes: attributes,
            _regExpAttributes: regExpAttributes,
            defaultCallback: defaultCallback,
            tag: tag,
            attr: attr,
            attrs: attrs,
            tagHandler: function (el, tagName, tagData) {
                if (renderedElements.has(el)) {
                    return;
                }
                var scope = tagData.scope, helperTagCallback = scope && scope.templateContext.tags.get(tagName), tagCallback = helperTagCallback || tags[tagName], res;
                if (tagCallback) {
                    res = ObservationRecorder.ignore(tagCallback)(el, tagData);
                    renderedElements.set(el, true);
                } else {
                    res = scope;
                }
                if (res && tagData.subtemplate) {
                    if (scope !== res) {
                        scope = scope.add(res);
                    }
                    var nodeList = nodeLists.register([], undefined, tagData.parentNodeList || true, false);
                    nodeList.expression = '<' + el.tagName + '>';
                    var result = tagData.subtemplate(scope, tagData.options, nodeList);
                    var frag = typeof result === 'string' ? makeFrag(result) : result;
                    domMutateNode.appendChild.call(el, frag);
                }
            }
        };
        namespace.view = namespace.view || {};
        if (namespace.view.callbacks) {
            throw new Error('You can\'t have two versions of can-view-callbacks, check your dependencies');
        } else {
            module.exports = namespace.view.callbacks = callbacks;
        }
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-view-target@4.1.2#can-view-target*/
define('can-view-target@4.1.2#can-view-target', [
    'require',
    'exports',
    'module',
    'can-globals/document/document',
    'can-dom-mutate/node',
    'can-namespace',
    'can-globals/mutation-observer/mutation-observer'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getDocument = require('can-globals/document/document');
        var domMutate = require('can-dom-mutate/node');
        var namespace = require('can-namespace');
        var MUTATION_OBSERVER = require('can-globals/mutation-observer/mutation-observer');
        var processNodes = function (nodes, paths, location, document) {
                var frag = document.createDocumentFragment();
                for (var i = 0, len = nodes.length; i < len; i++) {
                    var node = nodes[i];
                    frag.appendChild(processNode(node, paths, location.concat(i), document));
                }
                return frag;
            }, keepsTextNodes = typeof document !== 'undefined' && function () {
                var testFrag = document.createDocumentFragment();
                var div = document.createElement('div');
                div.appendChild(document.createTextNode(''));
                div.appendChild(document.createTextNode(''));
                testFrag.appendChild(div);
                var cloned = testFrag.cloneNode(true);
                return cloned.firstChild.childNodes.length === 2;
            }(), clonesWork = typeof document !== 'undefined' && function () {
                var el = document.createElement('a');
                el.innerHTML = '<xyz></xyz>';
                var clone = el.cloneNode(true);
                var works = clone.innerHTML === '<xyz></xyz>';
                var MO, observer;
                if (works) {
                    el = document.createDocumentFragment();
                    el.appendChild(document.createTextNode('foo-bar'));
                    MO = MUTATION_OBSERVER();
                    if (MO) {
                        observer = new MO(function () {
                        });
                        observer.observe(document.documentElement, {
                            childList: true,
                            subtree: true
                        });
                        clone = el.cloneNode(true);
                        observer.disconnect();
                    } else {
                        clone = el.cloneNode(true);
                    }
                    return clone.childNodes.length === 1;
                }
                return works;
            }(), namespacesWork = typeof document !== 'undefined' && !!document.createElementNS;
        var cloneNode = clonesWork ? function (el) {
            return el.cloneNode(true);
        } : function (node) {
            var document = node.ownerDocument;
            var copy;
            if (node.nodeType === 1) {
                if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml' && namespacesWork && document.createElementNS) {
                    copy = document.createElementNS(node.namespaceURI, node.nodeName);
                } else {
                    copy = document.createElement(node.nodeName);
                }
            } else if (node.nodeType === 3) {
                copy = document.createTextNode(node.nodeValue);
            } else if (node.nodeType === 8) {
                copy = document.createComment(node.nodeValue);
            } else if (node.nodeType === 11) {
                copy = document.createDocumentFragment();
            }
            if (node.attributes) {
                var attributes = node.attributes;
                for (var i = 0; i < attributes.length; i++) {
                    var attribute = attributes[i];
                    if (attribute && attribute.specified) {
                        if (attribute.namespaceURI) {
                            copy.setAttributeNS(attribute.namespaceURI, attribute.nodeName || attribute.name, attribute.nodeValue || attribute.value);
                        } else {
                            copy.setAttribute(attribute.nodeName || attribute.name, attribute.nodeValue || attribute.value);
                        }
                    }
                }
            }
            if (node && node.firstChild) {
                var child = node.firstChild;
                while (child) {
                    copy.appendChild(cloneNode(child));
                    child = child.nextSibling;
                }
            }
            return copy;
        };
        function processNode(node, paths, location, document) {
            var callback, loc = location, nodeType = typeof node, el, p, i, len;
            var getCallback = function () {
                if (!callback) {
                    callback = {
                        path: location,
                        callbacks: []
                    };
                    paths.push(callback);
                    loc = [];
                }
                return callback;
            };
            if (nodeType === 'object') {
                if (node.tag) {
                    if (namespacesWork && node.namespace) {
                        el = document.createElementNS(node.namespace, node.tag);
                    } else {
                        el = document.createElement(node.tag);
                    }
                    if (node.attrs) {
                        for (var attrName in node.attrs) {
                            var value = node.attrs[attrName];
                            if (typeof value === 'function') {
                                getCallback().callbacks.push({ callback: value });
                            } else if (value !== null && typeof value === 'object' && value.namespaceURI) {
                                el.setAttributeNS(value.namespaceURI, attrName, value.value);
                            } else {
                                domMutate.setAttribute.call(el, attrName, value);
                            }
                        }
                    }
                    if (node.attributes) {
                        for (i = 0, len = node.attributes.length; i < len; i++) {
                            getCallback().callbacks.push({ callback: node.attributes[i] });
                        }
                    }
                    if (node.children && node.children.length) {
                        if (callback) {
                            p = callback.paths = [];
                        } else {
                            p = paths;
                        }
                        el.appendChild(processNodes(node.children, p, loc, document));
                    }
                } else if (node.comment) {
                    el = document.createComment(node.comment);
                    if (node.callbacks) {
                        for (i = 0, len = node.attributes.length; i < len; i++) {
                            getCallback().callbacks.push({ callback: node.callbacks[i] });
                        }
                    }
                }
            } else if (nodeType === 'string') {
                el = document.createTextNode(node);
            } else if (nodeType === 'function') {
                if (keepsTextNodes) {
                    el = document.createTextNode('');
                    getCallback().callbacks.push({ callback: node });
                } else {
                    el = document.createComment('~');
                    getCallback().callbacks.push({
                        callback: function () {
                            var el = document.createTextNode('');
                            domMutate.replaceChild.call(this.parentNode, el, this);
                            return node.apply(el, arguments);
                        }
                    });
                }
            }
            return el;
        }
        function getCallbacks(el, pathData, elementCallbacks) {
            var path = pathData.path, callbacks = pathData.callbacks, paths = pathData.paths, child = el, pathLength = path ? path.length : 0, pathsLength = paths ? paths.length : 0;
            for (var i = 0; i < pathLength; i++) {
                child = child.childNodes.item(path[i]);
            }
            for (i = 0; i < pathsLength; i++) {
                getCallbacks(child, paths[i], elementCallbacks);
            }
            elementCallbacks.push({
                element: child,
                callbacks: callbacks
            });
        }
        function hydrateCallbacks(callbacks, args) {
            var len = callbacks.length, callbacksLength, callbackElement, callbackData;
            for (var i = 0; i < len; i++) {
                callbackData = callbacks[i];
                callbacksLength = callbackData.callbacks.length;
                callbackElement = callbackData.element;
                for (var c = 0; c < callbacksLength; c++) {
                    callbackData.callbacks[c].callback.apply(callbackElement, args);
                }
            }
        }
        function makeTarget(nodes, doc) {
            var paths = [];
            var frag = processNodes(nodes, paths, [], doc || getDocument());
            return {
                paths: paths,
                clone: frag,
                hydrate: function () {
                    var cloned = cloneNode(this.clone);
                    var args = [];
                    for (var a = 0, ref = args.length = arguments.length; a < ref; a++) {
                        args[a] = arguments[a];
                    }
                    var callbacks = [];
                    for (var i = 0; i < paths.length; i++) {
                        getCallbacks(cloned, paths[i], callbacks);
                    }
                    hydrateCallbacks(callbacks, args);
                    return cloned;
                }
            };
        }
        makeTarget.keepsTextNodes = keepsTextNodes;
        makeTarget.cloneNode = cloneNode;
        namespace.view = namespace.view || {};
        module.exports = namespace.view.target = makeTarget;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-simple-map@4.3.0#can-simple-map*/
define('can-simple-map@4.3.0#can-simple-map', [
    'require',
    'exports',
    'module',
    'can-construct',
    'can-event-queue/map/map',
    'can-queues',
    'can-observation-recorder',
    'can-reflect',
    'can-log/dev/dev',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var Construct = require('can-construct');
    var eventQueue = require('can-event-queue/map/map');
    var queues = require('can-queues');
    var ObservationRecorder = require('can-observation-recorder');
    var canReflect = require('can-reflect');
    var dev = require('can-log/dev/dev');
    var canSymbol = require('can-symbol');
    var ensureMeta = function ensureMeta(obj) {
        var metaSymbol = canSymbol.for('can.meta');
        var meta = obj[metaSymbol];
        if (!meta) {
            meta = {};
            canReflect.setKeyValue(obj, metaSymbol, meta);
        }
        return meta;
    };
    var SimpleMap = Construct.extend('SimpleMap', {
        setup: function (initialData) {
            this._data = {};
            if (initialData && typeof initialData === 'object') {
                this.attr(initialData);
            }
        },
        attr: function (prop, value) {
            var self = this;
            if (arguments.length === 0) {
                ObservationRecorder.add(this, 'can.keys');
                var data = {};
                canReflect.eachKey(this._data, function (value, prop) {
                    ObservationRecorder.add(this, prop);
                    data[prop] = value;
                }, this);
                return data;
            } else if (arguments.length > 1) {
                var had = this._data.hasOwnProperty(prop);
                var old = this._data[prop];
                this._data[prop] = value;
                if (old !== value) {
                    var dispatched = {
                        keyChanged: !had ? prop : undefined,
                        type: prop
                    };
                    this.dispatch(dispatched, [
                        value,
                        old
                    ]);
                }
            } else if (typeof prop === 'object') {
                queues.batch.start();
                canReflect.eachKey(prop, function (value, key) {
                    self.attr(key, value);
                });
                queues.batch.stop();
            } else {
                if (prop !== 'constructor') {
                    ObservationRecorder.add(this, prop);
                    return this._data[prop];
                }
                return this.constructor;
            }
        },
        serialize: function () {
            return canReflect.serialize(this, Map);
        },
        get: function () {
            return this.attr.apply(this, arguments);
        },
        set: function () {
            return this.attr.apply(this, arguments);
        },
        log: function (key) {
        }
    });
    eventQueue(SimpleMap.prototype);
    var simpleMapProto = {
        'can.isMapLike': true,
        'can.isListLike': false,
        'can.isValueLike': false,
        'can.getKeyValue': SimpleMap.prototype.get,
        'can.setKeyValue': SimpleMap.prototype.set,
        'can.deleteKeyValue': function (prop) {
            var dispatched;
            if (this._data.hasOwnProperty(prop)) {
                var old = this._data[prop];
                delete this._data[prop];
                dispatched = {
                    keyChanged: prop,
                    type: prop
                };
                this.dispatch(dispatched, [
                    undefined,
                    old
                ]);
            }
        },
        'can.getOwnEnumerableKeys': function () {
            ObservationRecorder.add(this, 'can.keys');
            return Object.keys(this._data);
        },
        'can.assignDeep': function (source) {
            queues.batch.start();
            canReflect.assignMap(this, source);
            queues.batch.stop();
        },
        'can.updateDeep': function (source) {
            queues.batch.start();
            canReflect.updateMap(this, source);
            queues.batch.stop();
        },
        'can.keyHasDependencies': function (key) {
            return false;
        },
        'can.getKeyDependencies': function (key) {
            return undefined;
        },
        'can.hasOwnKey': function (key) {
            return this._data.hasOwnProperty(key);
        }
    };
    canReflect.assignSymbols(SimpleMap.prototype, simpleMapProto);
    module.exports = SimpleMap;
});
/*can-view-scope@4.13.0#template-context*/
define('can-view-scope@4.13.0#template-context', [
    'require',
    'exports',
    'module',
    'can-simple-map'
], function (require, exports, module) {
    'use strict';
    var SimpleMap = require('can-simple-map');
    var TemplateContext = function (options) {
        options = options || {};
        this.vars = new SimpleMap(options.vars || {});
        this.helpers = new SimpleMap(options.helpers || {});
        this.partials = new SimpleMap(options.partials || {});
        this.tags = new SimpleMap(options.tags || {});
    };
    module.exports = TemplateContext;
});
/*can-cid@1.3.0#can-cid*/
define('can-cid@1.3.0#can-cid', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var _cid = 0;
    var domExpando = 'can' + new Date();
    var cid = function (object, name) {
        var propertyName = object.nodeName ? domExpando : '_cid';
        if (!object[propertyName]) {
            _cid++;
            object[propertyName] = (name || '') + _cid;
        }
        return object[propertyName];
    };
    cid.domExpando = domExpando;
    cid.get = function (object) {
        var type = typeof object;
        var isObject = type !== null && (type === 'object' || type === 'function');
        return isObject ? cid(object) : type + ':' + object;
    };
    if (namespace.cid) {
        throw new Error('You can\'t have two versions of can-cid, check your dependencies');
    } else {
        module.exports = namespace.cid = cid;
    }
});
/*can-single-reference@1.2.0#can-single-reference*/
define('can-single-reference@1.2.0#can-single-reference', [
    'require',
    'exports',
    'module',
    'can-cid'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var CID = require('can-cid');
        var singleReference;
        function getKeyName(key, extraKey) {
            var keyName = extraKey ? CID(key) + ':' + extraKey : CID(key);
            return keyName || key;
        }
        singleReference = {
            set: function (obj, key, value, extraKey) {
                obj[getKeyName(key, extraKey)] = value;
            },
            getAndDelete: function (obj, key, extraKey) {
                var keyName = getKeyName(key, extraKey);
                var value = obj[keyName];
                delete obj[keyName];
                return value;
            }
        };
        module.exports = singleReference;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-view-scope@4.13.0#make-compute-like*/
define('can-view-scope@4.13.0#make-compute-like', [
    'require',
    'exports',
    'module',
    'can-single-reference',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var singleReference = require('can-single-reference');
    var canReflect = require('can-reflect');
    var Compute = function (newVal) {
        if (arguments.length) {
            return canReflect.setValue(this, newVal);
        } else {
            return canReflect.getValue(this);
        }
    };
    module.exports = function (observable) {
        var compute = Compute.bind(observable);
        compute.on = compute.bind = compute.addEventListener = function (event, handler) {
            var translationHandler = function (newVal, oldVal) {
                handler.call(compute, { type: 'change' }, newVal, oldVal);
            };
            singleReference.set(handler, this, translationHandler);
            observable.on(translationHandler);
        };
        compute.off = compute.unbind = compute.removeEventListener = function (event, handler) {
            observable.off(singleReference.getAndDelete(handler, this));
        };
        canReflect.assignSymbols(compute, {
            'can.getValue': function () {
                return canReflect.getValue(observable);
            },
            'can.setValue': function (newVal) {
                return canReflect.setValue(observable, newVal);
            },
            'can.onValue': function (handler, queue) {
                return canReflect.onValue(observable, handler, queue);
            },
            'can.offValue': function (handler, queue) {
                return canReflect.offValue(observable, handler, queue);
            },
            'can.valueHasDependencies': function () {
                return canReflect.valueHasDependencies(observable);
            },
            'can.getPriority': function () {
                return canReflect.getPriority(observable);
            },
            'can.setPriority': function (newPriority) {
                canReflect.setPriority(observable, newPriority);
            },
            'can.isValueLike': true,
            'can.isFunctionLike': false
        });
        compute.isComputed = true;
        return compute;
    };
});
/*can-stache-helpers@1.2.0#can-stache-helpers*/
define('can-stache-helpers@1.2.0#can-stache-helpers', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    if (namespace.stacheHelpers) {
        throw new Error('You can\'t have two versions of can-stache-helpers, check your dependencies');
    } else {
        module.exports = namespace.stacheHelpers = {};
    }
});
/*can-view-scope@4.13.0#scope-key-data*/
define('can-view-scope@4.13.0#scope-key-data', [
    'require',
    'exports',
    'module',
    'can-observation',
    'can-stache-key',
    'can-assign',
    'can-reflect',
    'can-symbol',
    'can-observation-recorder',
    './make-compute-like',
    'can-reflect-dependencies',
    'can-event-queue/value/value',
    'can-stache-helpers',
    'can-simple-observable',
    'can-log/dev/dev'
], function (require, exports, module) {
    'use strict';
    var Observation = require('can-observation');
    var observeReader = require('can-stache-key');
    var assign = require('can-assign');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var ObservationRecorder = require('can-observation-recorder');
    var makeComputeLike = require('./make-compute-like');
    var canReflectDeps = require('can-reflect-dependencies');
    var valueEventBindings = require('can-event-queue/value/value');
    var stacheHelpers = require('can-stache-helpers');
    var SimpleObservable = require('can-simple-observable');
    var dev = require('can-log/dev/dev');
    var dispatchSymbol = canSymbol.for('can.dispatch');
    var getFastPathRoot = ObservationRecorder.ignore(function (computeData) {
        if (computeData.reads && computeData.reads.length === 1) {
            var root = computeData.root;
            if (root && root[canSymbol.for('can.getValue')]) {
                root = canReflect.getValue(root);
            }
            return root && canReflect.isObservableLike(root) && canReflect.isMapLike(root) && typeof root[computeData.reads[0].key] !== 'function' && root;
        }
        return;
    });
    var isEventObject = function (obj) {
        return obj && typeof obj.batchNum === 'number' && typeof obj.type === 'string';
    };
    function getMutated(scopeKeyData) {
        var value = ObservationRecorder.peekValue(scopeKeyData._thisArg);
        return !canReflect.isPrimitive(value) ? value : scopeKeyData.root;
    }
    function callMutateWithRightArgs(method, mutated, reads, mutator) {
        if (reads.length) {
            method.call(canReflectDeps, mutated, reads[reads.length - 1].key, mutator);
        } else {
            method.call(canReflectDeps, mutated, mutator);
        }
    }
    var warnOnUndefinedProperty;
    var ScopeKeyData = function (scope, key, options) {
        this.startingScope = scope;
        this.key = key;
        this.read = this.read.bind(this);
        this.dispatch = this.dispatch.bind(this);
        if (key === 'debugger') {
            this.startingScope = { _context: stacheHelpers };
            this.read = function () {
                var helperOptions = { scope: scope };
                var debuggerHelper = stacheHelpers['debugger'];
                return debuggerHelper(helperOptions);
            };
        }
        var observation = this.observation = new Observation(this.read, this);
        this.options = assign({ observation: this.observation }, options);
        this.fastPath = undefined;
        this.root = undefined;
        this.reads = undefined;
        this.setRoot = undefined;
        this._thisArg = new SimpleObservable();
        this.parentHasKey = undefined;
        var valueDependencies = new Set();
        valueDependencies.add(observation);
        this.dependencies = { valueDependencies: valueDependencies };
        this._latestValue = undefined;
    };
    valueEventBindings(ScopeKeyData.prototype);
    function fastOnBoundSet_Value() {
        this._value = this.newVal;
    }
    function fastOnBoundSetValue() {
        this.value = this.newVal;
    }
    assign(ScopeKeyData.prototype, {
        constructor: ScopeKeyData,
        dispatch: function dispatch(newVal) {
            var old = this.value;
            this._latestValue = this.value = newVal;
            this[dispatchSymbol].call(this, this.value, old);
        },
        onBound: function onBound() {
            this.bound = true;
            canReflect.onValue(this.observation, this.dispatch, 'notify');
            var fastPathRoot = getFastPathRoot(this);
            if (fastPathRoot) {
                this.toFastPath(fastPathRoot);
            }
            this._latestValue = this.value = ObservationRecorder.peekValue(this.observation);
        },
        onUnbound: function onUnbound() {
            this.bound = false;
            canReflect.offValue(this.observation, this.dispatch, 'notify');
            this.toSlowPath();
        },
        set: function (newVal) {
            var root = this.root || this.setRoot;
            if (root) {
                if (this.reads.length) {
                    observeReader.write(root, this.reads, newVal, this.options);
                } else {
                    canReflect.setValue(root, newVal);
                }
            } else {
                this.startingScope.set(this.key, newVal, this.options);
            }
        },
        get: function () {
            if (ObservationRecorder.isRecording()) {
                ObservationRecorder.add(this);
                if (!this.bound) {
                    Observation.temporarilyBind(this);
                }
            }
            if (this.bound === true && this.fastPath === true) {
                return this._latestValue;
            } else {
                return ObservationRecorder.peekValue(this.observation);
            }
        },
        toFastPath: function (fastPathRoot) {
            var self = this, observation = this.observation;
            this.fastPath = true;
            observation.dependencyChange = function (target, newVal) {
                if (isEventObject(newVal)) {
                    throw 'no event objects!';
                }
                if (target === fastPathRoot && typeof newVal !== 'function') {
                    self._latestValue = newVal;
                    this.newVal = newVal;
                } else {
                    self.toSlowPath();
                }
                return Observation.prototype.dependencyChange.apply(this, arguments);
            };
            if (observation.hasOwnProperty('_value')) {
                observation.onBound = fastOnBoundSet_Value;
            } else {
                observation.onBound = fastOnBoundSetValue;
            }
        },
        toSlowPath: function () {
            this.observation.dependencyChange = Observation.prototype.dependencyChange;
            this.observation.onBound = Observation.prototype.onBound;
            this.fastPath = false;
        },
        read: function () {
            var data;
            if (this.root) {
                data = observeReader.read(this.root, this.reads, this.options);
                this.thisArg = data.parent;
                return data.value;
            }
            data = this.startingScope.read(this.key, this.options);
            this.scope = data.scope;
            this.reads = data.reads;
            this.root = data.rootObserve;
            this.setRoot = data.setRoot;
            this.thisArg = data.thisArg;
            this.parentHasKey = data.parentHasKey;
            return data.value;
        },
        hasDependencies: function () {
            if (!this.bound) {
                Observation.temporarilyBind(this);
            }
            return canReflect.valueHasDependencies(this.observation);
        }
    });
    Object.defineProperty(ScopeKeyData.prototype, 'thisArg', {
        get: function () {
            return this._thisArg.get();
        },
        set: function (newVal) {
            this._thisArg.set(newVal);
        }
    });
    var scopeKeyDataPrototype = {
        'can.getValue': ScopeKeyData.prototype.get,
        'can.setValue': ScopeKeyData.prototype.set,
        'can.valueHasDependencies': ScopeKeyData.prototype.hasDependencies,
        'can.getValueDependencies': function () {
            return this.dependencies;
        },
        'can.getPriority': function () {
            return canReflect.getPriority(this.observation);
        },
        'can.setPriority': function (newPriority) {
            canReflect.setPriority(this.observation, newPriority);
        }
    };
    canReflect.assignSymbols(ScopeKeyData.prototype, scopeKeyDataPrototype);
    Object.defineProperty(ScopeKeyData.prototype, 'compute', {
        get: function () {
            var compute = makeComputeLike(this);
            Object.defineProperty(this, 'compute', {
                value: compute,
                writable: false,
                configurable: false
            });
            return compute;
        },
        configurable: true
    });
    Object.defineProperty(ScopeKeyData.prototype, 'initialValue', {
        get: function () {
            if (!this.bound) {
                Observation.temporarilyBind(this);
            }
            return ObservationRecorder.peekValue(this);
        },
        set: function () {
            throw new Error('initialValue should not be set');
        },
        configurable: true
    });
    module.exports = ScopeKeyData;
});
/*can-view-scope@4.13.0#compute_data*/
define('can-view-scope@4.13.0#compute_data', [
    'require',
    'exports',
    'module',
    './scope-key-data'
], function (require, exports, module) {
    'use strict';
    var ScopeKeyData = require('./scope-key-data');
    module.exports = function (scope, key, options) {
        return new ScopeKeyData(scope, key, options || { args: [] });
    };
});
/*can-view-scope@4.13.0#can-view-scope*/
define('can-view-scope@4.13.0#can-view-scope', [
    'require',
    'exports',
    'module',
    'can-stache-key',
    'can-observation-recorder',
    './template-context',
    './compute_data',
    'can-assign',
    'can-namespace',
    'can-reflect',
    'can-log/dev/dev',
    'can-define-lazy-value',
    'can-stache-helpers',
    'can-simple-map'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var stacheKey = require('can-stache-key');
        var ObservationRecorder = require('can-observation-recorder');
        var TemplateContext = require('./template-context');
        var makeComputeData = require('./compute_data');
        var assign = require('can-assign');
        var namespace = require('can-namespace');
        var canReflect = require('can-reflect');
        var canLog = require('can-log/dev/dev');
        var defineLazyValue = require('can-define-lazy-value');
        var stacheHelpers = require('can-stache-helpers');
        var SimpleMap = require('can-simple-map');
        function canHaveProperties(obj) {
            return obj != null;
        }
        function returnFalse() {
            return false;
        }
        var LetContext = SimpleMap.extend('LetContext', {});
        function Scope(context, parent, meta) {
            this._context = context;
            this._parent = parent;
            this._meta = meta || {};
            this.__cache = {};
        }
        var parentContextSearch = /(\.\.\/)|(\.\/)|(this[\.@])/g;
        assign(Scope, {
            read: stacheKey.read,
            TemplateContext: TemplateContext,
            keyInfo: function (attr) {
                if (attr === './') {
                    attr = 'this';
                }
                var info = { remainingKey: attr };
                info.isScope = attr === 'scope';
                if (info.isScope) {
                    return info;
                }
                var firstSix = attr.substr(0, 6);
                info.isInScope = firstSix === 'scope.' || firstSix === 'scope@';
                if (info.isInScope) {
                    info.remainingKey = attr.substr(6);
                    return info;
                } else if (firstSix === 'scope/') {
                    info.walkScope = true;
                    info.remainingKey = attr.substr(6);
                    return info;
                } else if (attr.substr(0, 7) === '@scope/') {
                    info.walkScope = true;
                    info.remainingKey = attr.substr(7);
                    return info;
                }
                info.parentContextWalkCount = 0;
                info.remainingKey = attr.replace(parentContextSearch, function (token, parentContext, dotSlash, thisContext, index) {
                    info.isContextBased = true;
                    if (parentContext !== undefined) {
                        info.parentContextWalkCount++;
                    }
                    return '';
                });
                if (info.remainingKey === '..') {
                    info.parentContextWalkCount++;
                    info.remainingKey = 'this';
                } else if (info.remainingKey === '.' || info.remainingKey === '') {
                    info.remainingKey = 'this';
                }
                if (info.remainingKey === 'this') {
                    info.isContextBased = true;
                }
                return info;
            },
            isTemplateContextOrCanNotHaveProperties: function (currentScope) {
                var currentContext = currentScope._context;
                if (currentContext instanceof TemplateContext) {
                    return true;
                } else if (!canHaveProperties(currentContext)) {
                    return true;
                }
                return false;
            },
            shouldSkipIfSpecial: function (currentScope) {
                var isSpecialContext = currentScope._meta.special === true;
                if (isSpecialContext === true) {
                    return true;
                }
                if (Scope.isTemplateContextOrCanNotHaveProperties(currentScope)) {
                    return true;
                }
                return false;
            },
            shouldSkipEverythingButSpecial: function (currentScope) {
                var isSpecialContext = currentScope._meta.special === true;
                if (isSpecialContext === false) {
                    return true;
                }
                if (Scope.isTemplateContextOrCanNotHaveProperties(currentScope)) {
                    return true;
                }
                return false;
            },
            makeShouldExitOnSecondNormalContext: function () {
                var foundNormalContext = false;
                return function shouldExitOnSecondNormalContext(currentScope) {
                    var isNormalContext = !currentScope.isSpecial();
                    var shouldExit = isNormalContext && foundNormalContext;
                    if (isNormalContext) {
                        foundNormalContext = true;
                    }
                    return shouldExit;
                };
            },
            makeShouldExitAfterFirstNormalContext: function () {
                var foundNormalContext = false;
                return function shouldExitAfterFirstNormalContext(currentScope) {
                    if (foundNormalContext) {
                        return true;
                    }
                    var isNormalContext = !currentScope.isSpecial();
                    if (isNormalContext) {
                        foundNormalContext = true;
                    }
                    return false;
                };
            },
            makeShouldSkipSpecialContexts: function (parentContextWalkCount) {
                var walkCount = parentContextWalkCount || 0;
                return function shouldSkipSpecialContexts(currentScope) {
                    if (walkCount < 0 && currentScope._meta.notContext) {
                        return false;
                    }
                    if (currentScope.isSpecial()) {
                        return true;
                    }
                    walkCount--;
                    if (walkCount < 0) {
                        return false;
                    }
                    return true;
                };
            }
        });
        assign(Scope.prototype, {
            add: function (context, meta) {
                if (context !== this._context) {
                    return new this.constructor(context, this, meta);
                } else {
                    return this;
                }
            },
            find: function (attr, options) {
                var keyReads = stacheKey.reads(attr);
                var howToRead = {
                    shouldExit: returnFalse,
                    shouldSkip: Scope.shouldSkipIfSpecial,
                    shouldLookForHelper: true,
                    read: stacheKey.read
                };
                var result = this._walk(keyReads, options, howToRead);
                return result.value;
            },
            readFromSpecialContext: function (key) {
                return this._walk([{
                        key: key,
                        at: false
                    }], { special: true }, {
                    shouldExit: returnFalse,
                    shouldSkip: Scope.shouldSkipEverythingButSpecial,
                    shouldLookForHelper: false,
                    read: stacheKey.read
                });
            },
            readFromTemplateContext: function (key, readOptions) {
                var keyReads = stacheKey.reads(key);
                return stacheKey.read(this.templateContext, keyReads, readOptions);
            },
            read: function (attr, options) {
                options = options || {};
                return this.readKeyInfo(Scope.keyInfo(attr), options || {});
            },
            readKeyInfo: function (keyInfo, options) {
                var readValue, keyReads, howToRead = { read: options.read || stacheKey.read };
                if (keyInfo.isScope) {
                    return { value: this };
                } else if (keyInfo.isInScope) {
                    keyReads = stacheKey.reads(keyInfo.remainingKey);
                    readValue = stacheKey.read(this, keyReads, options);
                    if (typeof readValue.value === 'undefined' && !readValue.parentHasKey) {
                        readValue = this.readFromTemplateContext(keyInfo.remainingKey, options);
                    }
                    return assign(readValue, { thisArg: keyReads.length > 0 ? readValue.parent : undefined });
                } else if (keyInfo.isContextBased) {
                    if (keyInfo.remainingKey !== 'this') {
                        keyReads = stacheKey.reads(keyInfo.remainingKey);
                    } else {
                        keyReads = [];
                    }
                    howToRead.shouldExit = Scope.makeShouldExitOnSecondNormalContext();
                    howToRead.shouldSkip = Scope.makeShouldSkipSpecialContexts(keyInfo.parentContextWalkCount);
                    howToRead.shouldLookForHelper = true;
                    return this._walk(keyReads, options, howToRead);
                } else if (keyInfo.walkScope) {
                    howToRead.shouldExit = returnFalse;
                    howToRead.shouldSkip = Scope.shouldSkipIfSpecial;
                    howToRead.shouldLookForHelper = true;
                    keyReads = stacheKey.reads(keyInfo.remainingKey);
                    return this._walk(keyReads, options, howToRead);
                } else {
                    keyReads = stacheKey.reads(keyInfo.remainingKey);
                    var isSpecialRead = options && options.special === true;
                    howToRead.shouldExit = Scope.makeShouldExitOnSecondNormalContext();
                    howToRead.shouldSkip = isSpecialRead ? Scope.shouldSkipEverythingButSpecial : Scope.shouldSkipIfSpecial;
                    howToRead.shouldLookForHelper = isSpecialRead ? false : true;
                    return this._walk(keyReads, options, howToRead);
                }
            },
            _walk: function (keyReads, options, howToRead) {
                var currentScope = this, currentContext, undefinedObserves = [], currentObserve, currentReads, setObserveDepth = -1, currentSetReads, currentSetObserve, readOptions = assign({
                        foundObservable: function (observe, nameIndex) {
                            currentObserve = observe;
                            currentReads = keyReads.slice(nameIndex);
                        },
                        earlyExit: function (parentValue, nameIndex) {
                            var isVariableScope = currentScope._meta.variable === true, updateSetObservable = false;
                            if (isVariableScope === true && nameIndex === 0) {
                                updateSetObservable = canReflect.hasKey(parentValue, keyReads[nameIndex].key);
                            } else {
                                updateSetObservable = nameIndex > setObserveDepth || nameIndex === setObserveDepth && (typeof parentValue === 'object' && canReflect.hasOwnKey(parentValue, keyReads[nameIndex].key));
                            }
                            if (updateSetObservable) {
                                currentSetObserve = currentObserve;
                                currentSetReads = currentReads;
                                setObserveDepth = nameIndex;
                            }
                        }
                    }, options);
                var isRecording = ObservationRecorder.isRecording(), readAContext = false;
                while (currentScope) {
                    if (howToRead.shouldSkip(currentScope) === true) {
                        currentScope = currentScope._parent;
                        continue;
                    }
                    if (howToRead.shouldExit(currentScope) === true) {
                        break;
                    }
                    readAContext = true;
                    currentContext = currentScope._context;
                    var getObserves = ObservationRecorder.trap();
                    var data = howToRead.read(currentContext, keyReads, readOptions);
                    var observes = getObserves();
                    if (data.value !== undefined || data.parentHasKey) {
                        if (!observes.length && isRecording) {
                            currentObserve = data.parent;
                            currentReads = keyReads.slice(keyReads.length - 1);
                        } else {
                            ObservationRecorder.addMany(observes);
                        }
                        return {
                            scope: currentScope,
                            rootObserve: currentObserve,
                            value: data.value,
                            reads: currentReads,
                            thisArg: data.parent,
                            parentHasKey: data.parentHasKey
                        };
                    } else {
                        undefinedObserves.push.apply(undefinedObserves, observes);
                    }
                    currentScope = currentScope._parent;
                }
                if (howToRead.shouldLookForHelper) {
                    var helper = this.getHelperOrPartial(keyReads);
                    if (helper && helper.value) {
                        return { value: helper.value };
                    }
                }
                ObservationRecorder.addMany(undefinedObserves);
                return {
                    setRoot: currentSetObserve,
                    reads: currentSetReads,
                    value: undefined,
                    noContextAvailable: !readAContext
                };
            },
            getDataForScopeSet: function getDataForScopeSet(key, options) {
                var keyInfo = Scope.keyInfo(key);
                var firstSearchedContext;
                var opts = assign({
                    read: function (context, keys) {
                        if (firstSearchedContext === undefined && !(context instanceof LetContext)) {
                            firstSearchedContext = context;
                        }
                        if (keys.length > 1) {
                            var parentKeys = keys.slice(0, keys.length - 1);
                            var parent = stacheKey.read(context, parentKeys, options).value;
                            if (parent != null && canReflect.hasKey(parent, keys[keys.length - 1].key)) {
                                return {
                                    parent: parent,
                                    parentHasKey: true,
                                    value: undefined
                                };
                            } else {
                                return {};
                            }
                        } else if (keys.length === 1) {
                            if (canReflect.hasKey(context, keys[0].key)) {
                                return {
                                    parent: context,
                                    parentHasKey: true,
                                    value: undefined
                                };
                            } else {
                                return {};
                            }
                        } else {
                            return { value: context };
                        }
                    }
                }, options);
                var readData = this.readKeyInfo(keyInfo, opts);
                if (keyInfo.remainingKey === 'this') {
                    return {
                        parent: readData.value,
                        how: 'setValue'
                    };
                }
                var parent;
                var props = keyInfo.remainingKey.split('.');
                var propName = props.pop();
                if (readData.thisArg) {
                    parent = readData.thisArg;
                } else if (firstSearchedContext) {
                    parent = firstSearchedContext;
                }
                if (parent === undefined) {
                    return { error: 'Attempting to set a value at ' + key + ' where the context is undefined.' };
                }
                if (!canReflect.isObservableLike(parent) && canReflect.isObservableLike(parent[propName])) {
                    if (canReflect.isMapLike(parent[propName])) {
                        return {
                            parent: parent,
                            key: propName,
                            how: 'updateDeep',
                            warn: 'can-view-scope: Merging data into "' + propName + '" because its parent is non-observable'
                        };
                    } else if (canReflect.isValueLike(parent[propName])) {
                        return {
                            parent: parent,
                            key: propName,
                            how: 'setValue'
                        };
                    } else {
                        return {
                            parent: parent,
                            how: 'write',
                            key: propName,
                            passOptions: true
                        };
                    }
                } else {
                    return {
                        parent: parent,
                        how: 'write',
                        key: propName,
                        passOptions: true
                    };
                }
            },
            getHelper: function (keyReads) {
                console.warn('.getHelper is deprecated, use .getHelperOrPartial');
                return this.getHelperOrPartial(keyReads);
            },
            getHelperOrPartial: function (keyReads) {
                var scope = this, context, helper;
                while (scope) {
                    context = scope._context;
                    if (context instanceof TemplateContext) {
                        helper = stacheKey.read(context.helpers, keyReads, { proxyMethods: false });
                        if (helper.value !== undefined) {
                            return helper;
                        }
                        helper = stacheKey.read(context.partials, keyReads, { proxyMethods: false });
                        if (helper.value !== undefined) {
                            return helper;
                        }
                    }
                    scope = scope._parent;
                }
                return stacheKey.read(stacheHelpers, keyReads, { proxyMethods: false });
            },
            get: function (key, options) {
                options = assign({ isArgument: true }, options);
                var res = this.read(key, options);
                return res.value;
            },
            peek: ObservationRecorder.ignore(function (key, options) {
                return this.get(key, options);
            }),
            peak: ObservationRecorder.ignore(function (key, options) {
                return this.peek(key, options);
            }),
            getScope: function (tester) {
                var scope = this;
                while (scope) {
                    if (tester(scope)) {
                        return scope;
                    }
                    scope = scope._parent;
                }
            },
            getContext: function (tester) {
                var res = this.getScope(tester);
                return res && res._context;
            },
            getTemplateContext: function () {
                var lastScope;
                var templateContext = this.getScope(function (scope) {
                    lastScope = scope;
                    return scope._context instanceof TemplateContext;
                });
                if (!templateContext) {
                    templateContext = new Scope(new TemplateContext());
                    lastScope._parent = templateContext;
                }
                return templateContext;
            },
            addTemplateContext: function () {
                return this.add(new TemplateContext());
            },
            addLetContext: function (values) {
                return this.add(new LetContext(values || {}), { variable: true });
            },
            getRoot: function () {
                var cur = this, child = this;
                while (cur._parent) {
                    child = cur;
                    cur = cur._parent;
                }
                if (cur._context instanceof TemplateContext) {
                    cur = child;
                }
                return cur._context;
            },
            getViewModel: function () {
                var vmScope = this.getScope(function (scope) {
                    return scope._meta.viewModel;
                });
                return vmScope && vmScope._context;
            },
            getTop: function () {
                var top;
                this.getScope(function (scope) {
                    if (scope._meta.viewModel) {
                        top = scope;
                    }
                    return false;
                });
                return top && top._context;
            },
            getPathsForKey: function getPathsForKey(key) {
            },
            hasKey: function hasKey(key) {
                var reads = stacheKey.reads(key);
                var readValue;
                if (reads[0].key === 'scope') {
                    readValue = stacheKey.read(this, reads.slice(1), key);
                } else {
                    readValue = stacheKey.read(this._context, reads, key);
                }
                return readValue.foundLastParent && readValue.parentHasKey;
            },
            set: function (key, value, options) {
                options = options || {};
                var data = this.getDataForScopeSet(key, options);
                var parent = data.parent;
                if (data.warn) {
                    canLog.warn(data.warn);
                }
                switch (data.how) {
                case 'set':
                    parent.set(data.key, value, data.passOptions ? options : undefined);
                    break;
                case 'write':
                    stacheKey.write(parent, data.key, value, options);
                    break;
                case 'setValue':
                    canReflect.setValue('key' in data ? parent[data.key] : parent, value);
                    break;
                case 'setKeyValue':
                    canReflect.setKeyValue(parent, data.key, value);
                    break;
                case 'updateDeep':
                    canReflect.updateDeep(parent[data.key], value);
                    break;
                }
            },
            attr: ObservationRecorder.ignore(function (key, value, options) {
                canLog.warn('can-view-scope::attr is deprecated, please use peek, get or set');
                options = assign({ isArgument: true }, options);
                if (arguments.length === 2) {
                    return this.set(key, value, options);
                } else {
                    return this.get(key, options);
                }
            }),
            computeData: function (key, options) {
                return makeComputeData(this, key, options);
            },
            compute: function (key, options) {
                return this.computeData(key, options).compute;
            },
            cloneFromRef: function () {
                var scopes = [];
                var scope = this, context, parent;
                while (scope) {
                    context = scope._context;
                    if (context instanceof TemplateContext) {
                        parent = scope._parent;
                        break;
                    }
                    scopes.unshift(scope);
                    scope = scope._parent;
                }
                if (parent) {
                    scopes.forEach(function (scope) {
                        parent = parent.add(scope._context, scope._meta);
                    });
                    return parent;
                } else {
                    return this;
                }
            },
            isSpecial: function () {
                return this._meta.notContext || this._meta.special || this._context instanceof TemplateContext || this._meta.variable;
            }
        });
        Scope.prototype._read = Scope.prototype._walk;
        canReflect.assignSymbols(Scope.prototype, { 'can.hasKey': Scope.prototype.hasKey });
        var templateContextPrimitives = [
            'filename',
            'lineNumber'
        ];
        templateContextPrimitives.forEach(function (key) {
            Object.defineProperty(Scope.prototype, key, {
                get: function () {
                    return this.readFromTemplateContext(key).value;
                },
                set: function (val) {
                    this.templateContext[key] = val;
                }
            });
        });
        defineLazyValue(Scope.prototype, 'templateContext', function () {
            return this.getTemplateContext()._context;
        });
        defineLazyValue(Scope.prototype, 'root', function () {
            canLog.warn('`scope.root` is deprecated. Use either `scope.top` or `scope.vm` instead.');
            return this.getRoot();
        });
        defineLazyValue(Scope.prototype, 'vm', function () {
            return this.getViewModel();
        });
        defineLazyValue(Scope.prototype, 'top', function () {
            return this.getTop();
        });
        defineLazyValue(Scope.prototype, 'helpers', function () {
            return stacheHelpers;
        });
        var specialKeywords = [
            'index',
            'key',
            'element',
            'event',
            'viewModel',
            'arguments',
            'helperOptions',
            'args'
        ];
        specialKeywords.forEach(function (key) {
            Object.defineProperty(Scope.prototype, key, {
                get: function () {
                    return this.readFromSpecialContext(key).value;
                }
            });
        });
        namespace.view = namespace.view || {};
        module.exports = namespace.view.Scope = Scope;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-stache@4.17.5#src/key-observable*/
define('can-stache@4.17.5#src/key-observable', [
    'require',
    'exports',
    'module',
    'can-simple-observable/settable/settable',
    'can-stache-key'
], function (require, exports, module) {
    'use strict';
    var SettableObservable = require('can-simple-observable/settable/settable');
    var stacheKey = require('can-stache-key');
    function KeyObservable(root, key) {
        key = '' + key;
        this.key = key;
        this.root = root;
        SettableObservable.call(this, function () {
            return stacheKey.get(this, key);
        }, root);
    }
    KeyObservable.prototype = Object.create(SettableObservable.prototype);
    KeyObservable.prototype.set = function (newVal) {
        stacheKey.set(this.root, this.key, newVal);
    };
    module.exports = KeyObservable;
});
/*can-stache@4.17.5#src/utils*/
define('can-stache@4.17.5#src/utils', [
    'require',
    'exports',
    'module',
    'can-view-scope',
    'can-observation-recorder',
    'can-stache-key',
    'can-reflect',
    './key-observable',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var Scope = require('can-view-scope');
    var ObservationRecorder = require('can-observation-recorder');
    var observationReader = require('can-stache-key');
    var canReflect = require('can-reflect');
    var KeyObservable = require('./key-observable');
    var canSymbol = require('can-symbol');
    var isViewSymbol = canSymbol.for('can.isView');
    var createNoOpRenderer = function (metadata) {
        return function noop() {
            if (metadata) {
                metadata.rendered = true;
            }
        };
    };
    module.exports = {
        last: function (arr) {
            return arr != null && arr[arr.length - 1];
        },
        emptyHandler: function () {
        },
        jsonParse: function (str) {
            if (str[0] === '\'') {
                return str.substr(1, str.length - 2);
            } else if (str === 'undefined') {
                return undefined;
            } else {
                return JSON.parse(str);
            }
        },
        mixins: {
            last: function () {
                return this.stack[this.stack.length - 1];
            },
            add: function (chars) {
                this.last().add(chars);
            },
            subSectionDepth: function () {
                return this.stack.length - 1;
            }
        },
        createRenderers: function (helperOptions, scope, nodeList, truthyRenderer, falseyRenderer, isStringOnly) {
            helperOptions.fn = truthyRenderer ? this.makeRendererConvertScopes(truthyRenderer, scope, nodeList, isStringOnly, helperOptions.metadata) : createNoOpRenderer(helperOptions.metadata);
            helperOptions.inverse = falseyRenderer ? this.makeRendererConvertScopes(falseyRenderer, scope, nodeList, isStringOnly, helperOptions.metadata) : createNoOpRenderer(helperOptions.metadata);
            helperOptions.isSection = !!(truthyRenderer || falseyRenderer);
        },
        makeRendererConvertScopes: function (renderer, parentScope, nodeList, observeObservables, metadata) {
            var convertedRenderer = function (newScope, newOptions, parentNodeList) {
                if (newScope !== undefined && !(newScope instanceof Scope)) {
                    if (parentScope) {
                        newScope = parentScope.add(newScope);
                    } else {
                        newScope = new Scope(newScope || {});
                    }
                }
                if (metadata) {
                    metadata.rendered = true;
                }
                var result = renderer(newScope || parentScope, parentNodeList || nodeList);
                return result;
            };
            return observeObservables ? convertedRenderer : ObservationRecorder.ignore(convertedRenderer);
        },
        makeView: function (renderer) {
            var view = ObservationRecorder.ignore(function (scope, nodeList) {
                if (!(scope instanceof Scope)) {
                    scope = new Scope(scope);
                }
                return renderer(scope, nodeList);
            });
            view[isViewSymbol] = true;
            return view;
        },
        getItemsStringContent: function (items, isObserveList, helperOptions) {
            var txt = '', len = observationReader.get(items, 'length'), isObservable = canReflect.isObservableLike(items);
            for (var i = 0; i < len; i++) {
                var item = isObservable ? new KeyObservable(items, i) : items[i];
                txt += helperOptions.fn(item);
            }
            return txt;
        },
        getItemsFragContent: function (items, helperOptions, scope) {
            var result = [], len = observationReader.get(items, 'length'), isObservable = canReflect.isObservableLike(items), hashExprs = helperOptions.exprData && helperOptions.exprData.hashExprs, hashOptions;
            if (canReflect.size(hashExprs) > 0) {
                hashOptions = {};
                canReflect.eachKey(hashExprs, function (exprs, key) {
                    hashOptions[exprs.key] = key;
                });
            }
            for (var i = 0; i < len; i++) {
                var aliases = {};
                var item = isObservable ? new KeyObservable(items, i) : items[i];
                if (canReflect.size(hashOptions) > 0) {
                    if (hashOptions.value) {
                        aliases[hashOptions.value] = item;
                    }
                    if (hashOptions.index) {
                        aliases[hashOptions.index] = i;
                    }
                }
                result.push(helperOptions.fn(scope.add(aliases, { notContext: true }).add({ index: i }, { special: true }).add(item)));
            }
            return result;
        }
    };
});
/*can-stache@4.17.5#src/html_section*/
define('can-stache@4.17.5#src/html_section', [
    'require',
    'exports',
    'module',
    'can-view-target',
    './utils',
    'can-globals/document/document',
    'can-assign'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var target = require('can-view-target');
        var utils = require('./utils');
        var getDocument = require('can-globals/document/document');
        var assign = require('can-assign');
        var last = utils.last;
        var decodeHTML = typeof document !== 'undefined' && function () {
            var el = getDocument().createElement('div');
            return function (html) {
                if (html.indexOf('&') === -1) {
                    return html.replace(/\r\n/g, '\n');
                }
                el.innerHTML = html;
                return el.childNodes.length === 0 ? '' : el.childNodes.item(0).nodeValue;
            };
        }();
        var HTMLSectionBuilder = function (filename) {
            if (filename) {
                this.filename = filename;
            }
            this.stack = [new HTMLSection()];
        };
        assign(HTMLSectionBuilder.prototype, utils.mixins);
        assign(HTMLSectionBuilder.prototype, {
            startSubSection: function (process) {
                var newSection = new HTMLSection(process);
                this.stack.push(newSection);
                return newSection;
            },
            endSubSectionAndReturnRenderer: function () {
                if (this.last().isEmpty()) {
                    this.stack.pop();
                    return null;
                } else {
                    var htmlSection = this.endSection();
                    return utils.makeView(htmlSection.compiled.hydrate.bind(htmlSection.compiled));
                }
            },
            startSection: function (process) {
                var newSection = new HTMLSection(process);
                this.last().add(newSection.targetCallback);
                this.stack.push(newSection);
            },
            endSection: function () {
                this.last().compile();
                return this.stack.pop();
            },
            inverse: function () {
                this.last().inverse();
            },
            compile: function () {
                var compiled = this.stack.pop().compile();
                return utils.makeView(compiled.hydrate.bind(compiled));
            },
            push: function (chars) {
                this.last().push(chars);
            },
            pop: function () {
                return this.last().pop();
            },
            removeCurrentNode: function () {
                this.last().removeCurrentNode();
            }
        });
        var HTMLSection = function (process) {
            this.data = 'targetData';
            this.targetData = [];
            this.targetStack = [];
            var self = this;
            this.targetCallback = function (scope, sectionNode) {
                process.call(this, scope, sectionNode, self.compiled.hydrate.bind(self.compiled), self.inverseCompiled && self.inverseCompiled.hydrate.bind(self.inverseCompiled));
            };
        };
        assign(HTMLSection.prototype, {
            inverse: function () {
                this.inverseData = [];
                this.data = 'inverseData';
            },
            push: function (data) {
                this.add(data);
                this.targetStack.push(data);
            },
            pop: function () {
                return this.targetStack.pop();
            },
            add: function (data) {
                if (typeof data === 'string') {
                    data = decodeHTML(data);
                }
                if (this.targetStack.length) {
                    last(this.targetStack).children.push(data);
                } else {
                    this[this.data].push(data);
                }
            },
            compile: function () {
                this.compiled = target(this.targetData, getDocument());
                if (this.inverseData) {
                    this.inverseCompiled = target(this.inverseData, getDocument());
                    delete this.inverseData;
                }
                this.targetStack = this.targetData = null;
                return this.compiled;
            },
            removeCurrentNode: function () {
                var children = this.children();
                return children.pop();
            },
            children: function () {
                if (this.targetStack.length) {
                    return last(this.targetStack).children;
                } else {
                    return this[this.data];
                }
            },
            isEmpty: function () {
                return !this.targetData.length;
            }
        });
        HTMLSectionBuilder.HTMLSection = HTMLSection;
        module.exports = HTMLSectionBuilder;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-view-live@4.2.7#lib/core*/
define('can-view-live@4.2.7#lib/core', [
    'require',
    'exports',
    'module',
    'can-view-parser',
    'can-dom-mutate',
    'can-view-nodelist',
    'can-fragment',
    'can-child-nodes',
    'can-reflect',
    'can-reflect-dependencies'
], function (require, exports, module) {
    'use strict';
    var parser = require('can-view-parser');
    var domMutate = require('can-dom-mutate');
    var nodeLists = require('can-view-nodelist');
    var makeFrag = require('can-fragment');
    var childNodes = require('can-child-nodes');
    var canReflect = require('can-reflect');
    var canReflectDeps = require('can-reflect-dependencies');
    function contains(parent, child) {
        if (parent.contains) {
            return parent.contains(child);
        }
        if (parent.nodeType === Node.DOCUMENT_NODE && parent.documentElement) {
            return contains(parent.documentElement, child);
        } else {
            child = child.parentNode;
            if (child === parent) {
                return true;
            }
            return false;
        }
    }
    var live = {
        setup: function (el, bind, unbind) {
            var tornDown = false, removalDisposal, data, teardown = function () {
                    if (!tornDown) {
                        tornDown = true;
                        unbind(data);
                        if (removalDisposal) {
                            removalDisposal();
                            removalDisposal = undefined;
                        }
                    }
                    return true;
                };
            data = {
                teardownCheck: function (parent) {
                    return parent ? false : teardown();
                }
            };
            removalDisposal = domMutate.onNodeRemoval(el, function () {
                var doc = el.ownerDocument;
                if (!contains(doc, el)) {
                    teardown();
                }
            });
            bind(data);
            return data;
        },
        listen: function (el, compute, change, queueName) {
            return live.setup(el, function bind() {
                canReflect.onValue(compute, change, queueName || 'notify');
            }, function unbind(data) {
                canReflect.offValue(compute, change, queueName || 'notify');
                if (data.nodeList) {
                    nodeLists.unregister(data.nodeList);
                }
            });
        },
        getAttributeParts: function (newVal) {
            var attrs = {}, attr;
            parser.parseAttrs(newVal, {
                attrStart: function (name) {
                    attrs[name] = '';
                    attr = name;
                },
                attrValue: function (value) {
                    attrs[attr] += value;
                },
                attrEnd: function () {
                }
            });
            return attrs;
        },
        isNode: function (obj) {
            return obj && obj.nodeType;
        },
        addTextNodeIfNoChildren: function (frag) {
            if (!frag.firstChild) {
                frag.appendChild(frag.ownerDocument.createTextNode(''));
            }
        },
        replace: function (nodes, val, teardown) {
            var oldNodes = nodes.slice(0), frag = makeFrag(val);
            nodeLists.register(nodes, teardown);
            nodeLists.update(nodes, childNodes(frag));
            nodeLists.replace(oldNodes, frag);
            return nodes;
        },
        getParentNode: function (el, defaultParentNode) {
            return defaultParentNode && el.parentNode.nodeType === 11 ? defaultParentNode : el.parentNode;
        },
        makeString: function (txt) {
            return txt == null ? '' : '' + txt;
        }
    };
    module.exports = live;
});
/*can-dom-data-state@1.0.5#can-dom-data-state*/
define('can-dom-data-state@1.0.5#can-dom-data-state', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-dom-mutate',
    'can-cid'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var domMutate = require('can-dom-mutate');
    var CID = require('can-cid');
    var isEmptyObject = function (obj) {
        for (var prop in obj) {
            return false;
        }
        return true;
    };
    var data = {};
    var removedDisposalMap = {};
    var deleteNode = function () {
        var id = CID.get(this);
        var nodeDeleted = false;
        if (id && data[id]) {
            nodeDeleted = true;
            delete data[id];
        }
        if (removedDisposalMap[id]) {
            removedDisposalMap[id]();
            delete removedDisposalMap[id];
        }
        return nodeDeleted;
    };
    var setData = function (name, value) {
        var id = CID(this);
        var store = data[id] || (data[id] = {});
        if (name !== undefined) {
            store[name] = value;
            var isNode = !!(this && typeof this.nodeType === 'number');
            if (isNode && !removedDisposalMap[id]) {
                var target = this;
                removedDisposalMap[id] = domMutate.onNodeRemoval(target, function () {
                    var doc = target.ownerDocument;
                    var ownerNode = doc.contains ? doc : doc.documentElement;
                    if (!ownerNode || !ownerNode.contains(target)) {
                        setTimeout(function () {
                            deleteNode.call(target);
                        }, 13);
                    }
                });
            }
        }
        return store;
    };
    var domDataState = {
        _data: data,
        _removalDisposalMap: removedDisposalMap,
        getCid: function () {
            return CID.get(this);
        },
        cid: function () {
            return CID(this);
        },
        expando: CID.domExpando,
        get: function (key) {
            var id = CID.get(this), store = id && data[id];
            return key === undefined ? store : store && store[key];
        },
        set: setData,
        clean: function (prop) {
            var id = CID.get(this);
            var itemData = data[id];
            if (itemData && itemData[prop]) {
                delete itemData[prop];
            }
            if (isEmptyObject(itemData)) {
                deleteNode.call(this);
            }
        },
        delete: deleteNode
    };
    if (namespace.domDataState) {
        throw new Error('You can\'t have two versions of can-dom-data-state, check your dependencies');
    } else {
        module.exports = namespace.domDataState = domDataState;
    }
});
/*can-attribute-observable@1.2.1#behaviors*/
define('can-attribute-observable@1.2.1#behaviors', [
    'require',
    'exports',
    'module',
    'can-globals/document/document',
    'can-globals/global/global',
    'can-dom-data-state',
    'can-dom-events',
    'can-dom-mutate',
    'can-dom-mutate/node',
    'can-globals/mutation-observer/mutation-observer',
    'can-diff/list/list',
    'can-queues'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getDocument = require('can-globals/document/document');
        var global = require('can-globals/global/global')();
        var setData = require('can-dom-data-state');
        var domEvents = require('can-dom-events');
        var domMutate = require('can-dom-mutate');
        var domMutateNode = require('can-dom-mutate/node');
        var getMutationObserver = require('can-globals/mutation-observer/mutation-observer');
        var diff = require('can-diff/list/list');
        var queues = require('can-queues');
        var formElements = {
                'INPUT': true,
                'TEXTAREA': true,
                'SELECT': true,
                'BUTTON': true
            }, toString = function (value) {
                if (value == null) {
                    return '';
                } else {
                    return '' + value;
                }
            }, isSVG = function (el) {
                return el.namespaceURI === 'http://www.w3.org/2000/svg';
            }, truthy = function () {
                return true;
            }, getSpecialTest = function (special) {
                return special && special.test || truthy;
            }, propProp = function (prop, obj) {
                obj = obj || {};
                obj.get = function () {
                    return this[prop];
                };
                obj.set = function (value) {
                    if (this[prop] !== value) {
                        this[prop] = value;
                    }
                };
                return obj;
            }, booleanProp = function (prop) {
                return {
                    isBoolean: true,
                    set: function (value) {
                        if (prop in this) {
                            this[prop] = value;
                        } else {
                            domMutateNode.setAttribute.call(this, prop, '');
                        }
                    },
                    remove: function () {
                        this[prop] = false;
                    }
                };
            }, setupMO = function (el, callback) {
                var attrMO = setData.get.call(el, 'attrMO');
                if (!attrMO) {
                    var onMutation = function () {
                        callback.call(el);
                    };
                    var MO = getMutationObserver();
                    if (MO) {
                        var observer = new MO(onMutation);
                        observer.observe(el, {
                            childList: true,
                            subtree: true
                        });
                        setData.set.call(el, 'attrMO', observer);
                    } else {
                        setData.set.call(el, 'attrMO', true);
                        setData.set.call(el, 'canBindingCallback', { onMutation: onMutation });
                    }
                }
            }, _findOptionToSelect = function (parent, value) {
                var child = parent.firstChild;
                while (child) {
                    if (child.nodeName === 'OPTION' && value === child.value) {
                        return child;
                    }
                    if (child.nodeName === 'OPTGROUP') {
                        var groupChild = _findOptionToSelect(child, value);
                        if (groupChild) {
                            return groupChild;
                        }
                    }
                    child = child.nextSibling;
                }
            }, setChildOptions = function (el, value) {
                var option;
                if (value != null) {
                    option = _findOptionToSelect(el, value);
                }
                if (option) {
                    option.selected = true;
                } else {
                    el.selectedIndex = -1;
                }
            }, forEachOption = function (parent, fn) {
                var child = parent.firstChild;
                while (child) {
                    if (child.nodeName === 'OPTION') {
                        fn(child);
                    }
                    if (child.nodeName === 'OPTGROUP') {
                        forEachOption(child, fn);
                    }
                    child = child.nextSibling;
                }
            }, collectSelectedOptions = function (parent) {
                var selectedValues = [];
                forEachOption(parent, function (option) {
                    if (option.selected) {
                        selectedValues.push(option.value);
                    }
                });
                return selectedValues;
            }, markSelectedOptions = function (parent, values) {
                forEachOption(parent, function (option) {
                    option.selected = values.indexOf(option.value) !== -1;
                });
            }, setChildOptionsOnChange = function (select, aEL) {
                var handler = setData.get.call(select, 'attrSetChildOptions');
                if (handler) {
                    return Function.prototype;
                }
                handler = function () {
                    setChildOptions(select, select.value);
                };
                setData.set.call(select, 'attrSetChildOptions', handler);
                aEL.call(select, 'change', handler);
                return function (rEL) {
                    setData.clean.call(select, 'attrSetChildOptions');
                    rEL.call(select, 'change', handler);
                };
            }, behaviorRules = new Map(), isPropWritable = function (el, prop) {
                var desc = Object.getOwnPropertyDescriptor(el, prop);
                if (desc) {
                    return desc.writable || desc.set;
                } else {
                    var proto = Object.getPrototypeOf(el);
                    if (proto) {
                        return isPropWritable(proto, prop);
                    }
                }
                return false;
            }, cacheRule = function (el, attrOrPropName, rule) {
                var rulesForElementType;
                rulesForElementType = behaviorRules.get(el.prototype);
                if (!rulesForElementType) {
                    rulesForElementType = {};
                    behaviorRules.set(el.constructor, rulesForElementType);
                }
                rulesForElementType[attrOrPropName] = rule;
                return rule;
            };
        var specialAttributes = {
            checked: {
                get: function () {
                    return this.checked;
                },
                set: function (val) {
                    var notFalse = !!val || val === '' || arguments.length === 0;
                    this.checked = notFalse;
                    if (notFalse && this.type === 'radio') {
                        this.defaultChecked = true;
                    }
                },
                remove: function () {
                    this.checked = false;
                },
                test: function () {
                    return this.nodeName === 'INPUT';
                }
            },
            'class': {
                get: function () {
                    if (isSVG(this)) {
                        return this.getAttribute('class');
                    }
                    return this.className;
                },
                set: function (val) {
                    val = val || '';
                    if (isSVG(this)) {
                        domMutateNode.setAttribute.call(this, 'class', '' + val);
                    } else {
                        this.className = val;
                    }
                }
            },
            disabled: booleanProp('disabled'),
            focused: {
                get: function () {
                    return this === document.activeElement;
                },
                set: function (val) {
                    var cur = attr.get(this, 'focused');
                    var docEl = this.ownerDocument.documentElement;
                    var element = this;
                    function focusTask() {
                        if (val) {
                            element.focus();
                        } else {
                            element.blur();
                        }
                    }
                    if (cur !== val) {
                        if (!docEl.contains(element)) {
                            var insertionDisposal = domMutate.onNodeInsertion(element, function () {
                                insertionDisposal();
                                focusTask();
                            });
                        } else {
                            queues.enqueueByQueue({ mutate: [focusTask] }, null, []);
                        }
                    }
                    return true;
                },
                addEventListener: function (eventName, handler, aEL) {
                    aEL.call(this, 'focus', handler);
                    aEL.call(this, 'blur', handler);
                    return function (rEL) {
                        rEL.call(this, 'focus', handler);
                        rEL.call(this, 'blur', handler);
                    };
                },
                test: function () {
                    return this.nodeName === 'INPUT';
                }
            },
            'for': propProp('htmlFor'),
            innertext: propProp('innerText'),
            innerhtml: propProp('innerHTML'),
            innerHTML: propProp('innerHTML', {
                addEventListener: function (eventName, handler, aEL) {
                    var handlers = [];
                    var el = this;
                    [
                        'change',
                        'blur'
                    ].forEach(function (eventName) {
                        var localHandler = function () {
                            handler.apply(this, arguments);
                        };
                        domEvents.addEventListener(el, eventName, localHandler);
                        handlers.push([
                            eventName,
                            localHandler
                        ]);
                    });
                    return function (rEL) {
                        handlers.forEach(function (info) {
                            rEL.call(el, info[0], info[1]);
                        });
                    };
                }
            }),
            required: booleanProp('required'),
            readonly: booleanProp('readOnly'),
            selected: {
                get: function () {
                    return this.selected;
                },
                set: function (val) {
                    val = !!val;
                    setData.set.call(this, 'lastSetValue', val);
                    this.selected = val;
                },
                addEventListener: function (eventName, handler, aEL) {
                    var option = this;
                    var select = this.parentNode;
                    var lastVal = option.selected;
                    var localHandler = function (changeEvent) {
                        var curVal = option.selected;
                        lastVal = setData.get.call(option, 'lastSetValue') || lastVal;
                        if (curVal !== lastVal) {
                            lastVal = curVal;
                            domEvents.dispatch(option, eventName);
                        }
                    };
                    var removeChangeHandler = setChildOptionsOnChange(select, aEL);
                    domEvents.addEventListener(select, 'change', localHandler);
                    aEL.call(option, eventName, handler);
                    return function (rEL) {
                        removeChangeHandler(rEL);
                        domEvents.removeEventListener(select, 'change', localHandler);
                        rEL.call(option, eventName, handler);
                    };
                },
                test: function () {
                    return this.nodeName === 'OPTION' && this.parentNode && this.parentNode.nodeName === 'SELECT';
                }
            },
            style: {
                set: function () {
                    var el = global.document && getDocument().createElement('div');
                    if (el && el.style && 'cssText' in el.style) {
                        return function (val) {
                            this.style.cssText = val || '';
                        };
                    } else {
                        return function (val) {
                            domMutateNode.setAttribute.call(this, 'style', val);
                        };
                    }
                }()
            },
            textcontent: propProp('textContent'),
            value: {
                get: function () {
                    var value = this.value;
                    if (this.nodeName === 'SELECT') {
                        if ('selectedIndex' in this && this.selectedIndex === -1) {
                            value = undefined;
                        }
                    }
                    return value;
                },
                set: function (value) {
                    var nodeName = this.nodeName.toLowerCase();
                    if (nodeName === 'input') {
                        value = toString(value);
                    }
                    if (this.value !== value || nodeName === 'option') {
                        this.value = value;
                    }
                    if (nodeName === 'input' || nodeName === 'textarea') {
                        this.defaultValue = value;
                    }
                    if (nodeName === 'select') {
                        setData.set.call(this, 'attrValueLastVal', value);
                        setChildOptions(this, value === null ? value : this.value);
                        var docEl = this.ownerDocument.documentElement;
                        if (!docEl.contains(this)) {
                            var select = this;
                            var insertionDisposal = domMutate.onNodeInsertion(select, function () {
                                insertionDisposal();
                                setChildOptions(select, value === null ? value : select.value);
                            });
                        }
                        setupMO(this, function () {
                            var value = setData.get.call(this, 'attrValueLastVal');
                            attr.set(this, 'value', value);
                            domEvents.dispatch(this, 'change');
                        });
                    }
                },
                test: function () {
                    return formElements[this.nodeName];
                }
            },
            values: {
                get: function () {
                    return collectSelectedOptions(this);
                },
                set: function (values) {
                    values = values || [];
                    markSelectedOptions(this, values);
                    setData.set.call(this, 'stickyValues', attr.get(this, 'values'));
                    setupMO(this, function () {
                        var previousValues = setData.get.call(this, 'stickyValues');
                        attr.set(this, 'values', previousValues);
                        var currentValues = setData.get.call(this, 'stickyValues');
                        var changes = diff(previousValues.slice().sort(), currentValues.slice().sort());
                        if (changes.length) {
                            domEvents.dispatch(this, 'values');
                        }
                    });
                },
                addEventListener: function (eventName, handler, aEL) {
                    var localHandler = function () {
                        domEvents.dispatch(this, 'values');
                    };
                    domEvents.addEventListener(this, 'change', localHandler);
                    aEL.call(this, eventName, handler);
                    return function (rEL) {
                        domEvents.removeEventListener(this, 'change', localHandler);
                        rEL.call(this, eventName, handler);
                    };
                }
            }
        };
        var attr = {
            rules: behaviorRules,
            specialAttributes: specialAttributes,
            getRule: function (el, attrOrPropName) {
                var special = specialAttributes[attrOrPropName];
                if (special) {
                    return special;
                }
                var rulesForElementType = behaviorRules.get(el.constructor);
                var cached = rulesForElementType && rulesForElementType[attrOrPropName];
                if (cached) {
                    return cached;
                }
                if (!(attrOrPropName in el)) {
                    return this.attribute(attrOrPropName);
                }
                var newRule = isPropWritable(el, attrOrPropName) ? this.property(attrOrPropName) : this.attribute(attrOrPropName);
                return cacheRule(el, attrOrPropName, newRule);
            },
            attribute: function (attrName) {
                return {
                    get: function () {
                        return this.getAttribute(attrName);
                    },
                    set: function (val) {
                        domMutateNode.setAttribute.call(this, attrName, val);
                    }
                };
            },
            property: function (propName) {
                return {
                    get: function () {
                        return this[propName];
                    },
                    set: function (val) {
                        this[propName] = val;
                    }
                };
            },
            findSpecialListener: function (attributeName) {
                return specialAttributes[attributeName] && specialAttributes[attributeName].addEventListener;
            },
            setAttrOrProp: function (el, attrName, val) {
                return this.set(el, attrName, val);
            },
            set: function (el, attrName, val) {
                var rule = this.getRule(el, attrName);
                var setter = rule && rule.set;
                if (setter) {
                    return setter.call(el, val);
                }
            },
            get: function (el, attrName) {
                var rule = this.getRule(el, attrName);
                var getter = rule && rule.get;
                if (getter) {
                    return rule.test ? rule.test.call(el) && getter.call(el) : getter.call(el);
                }
            },
            remove: function (el, attrName) {
                attrName = attrName.toLowerCase();
                var special = specialAttributes[attrName];
                var setter = special && special.set;
                var remover = special && special.remove;
                var test = getSpecialTest(special);
                if (typeof remover === 'function' && test.call(el)) {
                    remover.call(el);
                } else if (typeof setter === 'function' && test.call(el)) {
                    setter.call(el, undefined);
                } else {
                    domMutateNode.removeAttribute.call(el, attrName);
                }
            }
        };
        module.exports = attr;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-view-live@4.2.7#lib/attr*/
define('can-view-live@4.2.7#lib/attr', [
    'require',
    'exports',
    'module',
    './core',
    'can-reflect',
    'can-queues',
    'can-attribute-observable/behaviors'
], function (require, exports, module) {
    'use strict';
    var live = require('./core');
    var canReflect = require('can-reflect');
    var queues = require('can-queues');
    var attr = require('can-attribute-observable/behaviors');
    live.attr = function (el, attributeName, compute) {
        function liveUpdateAttr(newVal) {
            queues.domUIQueue.enqueue(attr.set, attr, [
                el,
                attributeName,
                newVal
            ]);
        }
        live.listen(el, compute, liveUpdateAttr);
        attr.set(el, attributeName, canReflect.getValue(compute));
    };
});
/*can-view-live@4.2.7#lib/attrs*/
define('can-view-live@4.2.7#lib/attrs', [
    'require',
    'exports',
    'module',
    './core',
    'can-view-callbacks',
    'can-dom-mutate',
    'can-dom-mutate/node',
    'can-reflect',
    'can-reflect-dependencies'
], function (require, exports, module) {
    'use strict';
    var live = require('./core');
    var viewCallbacks = require('can-view-callbacks');
    var domMutate = require('can-dom-mutate');
    var domMutateNode = require('can-dom-mutate/node');
    var canReflect = require('can-reflect');
    var canReflectDeps = require('can-reflect-dependencies');
    live.attrs = function (el, compute, scope, options) {
        if (!canReflect.isObservableLike(compute)) {
            var attrs = live.getAttributeParts(compute);
            for (var name in attrs) {
                domMutateNode.setAttribute.call(el, name, attrs[name]);
            }
            return;
        }
        var oldAttrs = {};
        function liveAttrsUpdate(newVal) {
            var newAttrs = live.getAttributeParts(newVal), name;
            for (name in newAttrs) {
                var newValue = newAttrs[name], oldValue = oldAttrs[name];
                if (newValue !== oldValue) {
                    domMutateNode.setAttribute.call(el, name, newValue);
                    var callback = viewCallbacks.attr(name);
                    if (callback) {
                        callback(el, {
                            attributeName: name,
                            scope: scope,
                            options: options
                        });
                    }
                }
                delete oldAttrs[name];
            }
            for (name in oldAttrs) {
                domMutateNode.removeAttribute.call(el, name);
            }
            oldAttrs = newAttrs;
        }
        canReflect.onValue(compute, liveAttrsUpdate, 'domUI');
        var removalDisposal;
        var teardownHandler = function () {
            canReflect.offValue(compute, liveAttrsUpdate, 'domUI');
            if (removalDisposal) {
                removalDisposal();
                removalDisposal = undefined;
            }
        };
        removalDisposal = domMutate.onNodeRemoval(el, function () {
            var doc = el.ownerDocument;
            var ownerNode = doc.contains ? doc : doc.documentElement;
            if (!ownerNode.contains(el)) {
                teardownHandler();
            }
        });
        liveAttrsUpdate(canReflect.getValue(compute));
    };
});
/*can-view-live@4.2.7#lib/html*/
define('can-view-live@4.2.7#lib/html', [
    'require',
    'exports',
    'module',
    './core',
    'can-view-nodelist',
    'can-fragment',
    'can-child-nodes',
    'can-reflect',
    'can-symbol',
    'can-queues'
], function (require, exports, module) {
    'use strict';
    var live = require('./core');
    var nodeLists = require('can-view-nodelist');
    var makeFrag = require('can-fragment');
    var childNodes = require('can-child-nodes');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var queues = require('can-queues');
    var viewInsertSymbol = canSymbol.for('can.viewInsert');
    function updateNodeList(data, frag, nodeListUpdatedByFn) {
        if (data.nodeList.isUnregistered !== true) {
            var newChildren = canReflect.toArray(childNodes(frag));
            if (!nodeListUpdatedByFn) {
                nodeLists.update(data.nodeList, newChildren, data.oldNodes);
            }
            var oldNodes = data.oldNodes;
            data.oldNodes = newChildren;
            nodeLists.replace(oldNodes, frag);
        }
    }
    live.html = function (el, compute, parentNode, nodeListOrOptions) {
        var data;
        var makeAndPut;
        var nodeList;
        var nodes;
        var options;
        if (nodeListOrOptions !== undefined) {
            if (Array.isArray(nodeListOrOptions)) {
                nodeList = nodeListOrOptions;
            } else {
                nodeList = nodeListOrOptions.nodeList;
                options = nodeListOrOptions;
            }
        }
        var meta = { reasonLog: 'live.html replace::' + canReflect.getName(compute) };
        parentNode = live.getParentNode(el, parentNode);
        function liveHTMLUpdateHTML(newVal) {
            var attached = nodeLists.first(nodes).parentNode;
            if (attached) {
                makeAndPut(newVal, true);
            }
            var pn = nodeLists.first(nodes).parentNode;
            data.teardownCheck(pn);
        }
        data = live.listen(parentNode, compute, liveHTMLUpdateHTML);
        nodes = nodeList || [el];
        makeAndPut = function (val, useQueue) {
            if (val && typeof val[viewInsertSymbol] === 'function') {
                val = val[viewInsertSymbol](options);
            }
            var isFunction = typeof val === 'function';
            var frag = makeFrag(isFunction ? '' : val);
            live.addTextNodeIfNoChildren(frag);
            if (useQueue === true) {
                data.oldNodes = nodeLists.unregisterChildren(nodes, true);
                var nodeListUpdatedByFn = false;
                if (isFunction) {
                    val(frag.firstChild);
                    nodeListUpdatedByFn = nodeLists.first(nodes) === frag.firstChild;
                }
                queues.domUIQueue.enqueue(updateNodeList, null, [
                    data,
                    frag,
                    nodeListUpdatedByFn
                ], meta);
            } else {
                data.oldNodes = nodeLists.update(nodes, childNodes(frag));
                if (isFunction) {
                    val(frag.firstChild);
                }
                nodeLists.replace(data.oldNodes, frag);
            }
        };
        data.nodeList = nodes;
        if (!nodeList) {
            nodeLists.register(nodes, data.teardownCheck);
        } else {
            nodeList.unregistered = data.teardownCheck;
        }
        makeAndPut(canReflect.getValue(compute));
    };
});
/*can-view-live@4.2.7#lib/set-observable*/
define('can-view-live@4.2.7#lib/set-observable', [
    'require',
    'exports',
    'module',
    'can-simple-observable',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var SimpleObservable = require('can-simple-observable');
    var canReflect = require('can-reflect');
    function SetObservable(initialValue, setter) {
        this.setter = setter;
        SimpleObservable.call(this, initialValue);
    }
    SetObservable.prototype = Object.create(SimpleObservable.prototype);
    SetObservable.prototype.constructor = SetObservable;
    SetObservable.prototype.set = function (newVal) {
        this.setter(newVal);
    };
    canReflect.assignSymbols(SetObservable.prototype, { 'can.setValue': SetObservable.prototype.set });
    module.exports = SetObservable;
});
/*can-diff@1.4.4#patcher/patcher*/
define('can-diff@1.4.4#patcher/patcher', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-key-tree',
    'can-symbol',
    '../list/list',
    'can-queues',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var KeyTree = require('can-key-tree');
    var canSymbol = require('can-symbol');
    var diff = require('../list/list');
    var queues = require('can-queues');
    var canSymbol = require('can-symbol');
    var onValueSymbol = canSymbol.for('can.onValue'), offValueSymbol = canSymbol.for('can.offValue');
    var onPatchesSymbol = canSymbol.for('can.onPatches');
    var offPatchesSymbol = canSymbol.for('can.offPatches');
    var Patcher = function (observableOrList, priority) {
        this.handlers = new KeyTree([
            Object,
            Array
        ], {
            onFirst: this.setup.bind(this),
            onEmpty: this.teardown.bind(this)
        });
        this.observableOrList = observableOrList;
        this.isObservableValue = canReflect.isValueLike(this.observableOrList) || canReflect.isObservableLike(this.observableOrList);
        if (this.isObservableValue) {
            this.priority = canReflect.getPriority(observableOrList);
        } else {
            this.priority = priority || 0;
        }
        this.onList = this.onList.bind(this);
        this.onPatchesNotify = this.onPatchesNotify.bind(this);
        this.onPatchesDerive = this.onPatchesDerive.bind(this);
        this.patches = [];
    };
    Patcher.prototype = {
        constructor: Patcher,
        setup: function () {
            if (this.observableOrList[onValueSymbol]) {
                canReflect.onValue(this.observableOrList, this.onList, 'notify');
                this.setupList(canReflect.getValue(this.observableOrList));
            } else {
                this.setupList(this.observableOrList);
            }
        },
        teardown: function () {
            if (this.observableOrList[offValueSymbol]) {
                canReflect.offValue(this.observableOrList, this.onList, 'notify');
            }
            if (this.currentList && this.currentList[offPatchesSymbol]) {
                this.currentList[offPatchesSymbol](this.onPatchesNotify, 'notify');
            }
        },
        setupList: function (list) {
            this.currentList = list;
            if (list && list[onPatchesSymbol]) {
                list[onPatchesSymbol](this.onPatchesNotify, 'notify');
            }
        },
        onList: function onList(newList) {
            var current = this.currentList || [];
            newList = newList || [];
            if (current[offPatchesSymbol]) {
                current[offPatchesSymbol](this.onPatchesNotify, 'notify');
            }
            var patches = diff(current, newList);
            this.currentList = newList;
            this.onPatchesNotify(patches);
            if (newList[onPatchesSymbol]) {
                newList[onPatchesSymbol](this.onPatchesNotify, 'notify');
            }
        },
        onPatchesNotify: function onPatchesNotify(patches) {
            this.patches.push.apply(this.patches, patches);
            queues.deriveQueue.enqueue(this.onPatchesDerive, this, [], { priority: this.priority });
        },
        onPatchesDerive: function onPatchesDerive() {
            var patches = this.patches;
            this.patches = [];
            queues.enqueueByQueue(this.handlers.getNode([]), this.currentList, [
                patches,
                this.currentList
            ], null, [
                'Apply patches',
                patches
            ]);
        }
    };
    canReflect.assignSymbols(Patcher.prototype, {
        'can.onPatches': function (handler, queue) {
            this.handlers.add([
                queue || 'mutate',
                handler
            ]);
        },
        'can.offPatches': function (handler, queue) {
            this.handlers.delete([
                queue || 'mutate',
                handler
            ]);
        }
    });
    module.exports = Patcher;
});
/*can-view-live@4.2.7#lib/list*/
define('can-view-live@4.2.7#lib/list', [
    'require',
    'exports',
    'module',
    './core',
    'can-view-nodelist',
    'can-fragment',
    'can-child-nodes',
    'can-dom-mutate/node',
    'can-reflect',
    'can-symbol',
    'can-reflect-dependencies',
    'can-simple-observable',
    './set-observable',
    'can-diff/patcher/patcher'
], function (require, exports, module) {
    'use strict';
    var live = require('./core');
    var nodeLists = require('can-view-nodelist');
    var frag = require('can-fragment');
    var childNodes = require('can-child-nodes');
    var domMutateNode = require('can-dom-mutate/node');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var canReflectDeps = require('can-reflect-dependencies');
    var SimpleObservable = require('can-simple-observable');
    var SetObservable = require('./set-observable');
    var Patcher = require('can-diff/patcher/patcher');
    var splice = [].splice;
    var renderAndAddToNodeLists = function (newNodeLists, parentNodeList, render, context, args) {
            var itemNodeList = [];
            if (parentNodeList) {
                nodeLists.register(itemNodeList, null, true, true);
                itemNodeList.parentList = parentNodeList;
                itemNodeList.expression = '#each SUBEXPRESSION';
            }
            var itemHTML = render.apply(context, args.concat([itemNodeList])), itemFrag = frag(itemHTML);
            var children = canReflect.toArray(childNodes(itemFrag));
            if (parentNodeList) {
                nodeLists.update(itemNodeList, children);
                newNodeLists.push(itemNodeList);
            } else {
                newNodeLists.push(nodeLists.register(children));
            }
            return itemFrag;
        }, removeFromNodeList = function (masterNodeList, index, length) {
            var removedMappings = masterNodeList.splice(index + 1, length), itemsToRemove = [];
            removedMappings.forEach(function (nodeList) {
                var nodesToRemove = nodeLists.unregister(nodeList);
                [].push.apply(itemsToRemove, nodesToRemove);
            });
            return itemsToRemove;
        };
    var onPatchesSymbol = canSymbol.for('can.onPatches');
    var offPatchesSymbol = canSymbol.for('can.offPatches');
    function ListDOMPatcher(el, compute, render, context, parentNode, nodeList, falseyRender) {
        this.patcher = new Patcher(compute);
        parentNode = live.getParentNode(el, parentNode);
        this.value = compute;
        this.render = render;
        this.context = context;
        this.parentNode = parentNode;
        this.falseyRender = falseyRender;
        this.masterNodeList = nodeList || nodeLists.register([el], null, true);
        this.placeholder = el;
        this.indexMap = [];
        this.isValueLike = canReflect.isValueLike(this.value);
        this.isObservableLike = canReflect.isObservableLike(this.value);
        this.onPatches = this.onPatches.bind(this);
        var data = this.data = live.setup(parentNode, this.setupValueBinding.bind(this), this.teardownValueBinding.bind(this));
        this.masterNodeList.unregistered = function () {
            data.teardownCheck();
        };
    }
    var onPatchesSymbol = canSymbol.for('can.onPatches');
    var offPatchesSymbol = canSymbol.for('can.offPatches');
    ListDOMPatcher.prototype = {
        setupValueBinding: function () {
            this.patcher[onPatchesSymbol](this.onPatches, 'domUI');
            if (this.patcher.currentList && this.patcher.currentList.length) {
                this.onPatches([{
                        insert: this.patcher.currentList,
                        index: 0,
                        deleteCount: 0
                    }]);
            } else {
                this.addFalseyIfEmpty();
            }
        },
        teardownValueBinding: function () {
            this.patcher[offPatchesSymbol](this.onPatches, 'domUI');
            this.exit = true;
            this.remove({ length: this.patcher.currentList ? this.patcher.currentList.length : 0 }, 0, true);
        },
        onPatches: function ListDOMPatcher_onPatches(patches) {
            if (this.exit) {
                return;
            }
            for (var i = 0, patchLen = patches.length; i < patchLen; i++) {
                var patch = patches[i];
                if (patch.type === 'move') {
                    this.move(patch.toIndex, patch.fromIndex);
                } else {
                    if (patch.deleteCount) {
                        this.remove({ length: patch.deleteCount }, patch.index, true);
                    }
                    if (patch.insert && patch.insert.length) {
                        this.add(patch.insert, patch.index);
                    }
                }
            }
        },
        add: function (items, index) {
            var frag = this.placeholder.ownerDocument.createDocumentFragment(), newNodeLists = [], newIndicies = [], masterNodeList = this.masterNodeList, render = this.render, context = this.context;
            items.forEach(function (item, key) {
                var itemIndex = new SimpleObservable(key + index), itemCompute = new SetObservable(item, function (newVal) {
                        canReflect.setKeyValue(this.patcher.currentList, itemIndex.get(), newVal);
                    }.bind(this)), itemFrag = renderAndAddToNodeLists(newNodeLists, masterNodeList, render, context, [
                        itemCompute,
                        itemIndex
                    ]);
                frag.appendChild(itemFrag);
                newIndicies.push(itemIndex);
            }, this);
            var masterListIndex = index + 1;
            if (!this.indexMap.length) {
                var falseyItemsToRemove = removeFromNodeList(masterNodeList, 0, masterNodeList.length - 1);
                nodeLists.remove(falseyItemsToRemove);
            }
            if (!masterNodeList[masterListIndex]) {
                nodeLists.after(masterListIndex === 1 ? [this.placeholder] : [nodeLists.last(this.masterNodeList[masterListIndex - 1])], frag);
            } else {
                var el = nodeLists.first(masterNodeList[masterListIndex]);
                domMutateNode.insertBefore.call(el.parentNode, frag, el);
            }
            splice.apply(this.masterNodeList, [
                masterListIndex,
                0
            ].concat(newNodeLists));
            splice.apply(this.indexMap, [
                index,
                0
            ].concat(newIndicies));
            for (var i = index + newIndicies.length, len = this.indexMap.length; i < len; i++) {
                this.indexMap[i].set(i);
            }
        },
        remove: function (items, index) {
            if (index < 0) {
                index = this.indexMap.length + index;
            }
            var itemsToRemove = removeFromNodeList(this.masterNodeList, index, items.length);
            var indexMap = this.indexMap;
            indexMap.splice(index, items.length);
            for (var i = index, len = indexMap.length; i < len; i++) {
                indexMap[i].set(i);
            }
            if (!this.exit) {
                this.addFalseyIfEmpty();
                nodeLists.remove(itemsToRemove);
            } else {
                nodeLists.unregister(this.masterNodeList);
            }
        },
        addFalseyIfEmpty: function () {
            if (this.falseyRender && this.indexMap.length === 0) {
                var falseyNodeLists = [];
                var falseyFrag = renderAndAddToNodeLists(falseyNodeLists, this.masterNodeList, this.falseyRender, this.currentList, [this.currentList]);
                nodeLists.after([this.masterNodeList[0]], falseyFrag);
                this.masterNodeList.push(falseyNodeLists[0]);
            }
        },
        move: function move(newIndex, currentIndex) {
            newIndex = newIndex + 1;
            currentIndex = currentIndex + 1;
            var masterNodeList = this.masterNodeList, indexMap = this.indexMap;
            var referenceNodeList = masterNodeList[newIndex];
            var movedElements = frag(nodeLists.flatten(masterNodeList[currentIndex]));
            var referenceElement;
            if (currentIndex < newIndex) {
                referenceElement = nodeLists.last(referenceNodeList).nextSibling;
            } else {
                referenceElement = nodeLists.first(referenceNodeList);
            }
            var parentNode = masterNodeList[0].parentNode;
            parentNode.insertBefore(movedElements, referenceElement);
            var temp = masterNodeList[currentIndex];
            [].splice.apply(masterNodeList, [
                currentIndex,
                1
            ]);
            [].splice.apply(masterNodeList, [
                newIndex,
                0,
                temp
            ]);
            newIndex = newIndex - 1;
            currentIndex = currentIndex - 1;
            var indexCompute = indexMap[currentIndex];
            [].splice.apply(indexMap, [
                currentIndex,
                1
            ]);
            [].splice.apply(indexMap, [
                newIndex,
                0,
                indexCompute
            ]);
            var i = Math.min(currentIndex, newIndex);
            var len = indexMap.length;
            for (i, len; i < len; i++) {
                indexMap[i].set(i);
            }
        },
        set: function (newVal, index) {
            this.remove({ length: 1 }, index, true);
            this.add([newVal], index);
        }
    };
    live.list = function (el, list, render, context, parentNode, nodeList, falseyRender) {
        if (el.nodeType !== Node.TEXT_NODE) {
            var textNode;
            if (!nodeList) {
                textNode = document.createTextNode('');
                el.parentNode.replaceChild(textNode, el);
                el = textNode;
            } else {
                textNode = document.createTextNode('');
                nodeLists.replace(nodeList, textNode);
                nodeLists.update(nodeList, [textNode]);
                el = textNode;
            }
        }
        new ListDOMPatcher(el, list, render, context, parentNode, nodeList, falseyRender);
    };
});
/*can-view-live@4.2.7#lib/text*/
define('can-view-live@4.2.7#lib/text', [
    'require',
    'exports',
    'module',
    './core',
    'can-view-nodelist',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var live = require('./core');
    var nodeLists = require('can-view-nodelist');
    var canReflect = require('can-reflect');
    live.text = function (el, compute, parentNode, nodeList) {
        if (el.nodeType !== Node.TEXT_NODE) {
            var textNode;
            if (!nodeList) {
                textNode = document.createTextNode('');
                el.parentNode.replaceChild(textNode, el);
                el = textNode;
            } else {
                textNode = document.createTextNode('');
                nodeLists.replace(nodeList, textNode);
                nodeLists.update(nodeList, [textNode]);
                el = textNode;
            }
        }
        var parent = live.getParentNode(el, parentNode);
        el.nodeValue = live.makeString(canReflect.getValue(compute));
        function liveTextUpdateTextNode(newVal) {
            el.nodeValue = live.makeString(newVal);
        }
        var data = live.listen(parent, compute, liveTextUpdateTextNode, 'domUI');
        if (!nodeList) {
            nodeList = nodeLists.register([el], null, true);
        }
        nodeList.unregistered = data.teardownCheck;
        data.nodeList = nodeList;
    };
});
/*can-view-live@4.2.7#can-view-live*/
define('can-view-live@4.2.7#can-view-live', [
    'require',
    'exports',
    'module',
    './lib/core',
    './lib/attr',
    './lib/attrs',
    './lib/html',
    './lib/list',
    './lib/text'
], function (require, exports, module) {
    'use strict';
    var live = require('./lib/core');
    require('./lib/attr');
    require('./lib/attrs');
    require('./lib/html');
    require('./lib/list');
    require('./lib/text');
    module.exports = live;
});
/*can-stache@4.17.5#src/text_section*/
define('can-stache@4.17.5#src/text_section', [
    'require',
    'exports',
    'module',
    'can-view-live',
    './utils',
    'can-dom-mutate/node',
    'can-assign',
    'can-reflect',
    'can-observation'
], function (require, exports, module) {
    'use strict';
    var live = require('can-view-live');
    var utils = require('./utils');
    var domMutate = require('can-dom-mutate/node');
    var assign = require('can-assign');
    var canReflect = require('can-reflect');
    var Observation = require('can-observation');
    var noop = function () {
    };
    var TextSectionBuilder = function (filename) {
        if (filename) {
            this.filename = filename;
        }
        this.stack = [new TextSection()];
    };
    assign(TextSectionBuilder.prototype, utils.mixins);
    assign(TextSectionBuilder.prototype, {
        startSection: function (process) {
            var subSection = new TextSection();
            this.last().add({
                process: process,
                truthy: subSection
            });
            this.stack.push(subSection);
        },
        endSection: function () {
            this.stack.pop();
        },
        inverse: function () {
            this.stack.pop();
            var falseySection = new TextSection();
            this.last().last().falsey = falseySection;
            this.stack.push(falseySection);
        },
        compile: function (state) {
            var renderer = this.stack[0].compile();
            return function (scope) {
                function textSectionRender() {
                    return renderer(scope);
                }
                var observation = new Observation(textSectionRender, null, { isObservable: false });
                canReflect.onValue(observation, noop);
                var value = canReflect.getValue(observation);
                if (canReflect.valueHasDependencies(observation)) {
                    if (state.textContentOnly) {
                        live.text(this, observation);
                    } else if (state.attr) {
                        live.attr(this, state.attr, observation);
                    } else {
                        live.attrs(this, observation, scope);
                    }
                    canReflect.offValue(observation, noop);
                } else {
                    if (state.textContentOnly) {
                        this.nodeValue = value;
                    } else if (state.attr) {
                        domMutate.setAttribute.call(this, state.attr, value);
                    } else {
                        live.attrs(this, value);
                    }
                }
            };
        }
    });
    var passTruthyFalsey = function (process, truthy, falsey) {
        return function (scope) {
            return process.call(this, scope, truthy, falsey);
        };
    };
    var TextSection = function () {
        this.values = [];
    };
    assign(TextSection.prototype, {
        add: function (data) {
            this.values.push(data);
        },
        last: function () {
            return this.values[this.values.length - 1];
        },
        compile: function () {
            var values = this.values, len = values.length;
            for (var i = 0; i < len; i++) {
                var value = this.values[i];
                if (typeof value === 'object') {
                    values[i] = passTruthyFalsey(value.process, value.truthy && value.truthy.compile(), value.falsey && value.falsey.compile());
                }
            }
            return function (scope) {
                var txt = '', value;
                for (var i = 0; i < len; i++) {
                    value = values[i];
                    txt += typeof value === 'string' ? value : value.call(this, scope);
                }
                return txt;
            };
        }
    });
    module.exports = TextSectionBuilder;
});
/*can-stache@4.17.5#expressions/arg*/
define('can-stache@4.17.5#expressions/arg', function (require, exports, module) {
    'use strict';
    var Arg = function (expression, modifiers) {
        this.expr = expression;
        this.modifiers = modifiers || {};
        this.isCompute = false;
    };
    Arg.prototype.value = function () {
        return this.expr.value.apply(this.expr, arguments);
    };
    module.exports = Arg;
});
/*can-stache@4.17.5#expressions/literal*/
define('can-stache@4.17.5#expressions/literal', function (require, exports, module) {
    'use strict';
    var Literal = function (value) {
        this._value = value;
    };
    Literal.prototype.value = function () {
        return this._value;
    };
    module.exports = Literal;
});
/*can-simple-observable@2.4.1#setter/setter*/
define('can-simple-observable@2.4.1#setter/setter', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observation',
    '../settable/settable',
    'can-event-queue/value/value'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var Observation = require('can-observation');
    var SettableObservable = require('../settable/settable');
    var valueEventBindings = require('can-event-queue/value/value');
    function SetterObservable(getter, setter) {
        this.setter = setter;
        this.observation = new Observation(getter);
        this.handler = this.handler.bind(this);
    }
    SetterObservable.prototype = Object.create(SettableObservable.prototype);
    SetterObservable.prototype.constructor = SetterObservable;
    SetterObservable.prototype.set = function (newVal) {
        this.setter(newVal);
    };
    SetterObservable.prototype.hasDependencies = function () {
        return canReflect.valueHasDependencies(this.observation);
    };
    canReflect.assignSymbols(SetterObservable.prototype, {
        'can.setValue': SetterObservable.prototype.set,
        'can.valueHasDependencies': SetterObservable.prototype.hasDependencies
    });
    module.exports = SetterObservable;
});
/*can-stache@4.17.5#src/expression-helpers*/
define('can-stache@4.17.5#src/expression-helpers', [
    'require',
    'exports',
    'module',
    '../expressions/arg',
    '../expressions/literal',
    'can-reflect',
    'can-stache-key',
    'can-observation',
    'can-observation-recorder',
    'can-view-scope/make-compute-like',
    'can-simple-observable/setter/setter'
], function (require, exports, module) {
    'use strict';
    var Arg = require('../expressions/arg');
    var Literal = require('../expressions/literal');
    var canReflect = require('can-reflect');
    var stacheKey = require('can-stache-key');
    var Observation = require('can-observation');
    var ObservationRecorder = require('can-observation-recorder');
    var makeComputeLike = require('can-view-scope/make-compute-like');
    var SetterObservable = require('can-simple-observable/setter/setter');
    function getObservableValue_fromDynamicKey_fromObservable(key, root, helperOptions, readOptions) {
        var getKeys = function () {
            return stacheKey.reads(('' + canReflect.getValue(key)).replace(/\./g, '\\.'));
        };
        var parentHasKey;
        var computeValue = new SetterObservable(function getDynamicKey() {
            var readData = stacheKey.read(canReflect.getValue(root), getKeys());
            parentHasKey = readData.parentHasKey;
            return readData.value;
        }, function setDynamicKey(newVal) {
            stacheKey.write(canReflect.getValue(root), getKeys(), newVal);
        });
        Observation.temporarilyBind(computeValue);
        computeValue.initialValue = ObservationRecorder.peekValue(computeValue);
        computeValue.parentHasKey = parentHasKey;
        return computeValue;
    }
    function convertToArgExpression(expr) {
        if (!(expr instanceof Arg) && !(expr instanceof Literal)) {
            return new Arg(expr);
        } else {
            return expr;
        }
    }
    function toComputeOrValue(value) {
        if (canReflect.isObservableLike(value)) {
            if (canReflect.isValueLike(value) && canReflect.valueHasDependencies(value) === false) {
                return canReflect.getValue(value);
            }
            if (value.compute) {
                return value.compute;
            } else {
                return makeComputeLike(value);
            }
        }
        return value;
    }
    function toCompute(value) {
        if (value) {
            if (value.isComputed) {
                return value;
            }
            if (value.compute) {
                return value.compute;
            } else {
                return makeComputeLike(value);
            }
        }
        return value;
    }
    module.exports = {
        getObservableValue_fromDynamicKey_fromObservable: getObservableValue_fromDynamicKey_fromObservable,
        convertToArgExpression: convertToArgExpression,
        toComputeOrValue: toComputeOrValue,
        toCompute: toCompute
    };
});
/*can-stache@4.17.5#expressions/hashes*/
define('can-stache@4.17.5#expressions/hashes', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observation',
    '../src/expression-helpers'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var Observation = require('can-observation');
    var expressionHelpers = require('../src/expression-helpers');
    var Hashes = function (hashes) {
        this.hashExprs = hashes;
    };
    Hashes.prototype.value = function (scope, helperOptions) {
        var hash = {};
        for (var prop in this.hashExprs) {
            var val = expressionHelpers.convertToArgExpression(this.hashExprs[prop]), value = val.value.apply(val, arguments);
            hash[prop] = {
                call: !val.modifiers || !val.modifiers.compute,
                value: value
            };
        }
        return new Observation(function () {
            var finalHash = {};
            for (var prop in hash) {
                finalHash[prop] = hash[prop].call ? canReflect.getValue(hash[prop].value) : expressionHelpers.toComputeOrValue(hash[prop].value);
            }
            return finalHash;
        });
    };
    module.exports = Hashes;
});
/*can-stache@4.17.5#expressions/bracket*/
define('can-stache@4.17.5#expressions/bracket', [
    'require',
    'exports',
    'module',
    '../src/expression-helpers'
], function (require, exports, module) {
    'use strict';
    var expressionHelpers = require('../src/expression-helpers');
    var Bracket = function (key, root, originalKey) {
        this.root = root;
        this.key = key;
    };
    Bracket.prototype.value = function (scope, helpers) {
        var root = this.root ? this.root.value(scope, helpers) : scope.peek('this');
        return expressionHelpers.getObservableValue_fromDynamicKey_fromObservable(this.key.value(scope, helpers), root, scope, helpers, {});
    };
    Bracket.prototype.closingTag = function () {
    };
    module.exports = Bracket;
});
/*can-stache@4.17.5#src/set-identifier*/
define('can-stache@4.17.5#src/set-identifier', function (require, exports, module) {
    'use strict';
    module.exports = function SetIdentifier(value) {
        this.value = value;
    };
});
/*can-stache@4.17.5#expressions/call*/
define('can-stache@4.17.5#expressions/call', [
    'require',
    'exports',
    'module',
    './hashes',
    '../src/set-identifier',
    'can-symbol',
    'can-simple-observable/setter/setter',
    '../src/expression-helpers',
    'can-reflect',
    'can-assign',
    'can-view-scope',
    'can-observation'
], function (require, exports, module) {
    'use strict';
    var Hashes = require('./hashes');
    var SetIdentifier = require('../src/set-identifier');
    var canSymbol = require('can-symbol');
    var SetterObservable = require('can-simple-observable/setter/setter');
    var expressionHelpers = require('../src/expression-helpers');
    var canReflect = require('can-reflect');
    var assign = require('can-assign');
    var sourceTextSymbol = canSymbol.for('can-stache.sourceText');
    var isViewSymbol = canSymbol.for('can.isView');
    var Scope = require('can-view-scope');
    var Observation = require('can-observation');
    var Call = function (methodExpression, argExpressions) {
        this.methodExpr = methodExpression;
        this.argExprs = argExpressions.map(expressionHelpers.convertToArgExpression);
    };
    Call.prototype.args = function (scope, ignoreArgLookup) {
        var hashExprs = {};
        var args = [];
        var gotIgnoreFunction = typeof ignoreArgLookup === 'function';
        for (var i = 0, len = this.argExprs.length; i < len; i++) {
            var arg = this.argExprs[i];
            if (arg.expr instanceof Hashes) {
                assign(hashExprs, arg.expr.hashExprs);
            }
            if (!gotIgnoreFunction || !ignoreArgLookup(i)) {
                var value = arg.value.apply(arg, arguments);
                args.push({
                    call: !arg.modifiers || !arg.modifiers.compute,
                    value: value
                });
            }
        }
        return function (doNotWrapArguments) {
            var finalArgs = [];
            if (canReflect.size(hashExprs) > 0) {
                finalArgs.hashExprs = hashExprs;
            }
            for (var i = 0, len = args.length; i < len; i++) {
                if (doNotWrapArguments) {
                    finalArgs[i] = args[i].value;
                } else {
                    finalArgs[i] = args[i].call ? canReflect.getValue(args[i].value) : expressionHelpers.toCompute(args[i].value);
                }
            }
            return finalArgs;
        };
    };
    Call.prototype.value = function (scope, helperOptions) {
        var callExpression = this;
        var method = this.methodExpr.value(scope, { proxyMethods: false });
        Observation.temporarilyBind(method);
        var func = canReflect.getValue(method);
        var getArgs = callExpression.args(scope, func && func.ignoreArgLookup);
        var computeFn = function (newVal) {
            var func = canReflect.getValue(method);
            if (typeof func === 'function') {
                if (canReflect.isObservableLike(func)) {
                    func = canReflect.getValue(func);
                }
                var args = getArgs(func.isLiveBound);
                if (func.requiresOptionsArgument) {
                    if (args.hashExprs && helperOptions && helperOptions.exprData) {
                        helperOptions.exprData.hashExprs = args.hashExprs;
                    }
                    if (helperOptions !== undefined) {
                        args.push(helperOptions);
                    }
                }
                if (func[isViewSymbol] === true) {
                    if (!(args[0] instanceof Scope)) {
                        args[0] = scope.getTemplateContext().add(args[0]);
                    }
                    args.push(helperOptions.nodeList);
                }
                if (arguments.length) {
                    args.unshift(new SetIdentifier(newVal));
                }
                return func.apply(method.thisArg || scope.peek('this'), args);
            }
        };
        if (helperOptions && helperOptions.doNotWrapInObservation) {
            return computeFn();
        } else {
            var computeValue = new SetterObservable(computeFn, computeFn);
            return computeValue;
        }
    };
    Call.prototype.closingTag = function () {
        return this.methodExpr.key;
    };
    module.exports = Call;
});
/*can-stache@4.17.5#expressions/helper*/
define('can-stache@4.17.5#expressions/helper', [
    'require',
    'exports',
    'module',
    './literal',
    './hashes',
    'can-assign',
    'can-log/dev/dev',
    '../src/expression-helpers',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var Literal = require('./literal');
    var Hashes = require('./hashes');
    var assign = require('can-assign');
    var dev = require('can-log/dev/dev');
    var expressionHelpers = require('../src/expression-helpers');
    var canReflect = require('can-reflect');
    var Helper = function (methodExpression, argExpressions, hashExpressions) {
        this.methodExpr = methodExpression;
        this.argExprs = argExpressions;
        this.hashExprs = hashExpressions;
        this.mode = null;
    };
    Helper.prototype.args = function (scope) {
        var args = [];
        for (var i = 0, len = this.argExprs.length; i < len; i++) {
            var arg = this.argExprs[i];
            args.push(expressionHelpers.toComputeOrValue(arg.value.apply(arg, arguments)));
        }
        return args;
    };
    Helper.prototype.hash = function (scope) {
        var hash = {};
        for (var prop in this.hashExprs) {
            var val = this.hashExprs[prop];
            hash[prop] = expressionHelpers.toComputeOrValue(val.value.apply(val, arguments));
        }
        return hash;
    };
    Helper.prototype.value = function (scope, helperOptions) {
        var methodKey = this.methodExpr instanceof Literal ? '' + this.methodExpr._value : this.methodExpr.key, helperInstance = this, helperFn = scope.computeData(methodKey, { proxyMethods: false }), initialValue = helperFn && helperFn.initialValue, thisArg = helperFn && helperFn.thisArg;
        if (typeof initialValue === 'function') {
            helperFn = function helperFn() {
                var args = helperInstance.args(scope), helperOptionArg = assign(assign({}, helperOptions), {
                        hash: helperInstance.hash(scope),
                        exprData: helperInstance
                    });
                args.push(helperOptionArg);
                return initialValue.apply(thisArg || scope.peek('this'), args);
            };
        }
        return helperFn;
    };
    Helper.prototype.closingTag = function () {
        return this.methodExpr.key;
    };
    module.exports = Helper;
});
/*can-stache@4.17.5#expressions/lookup*/
define('can-stache@4.17.5#expressions/lookup', [
    'require',
    'exports',
    'module',
    '../src/expression-helpers',
    'can-reflect',
    'can-symbol',
    'can-assign'
], function (require, exports, module) {
    'use strict';
    var expressionHelpers = require('../src/expression-helpers');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var sourceTextSymbol = canSymbol.for('can-stache.sourceText');
    var assign = require('can-assign');
    var Lookup = function (key, root, sourceText) {
        this.key = key;
        this.rootExpr = root;
        canReflect.setKeyValue(this, sourceTextSymbol, sourceText);
    };
    Lookup.prototype.value = function (scope, readOptions) {
        if (this.rootExpr) {
            return expressionHelpers.getObservableValue_fromDynamicKey_fromObservable(this.key, this.rootExpr.value(scope), scope, {}, {});
        } else {
            return scope.computeData(this.key, assign({ warnOnMissingKey: true }, readOptions));
        }
    };
    module.exports = Lookup;
});
/*can-stache@4.17.5#src/expression*/
define('can-stache@4.17.5#src/expression', [
    'require',
    'exports',
    'module',
    '../expressions/arg',
    '../expressions/literal',
    '../expressions/hashes',
    '../expressions/bracket',
    '../expressions/call',
    '../expressions/helper',
    '../expressions/lookup',
    './set-identifier',
    '../src/expression-helpers',
    './utils',
    'can-assign',
    'can-reflect',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var Arg = require('../expressions/arg');
    var Literal = require('../expressions/literal');
    var Hashes = require('../expressions/hashes');
    var Bracket = require('../expressions/bracket');
    var Call = require('../expressions/call');
    var Helper = require('../expressions/helper');
    var Lookup = require('../expressions/lookup');
    var SetIdentifier = require('./set-identifier');
    var expressionHelpers = require('../src/expression-helpers');
    var utils = require('./utils');
    var assign = require('can-assign');
    var last = utils.last;
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var sourceTextSymbol = canSymbol.for('can-stache.sourceText');
    var Hash = function () {
    };
    var keyRegExp = /[\w\.\\\-_@\/\&%]+/, tokensRegExp = /('.*?'|".*?"|=|[\w\.\\\-_@\/*%\$]+|[\(\)]|,|\~|\[|\]\s*|\s*(?=\[))/g, bracketSpaceRegExp = /\]\s+/, literalRegExp = /^('.*?'|".*?"|-?[0-9]+\.?[0-9]*|true|false|null|undefined)$/;
    var isTokenKey = function (token) {
        return keyRegExp.test(token);
    };
    var testDot = /^[\.@]\w/;
    var isAddingToExpression = function (token) {
        return isTokenKey(token) && testDot.test(token);
    };
    var ensureChildren = function (type) {
        if (!type.children) {
            type.children = [];
        }
        return type;
    };
    var Stack = function () {
        this.root = {
            children: [],
            type: 'Root'
        };
        this.current = this.root;
        this.stack = [this.root];
    };
    assign(Stack.prototype, {
        top: function () {
            return last(this.stack);
        },
        isRootTop: function () {
            return this.top() === this.root;
        },
        popTo: function (types) {
            this.popUntil(types);
            this.pop();
        },
        pop: function () {
            if (!this.isRootTop()) {
                this.stack.pop();
            }
        },
        first: function (types) {
            var curIndex = this.stack.length - 1;
            while (curIndex > 0 && types.indexOf(this.stack[curIndex].type) === -1) {
                curIndex--;
            }
            return this.stack[curIndex];
        },
        firstParent: function (types) {
            var curIndex = this.stack.length - 2;
            while (curIndex > 0 && types.indexOf(this.stack[curIndex].type) === -1) {
                curIndex--;
            }
            return this.stack[curIndex];
        },
        popUntil: function (types) {
            while (types.indexOf(this.top().type) === -1 && !this.isRootTop()) {
                this.stack.pop();
            }
            return this.top();
        },
        addTo: function (types, type) {
            var cur = this.popUntil(types);
            ensureChildren(cur).children.push(type);
        },
        addToAndPush: function (types, type) {
            this.addTo(types, type);
            this.stack.push(type);
        },
        push: function (type) {
            this.stack.push(type);
        },
        topLastChild: function () {
            return last(this.top().children);
        },
        replaceTopLastChild: function (type) {
            var children = ensureChildren(this.top()).children;
            children.pop();
            children.push(type);
            return type;
        },
        replaceTopLastChildAndPush: function (type) {
            this.replaceTopLastChild(type);
            this.stack.push(type);
        },
        replaceTopAndPush: function (type) {
            var children;
            if (this.top() === this.root) {
                children = ensureChildren(this.top()).children;
            } else {
                this.stack.pop();
                children = ensureChildren(this.top()).children;
            }
            children.pop();
            children.push(type);
            this.stack.push(type);
            return type;
        }
    });
    var convertKeyToLookup = function (key) {
        var lastPath = key.lastIndexOf('./');
        var lastDot = key.lastIndexOf('.');
        if (lastDot > lastPath) {
            return key.substr(0, lastDot) + '@' + key.substr(lastDot + 1);
        }
        var firstNonPathCharIndex = lastPath === -1 ? 0 : lastPath + 2;
        var firstNonPathChar = key.charAt(firstNonPathCharIndex);
        if (firstNonPathChar === '.' || firstNonPathChar === '@') {
            return key.substr(0, firstNonPathCharIndex) + '@' + key.substr(firstNonPathCharIndex + 1);
        } else {
            return key.substr(0, firstNonPathCharIndex) + '@' + key.substr(firstNonPathCharIndex);
        }
    };
    var convertToAtLookup = function (ast) {
        if (ast.type === 'Lookup') {
            canReflect.setKeyValue(ast, sourceTextSymbol, ast.key);
            ast.key = convertKeyToLookup(ast.key);
        }
        return ast;
    };
    var convertToHelperIfTopIsLookup = function (stack) {
        var top = stack.top();
        if (top && top.type === 'Lookup') {
            var base = stack.stack[stack.stack.length - 2];
            if (base.type !== 'Helper' && base) {
                stack.replaceTopAndPush({
                    type: 'Helper',
                    method: top
                });
            }
        }
    };
    var expression = {
        toComputeOrValue: expressionHelpers.toComputeOrValue,
        convertKeyToLookup: convertKeyToLookup,
        Literal: Literal,
        Lookup: Lookup,
        Arg: Arg,
        Hash: Hash,
        Hashes: Hashes,
        Call: Call,
        Helper: Helper,
        Bracket: Bracket,
        SetIdentifier: SetIdentifier,
        tokenize: function (expression) {
            var tokens = [];
            (expression.trim() + ' ').replace(tokensRegExp, function (whole, arg) {
                if (bracketSpaceRegExp.test(arg)) {
                    tokens.push(arg[0]);
                    tokens.push(arg.slice(1));
                } else {
                    tokens.push(arg);
                }
            });
            return tokens;
        },
        lookupRules: {
            'default': function (ast, methodType, isArg) {
                return ast.type === 'Helper' ? Helper : Lookup;
            },
            'method': function (ast, methodType, isArg) {
                return Lookup;
            }
        },
        methodRules: {
            'default': function (ast) {
                return ast.type === 'Call' ? Call : Helper;
            },
            'call': function (ast) {
                return Call;
            }
        },
        parse: function (expressionString, options) {
            options = options || {};
            var ast = this.ast(expressionString);
            if (!options.lookupRule) {
                options.lookupRule = 'default';
            }
            if (typeof options.lookupRule === 'string') {
                options.lookupRule = expression.lookupRules[options.lookupRule];
            }
            if (!options.methodRule) {
                options.methodRule = 'default';
            }
            if (typeof options.methodRule === 'string') {
                options.methodRule = expression.methodRules[options.methodRule];
            }
            var expr = this.hydrateAst(ast, options, options.baseMethodType || 'Helper');
            return expr;
        },
        hydrateAst: function (ast, options, methodType, isArg) {
            var hashes;
            if (ast.type === 'Lookup') {
                var LookupRule = options.lookupRule(ast, methodType, isArg);
                var lookup = new LookupRule(ast.key, ast.root && this.hydrateAst(ast.root, options, methodType), ast[sourceTextSymbol]);
                return lookup;
            } else if (ast.type === 'Literal') {
                return new Literal(ast.value);
            } else if (ast.type === 'Arg') {
                return new Arg(this.hydrateAst(ast.children[0], options, methodType, isArg), { compute: true });
            } else if (ast.type === 'Hash') {
                throw new Error('');
            } else if (ast.type === 'Hashes') {
                hashes = {};
                ast.children.forEach(function (hash) {
                    hashes[hash.prop] = this.hydrateAst(hash.children[0], options, methodType, true);
                }, this);
                return new Hashes(hashes);
            } else if (ast.type === 'Call' || ast.type === 'Helper') {
                hashes = {};
                var args = [], children = ast.children, ExpressionType = options.methodRule(ast);
                if (children) {
                    for (var i = 0; i < children.length; i++) {
                        var child = children[i];
                        if (child.type === 'Hashes' && ast.type === 'Helper' && ExpressionType !== Call) {
                            child.children.forEach(function (hash) {
                                hashes[hash.prop] = this.hydrateAst(hash.children[0], options, ast.type, true);
                            }, this);
                        } else {
                            args.push(this.hydrateAst(child, options, ast.type, true));
                        }
                    }
                }
                return new ExpressionType(this.hydrateAst(ast.method, options, ast.type), args, hashes);
            } else if (ast.type === 'Bracket') {
                var originalKey;
                return new Bracket(this.hydrateAst(ast.children[0], options), ast.root ? this.hydrateAst(ast.root, options) : undefined, originalKey);
            }
        },
        ast: function (expression) {
            var tokens = this.tokenize(expression);
            return this.parseAst(tokens, { index: 0 });
        },
        parseAst: function (tokens, cursor) {
            var stack = new Stack(), top, firstParent, lastToken;
            while (cursor.index < tokens.length) {
                var token = tokens[cursor.index], nextToken = tokens[cursor.index + 1];
                cursor.index++;
                if (nextToken === '=') {
                    top = stack.top();
                    if (top && top.type === 'Lookup') {
                        firstParent = stack.firstParent([
                            'Call',
                            'Helper',
                            'Hash'
                        ]);
                        if (firstParent.type === 'Call' || firstParent.type === 'Root') {
                            stack.popUntil(['Call']);
                            top = stack.top();
                            stack.replaceTopAndPush({
                                type: 'Helper',
                                method: top.type === 'Root' ? last(top.children) : top
                            });
                        }
                    }
                    firstParent = stack.first([
                        'Call',
                        'Helper',
                        'Hashes',
                        'Root'
                    ]);
                    var hash = {
                        type: 'Hash',
                        prop: token
                    };
                    if (firstParent.type === 'Hashes') {
                        stack.addToAndPush(['Hashes'], hash);
                    } else {
                        stack.addToAndPush([
                            'Helper',
                            'Call',
                            'Root'
                        ], {
                            type: 'Hashes',
                            children: [hash]
                        });
                        stack.push(hash);
                    }
                    cursor.index++;
                } else if (literalRegExp.test(token)) {
                    convertToHelperIfTopIsLookup(stack);
                    firstParent = stack.first([
                        'Helper',
                        'Call',
                        'Hash',
                        'Bracket'
                    ]);
                    if (firstParent.type === 'Hash' && (firstParent.children && firstParent.children.length > 0)) {
                        stack.addTo([
                            'Helper',
                            'Call',
                            'Bracket'
                        ], {
                            type: 'Literal',
                            value: utils.jsonParse(token)
                        });
                    } else if (firstParent.type === 'Bracket' && (firstParent.children && firstParent.children.length > 0)) {
                        stack.addTo([
                            'Helper',
                            'Call',
                            'Hash'
                        ], {
                            type: 'Literal',
                            value: utils.jsonParse(token)
                        });
                    } else {
                        stack.addTo([
                            'Helper',
                            'Call',
                            'Hash',
                            'Bracket'
                        ], {
                            type: 'Literal',
                            value: utils.jsonParse(token)
                        });
                    }
                } else if (keyRegExp.test(token)) {
                    lastToken = stack.topLastChild();
                    firstParent = stack.first([
                        'Helper',
                        'Call',
                        'Hash',
                        'Bracket'
                    ]);
                    if (lastToken && (lastToken.type === 'Call' || lastToken.type === 'Bracket') && isAddingToExpression(token)) {
                        stack.replaceTopLastChildAndPush({
                            type: 'Lookup',
                            root: lastToken,
                            key: token.slice(1)
                        });
                    } else if (firstParent.type === 'Bracket') {
                        if (!(firstParent.children && firstParent.children.length > 0)) {
                            stack.addToAndPush(['Bracket'], {
                                type: 'Lookup',
                                key: token
                            });
                        } else {
                            if (stack.first([
                                    'Helper',
                                    'Call',
                                    'Hash',
                                    'Arg'
                                ]).type === 'Helper' && token[0] !== '.') {
                                stack.addToAndPush(['Helper'], {
                                    type: 'Lookup',
                                    key: token
                                });
                            } else {
                                stack.replaceTopAndPush({
                                    type: 'Lookup',
                                    key: token.slice(1),
                                    root: firstParent
                                });
                            }
                        }
                    } else {
                        convertToHelperIfTopIsLookup(stack);
                        stack.addToAndPush([
                            'Helper',
                            'Call',
                            'Hash',
                            'Arg',
                            'Bracket'
                        ], {
                            type: 'Lookup',
                            key: token
                        });
                    }
                } else if (token === '~') {
                    convertToHelperIfTopIsLookup(stack);
                    stack.addToAndPush([
                        'Helper',
                        'Call',
                        'Hash'
                    ], {
                        type: 'Arg',
                        key: token
                    });
                } else if (token === '(') {
                    top = stack.top();
                    if (top.type === 'Lookup') {
                        stack.replaceTopAndPush({
                            type: 'Call',
                            method: convertToAtLookup(top)
                        });
                    } else {
                        throw new Error('Unable to understand expression ' + tokens.join(''));
                    }
                } else if (token === ')') {
                    stack.popTo(['Call']);
                } else if (token === ',') {
                    var call = stack.first(['Call']);
                    if (call.type !== 'Call') {
                        stack.popUntil(['Hash']);
                    } else {
                        stack.popUntil(['Call']);
                    }
                } else if (token === '[') {
                    top = stack.top();
                    lastToken = stack.topLastChild();
                    if (lastToken && (lastToken.type === 'Call' || lastToken.type === 'Bracket')) {
                        stack.replaceTopLastChildAndPush({
                            type: 'Bracket',
                            root: lastToken
                        });
                    } else if (top.type === 'Lookup' || top.type === 'Bracket') {
                        var bracket = {
                            type: 'Bracket',
                            root: top
                        };
                        stack.replaceTopAndPush(bracket);
                    } else if (top.type === 'Call') {
                        stack.addToAndPush(['Call'], { type: 'Bracket' });
                    } else if (top === ' ') {
                        stack.popUntil([
                            'Lookup',
                            'Call'
                        ]);
                        convertToHelperIfTopIsLookup(stack);
                        stack.addToAndPush([
                            'Helper',
                            'Call',
                            'Hash'
                        ], { type: 'Bracket' });
                    } else {
                        stack.replaceTopAndPush({ type: 'Bracket' });
                    }
                } else if (token === ']') {
                    stack.pop();
                } else if (token === ' ') {
                    stack.push(token);
                }
            }
            return stack.root.children[0];
        }
    };
    module.exports = expression;
});
/*can-stache@4.17.5#src/mustache_core*/
define('can-stache@4.17.5#src/mustache_core', [
    'require',
    'exports',
    'module',
    'can-view-live',
    'can-view-nodelist',
    'can-observation',
    'can-observation-recorder',
    './utils',
    './expression',
    'can-fragment',
    'can-dom-mutate',
    'can-symbol',
    'can-reflect',
    'can-log/dev/dev',
    'can-globals/document/document',
    'can-define-lazy-value'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var live = require('can-view-live');
        var nodeLists = require('can-view-nodelist');
        var Observation = require('can-observation');
        var ObservationRecorder = require('can-observation-recorder');
        var utils = require('./utils');
        var expression = require('./expression');
        var frag = require('can-fragment');
        var domMutate = require('can-dom-mutate');
        var canSymbol = require('can-symbol');
        var canReflect = require('can-reflect');
        var dev = require('can-log/dev/dev');
        var getDocument = require('can-globals/document/document');
        var defineLazyValue = require('can-define-lazy-value');
        var toDOMSymbol = canSymbol.for('can.toDOM');
        function HelperOptions(scope, nodeList, exprData, stringOnly) {
            this.metadata = { rendered: false };
            this.stringOnly = stringOnly;
            this.scope = scope;
            this.nodeList = nodeList;
            this.exprData = exprData;
        }
        defineLazyValue(HelperOptions.prototype, 'context', function () {
            return this.scope.peek('this');
        });
        var mustacheLineBreakRegExp = /(?:(^|\r?\n)(\s*)(\{\{([\s\S]*)\}\}\}?)([^\S\n\r]*)($|\r?\n))|(\{\{([\s\S]*)\}\}\}?)/g, mustacheWhitespaceRegExp = /(\s*)(\{\{\{?)(-?)([\s\S]*?)(-?)(\}\}\}?)(\s*)/g, k = function () {
            };
        var viewInsertSymbol = canSymbol.for('can.viewInsert');
        function valueShouldBeInsertedAsHTML(value) {
            return value !== null && typeof value === 'object' && (typeof value[toDOMSymbol] === 'function' || typeof value[viewInsertSymbol] === 'function' || typeof value.nodeType === 'number');
        }
        var core = {
            expression: expression,
            makeEvaluator: function (scope, nodeList, mode, exprData, truthyRenderer, falseyRenderer, stringOnly) {
                if (mode === '^') {
                    var temp = truthyRenderer;
                    truthyRenderer = falseyRenderer;
                    falseyRenderer = temp;
                }
                var value, helperOptions = new HelperOptions(scope, nodeList, exprData, stringOnly);
                utils.createRenderers(helperOptions, scope, nodeList, truthyRenderer, falseyRenderer, stringOnly);
                if (exprData instanceof expression.Call) {
                    value = exprData.value(scope, helperOptions);
                } else if (exprData instanceof expression.Bracket) {
                    value = exprData.value(scope);
                } else if (exprData instanceof expression.Lookup) {
                    value = exprData.value(scope);
                } else if (exprData instanceof expression.Literal) {
                    value = exprData.value.bind(exprData);
                } else if (exprData instanceof expression.Helper && exprData.methodExpr instanceof expression.Bracket) {
                    value = exprData.methodExpr.value(scope, helperOptions);
                } else {
                    value = exprData.value(scope, helperOptions);
                    if (typeof value === 'function') {
                        return value;
                    }
                }
                if (!mode || helperOptions.metadata.rendered) {
                    return value;
                } else if (mode === '#' || mode === '^') {
                    return function () {
                        var finalValue = canReflect.getValue(value);
                        var result;
                        if (helperOptions.metadata.rendered) {
                            result = finalValue;
                        } else if (typeof finalValue !== 'string' && canReflect.isListLike(finalValue)) {
                            var isObserveList = canReflect.isObservableLike(finalValue) && canReflect.isListLike(finalValue);
                            if (canReflect.getKeyValue(finalValue, 'length')) {
                                if (stringOnly) {
                                    result = utils.getItemsStringContent(finalValue, isObserveList, helperOptions);
                                } else {
                                    result = frag(utils.getItemsFragContent(finalValue, helperOptions, scope));
                                }
                            } else {
                                result = helperOptions.inverse(scope);
                            }
                        } else {
                            result = finalValue ? helperOptions.fn(finalValue || scope) : helperOptions.inverse(scope);
                        }
                        helperOptions.metadata.rendered = false;
                        return result;
                    };
                } else {
                }
            },
            makeLiveBindingPartialRenderer: function (expressionString, state) {
                expressionString = expressionString.trim();
                var exprData, partialName = expressionString.split(/\s+/).shift();
                if (partialName !== expressionString) {
                    exprData = core.expression.parse(expressionString);
                }
                return function (scope, parentSectionNodeList) {
                    var nodeList = [this];
                    nodeList.expression = '>' + partialName;
                    nodeLists.register(nodeList, null, parentSectionNodeList || true, state.directlyNested);
                    var partialFrag = new Observation(function () {
                        var localPartialName = partialName;
                        var partialScope = scope;
                        if (exprData && exprData.argExprs.length === 1) {
                            var newContext = canReflect.getValue(exprData.argExprs[0].value(scope));
                            if (typeof newContext === 'undefined') {
                            } else {
                                partialScope = scope.add(newContext);
                            }
                        }
                        var partial = canReflect.getKeyValue(partialScope.templateContext.partials, localPartialName);
                        var renderer;
                        if (partial) {
                            renderer = function () {
                                return partial.render ? partial.render(partialScope, nodeList) : partial(partialScope);
                            };
                        } else {
                            var scopePartialName = partialScope.read(localPartialName, { isArgument: true }).value;
                            if (scopePartialName === null || !scopePartialName && localPartialName[0] === '*') {
                                return frag('');
                            }
                            if (scopePartialName) {
                                localPartialName = scopePartialName;
                            }
                            renderer = function () {
                                if (typeof localPartialName === 'function') {
                                    return localPartialName(partialScope, {}, nodeList);
                                } else {
                                    var domRenderer = core.getTemplateById(localPartialName);
                                    return domRenderer ? domRenderer(partialScope, {}, nodeList) : getDocument().createDocumentFragment();
                                }
                            };
                        }
                        var res = ObservationRecorder.ignore(renderer)();
                        return frag(res);
                    });
                    canReflect.setPriority(partialFrag, nodeList.nesting);
                    live.html(this, partialFrag, this.parentNode, nodeList);
                };
            },
            makeStringBranchRenderer: function (mode, expressionString, state) {
                var exprData = core.expression.parse(expressionString), fullExpression = mode + expressionString;
                var branchRenderer = function branchRenderer(scope, truthyRenderer, falseyRenderer) {
                    var evaluator = scope.__cache[fullExpression];
                    if (mode || !evaluator) {
                        evaluator = makeEvaluator(scope, null, mode, exprData, truthyRenderer, falseyRenderer, true);
                        if (!mode) {
                            scope.__cache[fullExpression] = evaluator;
                        }
                    }
                    var gotObservableValue = evaluator[canSymbol.for('can.onValue')], res;
                    if (gotObservableValue) {
                        res = canReflect.getValue(evaluator);
                    } else {
                        res = evaluator();
                    }
                    return res == null ? '' : '' + res;
                };
                branchRenderer.exprData = exprData;
                return branchRenderer;
            },
            makeLiveBindingBranchRenderer: function (mode, expressionString, state) {
                var exprData = core.expression.parse(expressionString);
                var branchRenderer = function branchRenderer(scope, parentSectionNodeList, truthyRenderer, falseyRenderer) {
                    var stringOnly = state.tag;
                    var nodeList = [this];
                    nodeList.expression = expressionString;
                    nodeLists.register(nodeList, null, parentSectionNodeList || true, state.directlyNested);
                    var evaluator = makeEvaluator(scope, nodeList, mode, exprData, truthyRenderer, falseyRenderer, stringOnly);
                    var gotObservableValue = evaluator[canSymbol.for('can.onValue')];
                    var observable;
                    if (gotObservableValue) {
                        observable = evaluator;
                    } else {
                        observable = new Observation(evaluator, null, { isObservable: false });
                    }
                    if (canReflect.setPriority(observable, nodeList.nesting) === false) {
                        throw new Error('can-stache unable to set priority on observable');
                    }
                    canReflect.onValue(observable, k);
                    var value = canReflect.getValue(observable);
                    if (typeof value === 'function' && !(exprData instanceof expression.Lookup)) {
                        ObservationRecorder.ignore(value)(this);
                    } else if (canReflect.valueHasDependencies(observable)) {
                        if (state.attr) {
                            live.attr(this, state.attr, observable);
                        } else if (state.tag) {
                            live.attrs(this, observable);
                        } else if (state.text && !valueShouldBeInsertedAsHTML(value)) {
                            live.text(this, observable, this.parentNode, nodeList);
                        } else {
                            live.html(this, observable, this.parentNode, { nodeList: nodeList });
                        }
                    } else {
                        if (state.attr) {
                            domMutate.setAttribute(this, state.attr, value);
                        } else if (state.tag) {
                            live.attrs(this, value);
                        } else if (state.text && !valueShouldBeInsertedAsHTML(value)) {
                            this.nodeValue = live.makeString(value);
                        } else if (value != null) {
                            if (typeof value[viewInsertSymbol] === 'function') {
                                var insert = value[viewInsertSymbol]({ nodeList: nodeList });
                                var oldNodes = nodeLists.update(nodeList, [insert]);
                                nodeLists.replace(oldNodes, insert);
                            } else {
                                nodeLists.replace([this], frag(value, this.ownerDocument));
                            }
                        }
                    }
                    canReflect.offValue(observable, k);
                };
                branchRenderer.exprData = exprData;
                return branchRenderer;
            },
            splitModeFromExpression: function (expression, state) {
                expression = expression.trim();
                var mode = expression.charAt(0);
                if ('#/{&^>!<'.indexOf(mode) >= 0) {
                    expression = expression.substr(1).trim();
                } else {
                    mode = null;
                }
                if (mode === '{' && state.node) {
                    mode = null;
                }
                return {
                    mode: mode,
                    expression: expression
                };
            },
            cleanLineEndings: function (template) {
                return template.replace(mustacheLineBreakRegExp, function (whole, returnBefore, spaceBefore, special, expression, spaceAfter, returnAfter, spaceLessSpecial, spaceLessExpression, matchIndex) {
                    spaceAfter = spaceAfter || '';
                    returnBefore = returnBefore || '';
                    spaceBefore = spaceBefore || '';
                    var modeAndExpression = splitModeFromExpression(expression || spaceLessExpression, {});
                    if (spaceLessSpecial || '>{'.indexOf(modeAndExpression.mode) >= 0) {
                        return whole;
                    } else if ('^#!/'.indexOf(modeAndExpression.mode) >= 0) {
                        spaceBefore = returnBefore + spaceBefore && ' ';
                        return spaceBefore + special + (matchIndex !== 0 && returnAfter.length ? returnBefore + '\n' : '');
                    } else {
                        return spaceBefore + special + spaceAfter + (spaceBefore.length || matchIndex !== 0 ? returnBefore + '\n' : '');
                    }
                });
            },
            cleanWhitespaceControl: function (template) {
                return template.replace(mustacheWhitespaceRegExp, function (whole, spaceBefore, bracketBefore, controlBefore, expression, controlAfter, bracketAfter, spaceAfter, matchIndex) {
                    if (controlBefore === '-') {
                        spaceBefore = '';
                    }
                    if (controlAfter === '-') {
                        spaceAfter = '';
                    }
                    return spaceBefore + bracketBefore + expression + bracketAfter + spaceAfter;
                });
            },
            getTemplateById: function () {
            }
        };
        var makeEvaluator = core.makeEvaluator, splitModeFromExpression = core.splitModeFromExpression;
        module.exports = core;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.1#base-url/base-url*/
define('can-globals@1.2.1#base-url/base-url', [
    'require',
    'exports',
    'module',
    '../can-globals-instance',
    '../global/global',
    '../document/document'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('../can-globals-instance');
        require('../global/global');
        require('../document/document');
        globals.define('base-url', function () {
            var global = globals.getKeyValue('global');
            var domDocument = globals.getKeyValue('document');
            if (domDocument && 'baseURI' in domDocument) {
                return domDocument.baseURI;
            } else if (global.location) {
                var href = global.location.href;
                var lastSlash = href.lastIndexOf('/');
                return lastSlash !== -1 ? href.substr(0, lastSlash) : href;
            } else if (typeof process !== 'undefined') {
                return process.cwd();
            }
        });
        module.exports = globals.makeExport('base-url');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-parse-uri@1.2.0#can-parse-uri*/
define('can-parse-uri@1.2.0#can-parse-uri', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    module.exports = namespace.parseURI = function (url) {
        var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
        return m ? {
            href: m[0] || '',
            protocol: m[1] || '',
            authority: m[2] || '',
            host: m[3] || '',
            hostname: m[4] || '',
            port: m[5] || '',
            pathname: m[6] || '',
            search: m[7] || '',
            hash: m[8] || ''
        } : null;
    };
});
/*can-join-uris@1.2.0#can-join-uris*/
define('can-join-uris@1.2.0#can-join-uris', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-parse-uri'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var parseURI = require('can-parse-uri');
    module.exports = namespace.joinURIs = function (base, href) {
        function removeDotSegments(input) {
            var output = [];
            input.replace(/^(\.\.?(\/|$))+/, '').replace(/\/(\.(\/|$))+/g, '/').replace(/\/\.\.$/, '/../').replace(/\/?[^\/]*/g, function (p) {
                if (p === '/..') {
                    output.pop();
                } else {
                    output.push(p);
                }
            });
            return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
        }
        href = parseURI(href || '');
        base = parseURI(base || '');
        return !href || !base ? null : (href.protocol || base.protocol) + (href.protocol || href.authority ? href.authority : base.authority) + removeDotSegments(href.protocol || href.authority || href.pathname.charAt(0) === '/' ? href.pathname : href.pathname ? (base.authority && !base.pathname ? '/' : '') + base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname : base.pathname) + (href.protocol || href.authority || href.pathname ? href.search : href.search || base.search) + href.hash;
    };
});
/*can-stache@4.17.5#helpers/-debugger*/
define('can-stache@4.17.5#helpers/-debugger', [
    'require',
    'exports',
    'module',
    'can-log'
], function (require, exports, module) {
    'use strict';
    var canLog = require('can-log');
    function noop() {
    }
    var resolveValue = noop;
    var evaluateArgs = noop;
    var __testing = {};
    function debuggerHelper(left, right) {
        canLog.warn('Forgotten {{debugger}} helper');
    }
    debuggerHelper.requiresOptionsArgument = true;
    module.exports = {
        helper: debuggerHelper,
        evaluateArgs: evaluateArgs,
        resolveValue: resolveValue,
        __testing: __testing
    };
});
/*can-stache@4.17.5#src/truthy-observable*/
define('can-stache@4.17.5#src/truthy-observable', [
    'require',
    'exports',
    'module',
    'can-observation',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var Observation = require('can-observation');
    var canReflect = require('can-reflect');
    module.exports = function (observable) {
        return new Observation(function truthyObservation() {
            var val = canReflect.getValue(observable);
            return !!val;
        });
    };
});
/*can-stache@4.17.5#helpers/converter*/
define('can-stache@4.17.5#helpers/converter', [
    'require',
    'exports',
    'module',
    '../src/set-identifier',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var SetIdentifier = require('../src/set-identifier');
    var canReflect = require('can-reflect');
    function makeConverter(getterSetter) {
        getterSetter = getterSetter || {};
        return function (newVal, source) {
            var args = canReflect.toArray(arguments);
            if (newVal instanceof SetIdentifier) {
                return typeof getterSetter.set === 'function' ? getterSetter.set.apply(this, [newVal.value].concat(args.slice(1))) : source(newVal.value);
            } else {
                return typeof getterSetter.get === 'function' ? getterSetter.get.apply(this, args) : args[0];
            }
        };
    }
    module.exports = makeConverter;
});
/*can-dom-data@1.0.1#can-dom-data*/
define('can-dom-data@1.0.1#can-dom-data', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var isEmptyObject = function (obj) {
        for (var prop in obj) {
            return false;
        }
        return true;
    };
    var data = new WeakMap();
    var deleteNode = function (node) {
        var nodeDeleted = false;
        if (data.has(node)) {
            nodeDeleted = true;
            data.delete(node);
        }
        return nodeDeleted;
    };
    var setData = function (node, name, value) {
        var store = data.get(node);
        if (store === undefined) {
            store = {};
            data.set(node, store);
        }
        if (name !== undefined) {
            store[name] = value;
        }
        return store;
    };
    var domData = {
        _data: data,
        get: function (node, key) {
            var store = data.get(node);
            return key === undefined ? store : store && store[key];
        },
        set: setData,
        clean: function (node, prop) {
            var itemData = data.get(node);
            if (itemData && itemData[prop]) {
                delete itemData[prop];
            }
            if (isEmptyObject(itemData)) {
                deleteNode(node);
            }
        },
        delete: deleteNode
    };
    if (namespace.domData) {
        throw new Error('You can\'t have two versions of can-dom-data, check your dependencies');
    } else {
        module.exports = namespace.domData = domData;
    }
});
/*can-stache@4.17.5#helpers/-for-of*/
define('can-stache@4.17.5#helpers/-for-of', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observation',
    'can-view-live',
    'can-view-nodelist',
    '../src/expression',
    '../src/key-observable'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var Observation = require('can-observation');
    var live = require('can-view-live');
    var nodeLists = require('can-view-nodelist');
    var expression = require('../src/expression');
    var KeyObservable = require('../src/key-observable');
    var bindAndRead = function (value) {
        if (value && canReflect.isValueLike(value)) {
            Observation.temporarilyBind(value);
            return canReflect.getValue(value);
        } else {
            return value;
        }
    };
    function forOfObject(object, variableName, options) {
        var result = [];
        canReflect.each(object, function (val, key) {
            var value = new KeyObservable(object, key);
            var variableScope = {};
            if (variableName !== undefined) {
                variableScope[variableName] = value;
            }
            result.push(options.fn(options.scope.add({ key: key }, { special: true }).addLetContext(variableScope)));
        });
        return options.stringOnly ? result.join('') : result;
    }
    var forHelper = function (helperOptions) {
        if (helperOptions.exprData.argExprs.length !== 1) {
            throw new Error('for(of) broken syntax');
        }
        var helperExpr = helperOptions.exprData.argExprs[0].expr;
        var variableName, valueLookup, valueObservable;
        if (helperExpr instanceof expression.Lookup) {
            valueObservable = helperExpr.value(helperOptions.scope);
        } else if (helperExpr instanceof expression.Helper) {
            var inLookup = helperExpr.argExprs[0];
            if (inLookup.key !== 'of') {
                throw new Error('for(of) broken syntax');
            }
            variableName = helperExpr.methodExpr.key;
            valueLookup = helperExpr.argExprs[1];
            valueObservable = valueLookup.value(helperOptions.scope);
        }
        var items = valueObservable;
        var args = [].slice.call(arguments), options = args.pop(), resolved = bindAndRead(items);
        if (resolved && !canReflect.isListLike(resolved)) {
            return forOfObject(resolved, variableName, helperOptions);
        }
        if (options.stringOnly) {
            var parts = [];
            canReflect.eachIndex(resolved, function (value, index) {
                var variableScope = {};
                if (variableName !== undefined) {
                    variableScope[variableName] = value;
                }
                parts.push(helperOptions.fn(options.scope.add({ index: index }, { special: true }).addLetContext(variableScope)));
            });
            return parts.join('');
        } else {
            options.metadata.rendered = true;
            return function (el) {
                var nodeList = [el];
                nodeList.expression = 'live.list';
                nodeLists.register(nodeList, null, options.nodeList, true);
                nodeLists.update(options.nodeList, [el]);
                var cb = function (item, index, parentNodeList) {
                    var variableScope = {};
                    if (variableName !== undefined) {
                        variableScope[variableName] = item;
                    }
                    return options.fn(options.scope.add({ index: index }, { special: true }).addLetContext(variableScope), options.options, parentNodeList);
                };
                live.list(el, items, cb, options.context, el.parentNode, nodeList, function (list, parentNodeList) {
                    return options.inverse(options.scope, options.options, parentNodeList);
                });
            };
        }
    };
    forHelper.isLiveBound = true;
    forHelper.requiresOptionsArgument = true;
    forHelper.ignoreArgLookup = function ignoreArgLookup(index) {
        return index === 0;
    };
    module.exports = forHelper;
});
/*can-stache@4.17.5#helpers/-let*/
define('can-stache@4.17.5#helpers/-let', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    function isVariable(scope) {
        return scope._meta.variable === true;
    }
    var letHelper = function (options) {
        if (options.isSection) {
            return options.fn(options.scope.addLetContext(options.hash));
        }
        var variableScope = options.scope.getScope(isVariable);
        if (!variableScope) {
            throw new Error('There is no variable scope!');
        }
        canReflect.assignMap(variableScope._context, options.hash);
        return document.createTextNode('');
    };
    module.exports = letHelper;
});
/*can-stache@4.17.5#helpers/-portal*/
define('can-stache@4.17.5#helpers/-portal', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-view-live',
    'can-view-nodelist',
    'can-observation',
    'can-globals/document/document',
    'can-dom-mutate',
    'can-dom-mutate/node',
    'can-symbol'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        var canReflect = require('can-reflect');
        var live = require('can-view-live');
        var nodeLists = require('can-view-nodelist');
        var Observation = require('can-observation');
        var getDocument = require('can-globals/document/document');
        var domMutate = require('can-dom-mutate');
        var domMutateNode = require('can-dom-mutate/node');
        var canSymbol = require('can-symbol');
        var keepNodeSymbol = canSymbol.for('done.keepNode');
        function portalHelper(elementObservable, options) {
            function evaluator() {
                var frag = options.fn(options.scope.addLetContext({}), options.options);
                var child = frag.firstChild;
                while (child) {
                    child[keepNodeSymbol] = true;
                    child = child.nextSibling;
                }
                return frag;
            }
            var el, nodeList;
            function teardown() {
                if (el) {
                    canReflect.offValue(elementObservable, getElementAndRender);
                    el = null;
                }
                if (nodeList) {
                    nodeLists.remove(nodeList);
                    nodeList = null;
                }
            }
            function getElementAndRender() {
                teardown();
                el = canReflect.getValue(elementObservable);
                if (el) {
                    var node = getDocument().createTextNode('');
                    domMutateNode.appendChild.call(el, node);
                    nodeList = [node];
                    nodeList.expression = 'live.html';
                    nodeLists.register(nodeList, null, null, true);
                    var observable = new Observation(evaluator, null, { isObservable: false });
                    live.html(node, observable, el, nodeList);
                    domMutate.onNodeRemoval(el, teardown);
                } else {
                    options.metadata.rendered = true;
                }
                canReflect.onValue(elementObservable, getElementAndRender);
            }
            getElementAndRender();
            return function (el) {
                var doc = getDocument();
                var comment = doc.createComment('portal(' + canReflect.getName(elementObservable) + ')');
                var frag = doc.createDocumentFragment();
                domMutateNode.appendChild.call(frag, comment);
                nodeLists.replace([el], frag);
                var nodeList = [comment];
                nodeList.expression = 'portal';
                nodeLists.register(nodeList, teardown, options.nodeList, true);
                nodeLists.update(options.nodeList, [comment]);
            };
        }
        portalHelper.isLiveBound = true;
        portalHelper.requiresOptionsArgument = true;
        module.exports = portalHelper;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-stache@4.17.5#helpers/core*/
define('can-stache@4.17.5#helpers/core', [
    'require',
    'exports',
    'module',
    'can-view-live',
    'can-view-nodelist',
    '../src/utils',
    'can-globals/base-url/base-url',
    'can-join-uris',
    'can-assign',
    'can-log/dev/dev',
    'can-reflect',
    './-debugger',
    '../src/key-observable',
    'can-observation',
    '../src/truthy-observable',
    'can-stache-helpers',
    './converter',
    'can-dom-data',
    'can-dom-data-state',
    './-for-of',
    './-let',
    './-portal'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var live = require('can-view-live');
        var nodeLists = require('can-view-nodelist');
        var utils = require('../src/utils');
        var getBaseURL = require('can-globals/base-url/base-url');
        var joinURIs = require('can-join-uris');
        var assign = require('can-assign');
        var dev = require('can-log/dev/dev');
        var canReflect = require('can-reflect');
        var debuggerHelper = require('./-debugger').helper;
        var KeyObservable = require('../src/key-observable');
        var Observation = require('can-observation');
        var TruthyObservable = require('../src/truthy-observable');
        var helpers = require('can-stache-helpers');
        var makeConverter = require('./converter');
        var domData = require('can-dom-data');
        var domDataState = require('can-dom-data-state');
        var forHelper = require('./-for-of');
        var letHelper = require('./-let');
        var portalHelper = require('./-portal');
        var builtInHelpers = {};
        var builtInConverters = {};
        var converterPackages = new WeakMap();
        var helpersCore = {
            looksLikeOptions: function (options) {
                return options && typeof options.fn === 'function' && typeof options.inverse === 'function';
            },
            resolve: function (value) {
                if (value && canReflect.isValueLike(value)) {
                    return canReflect.getValue(value);
                } else {
                    return value;
                }
            },
            resolveHash: function (hash) {
                var params = {};
                for (var prop in hash) {
                    params[prop] = helpersCore.resolve(hash[prop]);
                }
                return params;
            },
            bindAndRead: function (value) {
                if (value && canReflect.isValueLike(value)) {
                    Observation.temporarilyBind(value);
                    return canReflect.getValue(value);
                } else {
                    return value;
                }
            },
            registerHelper: function (name, callback) {
                callback.requiresOptionsArgument = true;
                helpers[name] = callback;
            },
            registerHelpers: function (helpers) {
                var name, callback;
                for (name in helpers) {
                    callback = helpers[name];
                    helpersCore.registerHelper(name, helpersCore.makeSimpleHelper(callback));
                }
            },
            registerConverter: function (name, getterSetter) {
                helpersCore.registerHelper(name, makeConverter(getterSetter));
            },
            makeSimpleHelper: function (fn) {
                return function () {
                    var realArgs = [];
                    canReflect.eachIndex(arguments, function (val) {
                        realArgs.push(helpersCore.resolve(val));
                    });
                    return fn.apply(this, realArgs);
                };
            },
            addHelper: function (name, callback) {
                if (typeof name === 'object') {
                    return helpersCore.registerHelpers(name);
                }
                return helpersCore.registerHelper(name, helpersCore.makeSimpleHelper(callback));
            },
            addConverter: function (name, getterSetter) {
                if (typeof name === 'object') {
                    if (!converterPackages.has(name)) {
                        converterPackages.set(name, true);
                        canReflect.eachKey(name, function (getterSetter, name) {
                            helpersCore.addConverter(name, getterSetter);
                        });
                    }
                    return;
                }
                var helper = makeConverter(getterSetter);
                helper.isLiveBound = true;
                helpersCore.registerHelper(name, helper);
            },
            addLiveHelper: function (name, callback) {
                callback.isLiveBound = true;
                return helpersCore.registerHelper(name, callback);
            },
            getHelper: function (name, scope) {
                var helper = scope && scope.getHelper(name);
                if (!helper) {
                    helper = helpers[name];
                }
                return helper;
            },
            __resetHelpers: function () {
                for (var helper in helpers) {
                    delete helpers[helper];
                }
                converterPackages.delete(builtInConverters);
                helpersCore.addBuiltInHelpers();
                helpersCore.addBuiltInConverters();
            },
            addBuiltInHelpers: function () {
                canReflect.each(builtInHelpers, function (helper, helperName) {
                    helpers[helperName] = helper;
                });
            },
            addBuiltInConverters: function () {
                helpersCore.addConverter(builtInConverters);
            },
            _makeLogicHelper: function (name, logic) {
                var logicHelper = assign(function () {
                    var args = Array.prototype.slice.call(arguments, 0), options;
                    if (helpersCore.looksLikeOptions(args[args.length - 1])) {
                        options = args.pop();
                    }
                    function callLogic() {
                        if (options) {
                            return logic(args) ? true : false;
                        } else {
                            return logic(args);
                        }
                    }
                    var callFn = new Observation(callLogic);
                    if (options) {
                        return callFn.get() ? options.fn() : options.inverse();
                    } else {
                        return callFn.get();
                    }
                }, {
                    requiresOptionsArgument: true,
                    isLiveBound: true
                });
                return logicHelper;
            }
        };
        var ifHelper = assign(function ifHelper(expr, options) {
            var value;
            if (expr && canReflect.isValueLike(expr)) {
                value = canReflect.getValue(new TruthyObservable(expr));
            } else {
                value = !!helpersCore.resolve(expr);
            }
            if (value) {
                return options.fn(options.scope || this);
            } else {
                return options.inverse(options.scope || this);
            }
        }, {
            requiresOptionsArgument: true,
            isLiveBound: true
        });
        var isHelper = helpersCore._makeLogicHelper('eq', function eqHelper(args) {
            var curValue, lastValue;
            for (var i = 0; i < args.length; i++) {
                curValue = helpersCore.resolve(args[i]);
                curValue = typeof curValue === 'function' ? curValue() : curValue;
                if (i > 0) {
                    if (curValue !== lastValue) {
                        return false;
                    }
                }
                lastValue = curValue;
            }
            return true;
        });
        var andHelper = helpersCore._makeLogicHelper('and', function andHelper(args) {
            if (args.length === 0) {
                return false;
            }
            var last;
            for (var i = 0, len = args.length; i < len; i++) {
                last = helpersCore.resolve(args[i]);
                if (!last) {
                    return last;
                }
            }
            return last;
        });
        var orHelper = helpersCore._makeLogicHelper('or', function orHelper(args) {
            if (args.length === 0) {
                return false;
            }
            var last;
            for (var i = 0, len = args.length; i < len; i++) {
                last = helpersCore.resolve(args[i]);
                if (last) {
                    return last;
                }
            }
            return last;
        });
        var switchHelper = function (expression, options) {
            helpersCore.resolve(expression);
            var found = false;
            var caseHelper = function (value, options) {
                if (!found && helpersCore.resolve(expression) === helpersCore.resolve(value)) {
                    found = true;
                    return options.fn(options.scope);
                }
            };
            caseHelper.requiresOptionsArgument = true;
            var defaultHelper = function (options) {
                if (!found) {
                    return options ? options.scope.peek('this') : true;
                }
            };
            defaultHelper.requiresOptionsArgument = true;
            canReflect.assignSymbols(defaultHelper, {
                'can.isValueLike': true,
                'can.isFunctionLike': false,
                'can.getValue': function () {
                    return this(options);
                }
            });
            var newScope = options.scope.add({
                case: caseHelper,
                default: defaultHelper
            }, { notContext: true });
            return options.fn(newScope, options);
        };
        switchHelper.requiresOptionsArgument = true;
        var domDataHelper = function (attr, value) {
            var data = (helpersCore.looksLikeOptions(value) ? value.context : value) || this;
            return function setDomData(el) {
                domData.set(el, attr, data);
            };
        };
        var joinBaseHelper = function (firstExpr) {
            var args = [].slice.call(arguments);
            var options = args.pop();
            var moduleReference = args.map(function (expr) {
                var value = helpersCore.resolve(expr);
                return typeof value === 'function' ? value() : value;
            }).join('');
            var templateModule = canReflect.getKeyValue(options.scope.templateContext.helpers, 'module');
            var parentAddress = templateModule ? templateModule.uri : undefined;
            var isRelative = moduleReference[0] === '.';
            if (isRelative && parentAddress) {
                return joinURIs(parentAddress, moduleReference);
            } else {
                var baseURL = typeof System !== 'undefined' && (System.renderingBaseURL || System.baseURL) || getBaseURL();
                if (moduleReference[0] !== '/' && baseURL[baseURL.length - 1] !== '/') {
                    baseURL += '/';
                }
                return joinURIs(baseURL, moduleReference);
            }
        };
        joinBaseHelper.requiresOptionsArgument = true;
        var eachHelper = function (items) {
            var args = [].slice.call(arguments), options = args.pop(), hashExprs = options.exprData.hashExprs, resolved = helpersCore.bindAndRead(items), hashOptions, aliases;
            if (canReflect.size(hashExprs) > 0) {
                hashOptions = {};
                canReflect.eachKey(hashExprs, function (exprs, key) {
                    hashOptions[exprs.key] = key;
                });
            }
            if ((canReflect.isObservableLike(resolved) && canReflect.isListLike(resolved) || canReflect.isListLike(resolved) && canReflect.isValueLike(items)) && !options.stringOnly) {
                options.metadata.rendered = true;
                return function (el) {
                    var nodeList = [el];
                    nodeList.expression = 'live.list';
                    nodeLists.register(nodeList, null, options.nodeList, true);
                    nodeLists.update(options.nodeList, [el]);
                    var cb = function (item, index, parentNodeList) {
                        var aliases = {};
                        if (canReflect.size(hashOptions) > 0) {
                            if (hashOptions.value) {
                                aliases[hashOptions.value] = item;
                            }
                            if (hashOptions.index) {
                                aliases[hashOptions.index] = index;
                            }
                        }
                        return options.fn(options.scope.add(aliases, { notContext: true }).add({ index: index }, { special: true }).add(item), options.options, parentNodeList);
                    };
                    live.list(el, items, cb, options.context, el.parentNode, nodeList, function (list, parentNodeList) {
                        return options.inverse(options.scope.add(list), options.options, parentNodeList);
                    });
                };
            }
            var expr = helpersCore.resolve(items), result;
            if (!!expr && canReflect.isListLike(expr)) {
                result = utils.getItemsFragContent(expr, options, options.scope);
                return options.stringOnly ? result.join('') : result;
            } else if (canReflect.isObservableLike(expr) && canReflect.isMapLike(expr) || expr instanceof Object) {
                result = [];
                canReflect.each(expr, function (val, key) {
                    var value = new KeyObservable(expr, key);
                    aliases = {};
                    if (canReflect.size(hashOptions) > 0) {
                        if (hashOptions.value) {
                            aliases[hashOptions.value] = value;
                        }
                        if (hashOptions.key) {
                            aliases[hashOptions.key] = key;
                        }
                    }
                    result.push(options.fn(options.scope.add(aliases, { notContext: true }).add({ key: key }, { special: true }).add(value)));
                });
                return options.stringOnly ? result.join('') : result;
            }
        };
        eachHelper.isLiveBound = true;
        eachHelper.requiresOptionsArgument = true;
        eachHelper.ignoreArgLookup = function ignoreArgLookup(index) {
            return index === 1;
        };
        var indexHelper = assign(function indexHelper(offset, options) {
            if (!options) {
                options = offset;
                offset = 0;
            }
            var index = options.scope.peek('scope.index');
            return '' + ((typeof index === 'function' ? index() : index) + offset);
        }, { requiresOptionsArgument: true });
        var withHelper = function (expr, options) {
            var ctx = expr;
            if (!options) {
                options = expr;
                expr = true;
                ctx = options.hash;
            } else {
                expr = helpersCore.resolve(expr);
                if (options.hash && canReflect.size(options.hash) > 0) {
                    ctx = options.scope.add(options.hash, { notContext: true }).add(ctx);
                }
            }
            return options.fn(ctx || {});
        };
        withHelper.requiresOptionsArgument = true;
        var dataHelper = function (attr, value) {
            var data = (helpersCore.looksLikeOptions(value) ? value.context : value) || this;
            return function setData(el) {
                domDataState.set.call(el, attr, data);
            };
        };
        var unlessHelper = function (expr, options) {
            return ifHelper.apply(this, [
                expr,
                assign(assign({}, options), {
                    fn: options.inverse,
                    inverse: options.fn
                })
            ]);
        };
        unlessHelper.requiresOptionsArgument = true;
        unlessHelper.isLiveBound = true;
        var notConverter = {
            get: function (obs, options) {
                if (helpersCore.looksLikeOptions(options)) {
                    return canReflect.getValue(obs) ? options.inverse() : options.fn();
                } else {
                    return !canReflect.getValue(obs);
                }
            },
            set: function (newVal, obs) {
                canReflect.setValue(obs, !newVal);
            }
        };
        assign(builtInHelpers, {
            'debugger': debuggerHelper,
            each: eachHelper,
            eachOf: eachHelper,
            index: indexHelper,
            'if': ifHelper,
            is: isHelper,
            eq: isHelper,
            unless: unlessHelper,
            'with': withHelper,
            console: console,
            data: dataHelper,
            domData: domDataHelper,
            'switch': switchHelper,
            joinBase: joinBaseHelper,
            and: andHelper,
            or: orHelper,
            'let': letHelper,
            'for': forHelper,
            portal: portalHelper
        });
        assign(builtInConverters, { 'not': notConverter });
        helpersCore.addBuiltInHelpers();
        helpersCore.addBuiltInConverters();
        module.exports = helpersCore;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-stache-ast@1.1.0#controls*/
define('can-stache-ast@1.1.0#controls', function (require, exports, module) {
    'use strict';
    var mustacheLineBreakRegExp = /(?:(^|\r?\n)(\s*)(\{\{([\s\S]*)\}\}\}?)([^\S\n\r]*)($|\r?\n))|(\{\{([\s\S]*)\}\}\}?)/g, mustacheWhitespaceRegExp = /(\s*)(\{\{\{?)(-?)([\s\S]*?)(-?)(\}\}\}?)(\s*)/g;
    function splitModeFromExpression(expression, state) {
        expression = expression.trim();
        var mode = expression.charAt(0);
        if ('#/{&^>!<'.indexOf(mode) >= 0) {
            expression = expression.substr(1).trim();
        } else {
            mode = null;
        }
        if (mode === '{' && state.node) {
            mode = null;
        }
        return {
            mode: mode,
            expression: expression
        };
    }
    function cleanLineEndings(template) {
        return template.replace(mustacheLineBreakRegExp, function (whole, returnBefore, spaceBefore, special, expression, spaceAfter, returnAfter, spaceLessSpecial, spaceLessExpression, matchIndex) {
            spaceAfter = spaceAfter || '';
            returnBefore = returnBefore || '';
            spaceBefore = spaceBefore || '';
            var modeAndExpression = splitModeFromExpression(expression || spaceLessExpression, {});
            if (spaceLessSpecial || '>{'.indexOf(modeAndExpression.mode) >= 0) {
                return whole;
            } else if ('^#!/'.indexOf(modeAndExpression.mode) >= 0) {
                spaceBefore = returnBefore + spaceBefore && ' ';
                return spaceBefore + special + (matchIndex !== 0 && returnAfter.length ? returnBefore + '\n' : '');
            } else {
                return spaceBefore + special + spaceAfter + (spaceBefore.length || matchIndex !== 0 ? returnBefore + '\n' : '');
            }
        });
    }
    function whiteSpaceReplacement(whole, spaceBefore, bracketBefore, controlBefore, expression, controlAfter, bracketAfter, spaceAfter) {
        if (controlBefore === '-') {
            spaceBefore = '';
        }
        if (controlAfter === '-') {
            spaceAfter = '';
        }
        return spaceBefore + bracketBefore + expression + bracketAfter + spaceAfter;
    }
    function cleanWhitespaceControl(template) {
        return template.replace(mustacheWhitespaceRegExp, whiteSpaceReplacement);
    }
    exports.cleanLineEndings = cleanLineEndings;
    exports.cleanWhitespaceControl = cleanWhitespaceControl;
});
/*can-stache-ast@1.1.0#can-stache-ast*/
define('can-stache-ast@1.1.0#can-stache-ast', [
    'require',
    'exports',
    'module',
    './controls',
    'can-view-parser'
], function (require, exports, module) {
    'use strict';
    var controls = require('./controls');
    var parser = require('can-view-parser');
    exports.parse = function (filename, source) {
        if (arguments.length === 1) {
            source = arguments[0];
            filename = undefined;
        }
        var template = source;
        template = controls.cleanWhitespaceControl(template);
        template = controls.cleanLineEndings(template);
        var imports = [], dynamicImports = [], importDeclarations = [], ases = {}, attributes = new Map(), inImport = false, inFrom = false, inAs = false, isUnary = false, importIsDynamic = false, currentAs = '', currentFrom = '', currentAttrName = null;
        function processImport(line) {
            if (currentAs) {
                ases[currentAs] = currentFrom;
                currentAs = '';
            }
            if (importIsDynamic) {
                dynamicImports.push(currentFrom);
            } else {
                imports.push(currentFrom);
            }
            importDeclarations.push({
                specifier: currentFrom,
                loc: { line: line },
                attributes: attributes
            });
            attributes = new Map();
        }
        var program = parser(template, {
            filename: filename,
            start: function (tagName, unary) {
                if (tagName === 'can-import') {
                    isUnary = unary;
                    importIsDynamic = false;
                    inImport = true;
                } else if (tagName === 'can-dynamic-import') {
                    isUnary = unary;
                    importIsDynamic = true;
                    inImport = true;
                } else if (inImport) {
                    importIsDynamic = true;
                    inImport = false;
                }
            },
            attrStart: function (attrName) {
                currentAttrName = attrName;
                attributes.set(currentAttrName, true);
                if (attrName === 'from') {
                    inFrom = true;
                } else if (attrName === 'as' || attrName === 'export-as') {
                    inAs = true;
                }
            },
            attrEnd: function (attrName) {
                if (attrName === 'from') {
                    inFrom = false;
                } else if (attrName === 'as' || attrName === 'export-as') {
                    inAs = false;
                }
            },
            attrValue: function (value) {
                if (inImport) {
                    attributes.set(currentAttrName, value);
                }
                if (inFrom && inImport) {
                    currentFrom = value;
                } else if (inAs && inImport) {
                    currentAs = value;
                }
            },
            end: function (tagName, unary, line) {
                if ((tagName === 'can-import' || tagName === 'can-dynamic-import') && isUnary) {
                    processImport(line);
                }
            },
            close: function (tagName, unary, line) {
                if (tagName === 'can-import' || tagName === 'can-dynamic-import') {
                    processImport(line);
                }
            },
            chars: function (text) {
                if (text.trim().length > 0) {
                    importIsDynamic = true;
                }
            },
            special: function () {
                importIsDynamic = true;
            }
        }, true);
        return {
            intermediate: program,
            program: program,
            imports: imports,
            dynamicImports: dynamicImports,
            importDeclarations: importDeclarations,
            ases: ases,
            exports: ases
        };
    };
});
/*can-import-module@1.2.0#can-import-module*/
define('can-import-module@1.2.0#can-import-module', [
    'require',
    'exports',
    'module',
    'can-globals/global/global',
    'can-namespace'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getGlobal = require('can-globals/global/global');
        var namespace = require('can-namespace');
        module.exports = namespace.import = function (moduleName, parentName) {
            return new Promise(function (resolve, reject) {
                try {
                    var global = getGlobal();
                    if (typeof global.System === 'object' && isFunction(global.System['import'])) {
                        global.System['import'](moduleName, { name: parentName }).then(resolve, reject);
                    } else if (global.define && global.define.amd) {
                        global.require([moduleName], function (value) {
                            resolve(value);
                        });
                    } else if (global.require) {
                        resolve(global.require(moduleName));
                    } else {
                        if (typeof stealRequire !== 'undefined') {
                            steal.import(moduleName, { name: parentName }).then(resolve, reject);
                        } else {
                            resolve();
                        }
                    }
                } catch (err) {
                    reject(err);
                }
            });
        };
        function isFunction(fn) {
            return typeof fn === 'function';
        }
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-stache@4.17.5#can-stache*/
define('can-stache@4.17.5#can-stache', [
    'require',
    'exports',
    'module',
    'can-view-parser',
    'can-view-callbacks',
    './src/html_section',
    './src/text_section',
    './src/mustache_core',
    './helpers/core',
    'can-stache-ast',
    './src/utils',
    'can-attribute-encoder',
    'can-log/dev/dev',
    'can-namespace',
    'can-globals/document/document',
    'can-assign',
    'can-import-module',
    'can-reflect',
    'can-view-scope',
    'can-view-scope/template-context',
    'can-observation-recorder',
    'can-symbol',
    'can-view-target',
    'can-view-nodelist'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var parser = require('can-view-parser');
        var viewCallbacks = require('can-view-callbacks');
        var HTMLSectionBuilder = require('./src/html_section');
        var TextSectionBuilder = require('./src/text_section');
        var mustacheCore = require('./src/mustache_core');
        var mustacheHelpers = require('./helpers/core');
        var getIntermediateAndImports = require('can-stache-ast').parse;
        var utils = require('./src/utils');
        var makeRendererConvertScopes = utils.makeRendererConvertScopes;
        var last = utils.last;
        var attributeEncoder = require('can-attribute-encoder');
        var dev = require('can-log/dev/dev');
        var namespace = require('can-namespace');
        var DOCUMENT = require('can-globals/document/document');
        var assign = require('can-assign');
        var importer = require('can-import-module');
        var canReflect = require('can-reflect');
        var Scope = require('can-view-scope');
        var TemplateContext = require('can-view-scope/template-context');
        var ObservationRecorder = require('can-observation-recorder');
        var canSymbol = require('can-symbol');
        require('can-view-target');
        require('can-view-nodelist');
        if (!viewCallbacks.tag('content')) {
            viewCallbacks.tag('content', function (el, tagData) {
                return tagData.scope;
            });
        }
        var isViewSymbol = canSymbol.for('can.isView');
        var wrappedAttrPattern = /[{(].*[)}]/;
        var colonWrappedAttrPattern = /^on:|(:to|:from|:bind)$|.*:to:on:.*/;
        var svgNamespace = 'http://www.w3.org/2000/svg', xmlnsAttrNamespaceURI = 'http://www.w3.org/2000/xmlns/', xlinkHrefAttrNamespaceURI = 'http://www.w3.org/1999/xlink';
        var namespaces = {
                'svg': svgNamespace,
                'g': svgNamespace,
                'defs': svgNamespace,
                'path': svgNamespace,
                'filter': svgNamespace,
                'feMorphology': svgNamespace,
                'feGaussianBlur': svgNamespace,
                'feOffset': svgNamespace,
                'feComposite': svgNamespace,
                'feColorMatrix': svgNamespace,
                'use': svgNamespace
            }, attrsNamespacesURI = {
                'xmlns': xmlnsAttrNamespaceURI,
                'xlink:href': xlinkHrefAttrNamespaceURI
            }, textContentOnlyTag = {
                style: true,
                script: true
            };
        function stache(filename, template) {
            if (arguments.length === 1) {
                template = arguments[0];
                filename = undefined;
            }
            var inlinePartials = {};
            if (typeof template === 'string') {
                template = mustacheCore.cleanWhitespaceControl(template);
                template = mustacheCore.cleanLineEndings(template);
            }
            var section = new HTMLSectionBuilder(filename), state = {
                    node: null,
                    attr: null,
                    sectionElementStack: [],
                    text: false,
                    namespaceStack: [],
                    textContentOnly: null
                }, makeRendererAndUpdateSection = function (section, mode, stache, lineNo) {
                    if (mode === '>') {
                        section.add(mustacheCore.makeLiveBindingPartialRenderer(stache, copyState({
                            filename: section.filename,
                            lineNo: lineNo
                        })));
                    } else if (mode === '/') {
                        var createdSection = section.last();
                        if (createdSection.startedWith === '<') {
                            inlinePartials[stache] = section.endSubSectionAndReturnRenderer();
                            section.removeCurrentNode();
                        } else {
                            section.endSection();
                        }
                        if (section instanceof HTMLSectionBuilder) {
                            state.sectionElementStack.pop();
                        }
                    } else if (mode === 'else') {
                        section.inverse();
                    } else {
                        var makeRenderer = section instanceof HTMLSectionBuilder ? mustacheCore.makeLiveBindingBranchRenderer : mustacheCore.makeStringBranchRenderer;
                        if (mode === '{' || mode === '&') {
                            section.add(makeRenderer(null, stache, copyState({
                                filename: section.filename,
                                lineNo: lineNo
                            })));
                        } else if (mode === '#' || mode === '^' || mode === '<') {
                            var renderer = makeRenderer(mode, stache, copyState({
                                filename: section.filename,
                                lineNo: lineNo
                            }));
                            var sectionItem = { type: 'section' };
                            section.startSection(renderer);
                            section.last().startedWith = mode;
                            if (section instanceof HTMLSectionBuilder) {
                                state.sectionElementStack.push(sectionItem);
                            }
                        } else {
                            section.add(makeRenderer(null, stache, copyState({
                                text: true,
                                filename: section.filename,
                                lineNo: lineNo
                            })));
                        }
                    }
                }, isDirectlyNested = function () {
                    var lastElement = state.sectionElementStack[state.sectionElementStack.length - 1];
                    return state.sectionElementStack.length ? lastElement.type === 'section' || lastElement.type === 'custom' : true;
                }, copyState = function (overwrites) {
                    var cur = {
                        tag: state.node && state.node.tag,
                        attr: state.attr && state.attr.name,
                        directlyNested: isDirectlyNested(),
                        textContentOnly: !!state.textContentOnly
                    };
                    return overwrites ? assign(cur, overwrites) : cur;
                }, addAttributesCallback = function (node, callback) {
                    if (!node.attributes) {
                        node.attributes = [];
                    }
                    node.attributes.unshift(callback);
                };
            parser(template, {
                filename: filename,
                start: function (tagName, unary, lineNo) {
                    var matchedNamespace = namespaces[tagName];
                    if (matchedNamespace && !unary) {
                        state.namespaceStack.push(matchedNamespace);
                    }
                    state.node = {
                        tag: tagName,
                        children: [],
                        namespace: matchedNamespace || last(state.namespaceStack)
                    };
                },
                end: function (tagName, unary, lineNo) {
                    var isCustomTag = viewCallbacks.tag(tagName);
                    var directlyNested = isDirectlyNested();
                    if (unary) {
                        section.add(state.node);
                        if (isCustomTag) {
                            addAttributesCallback(state.node, function (scope, parentNodeList) {
                                viewCallbacks.tagHandler(this, tagName, {
                                    scope: scope,
                                    subtemplate: null,
                                    templateType: 'stache',
                                    parentNodeList: parentNodeList,
                                    directlyNested: directlyNested
                                });
                            });
                        }
                    } else {
                        section.push(state.node);
                        state.sectionElementStack.push({
                            type: isCustomTag ? 'custom' : null,
                            tag: isCustomTag ? null : tagName,
                            templates: {},
                            directlyNested: directlyNested
                        });
                        if (isCustomTag) {
                            section.startSubSection();
                        } else if (textContentOnlyTag[tagName]) {
                            state.textContentOnly = new TextSectionBuilder(filename);
                        }
                    }
                    state.node = null;
                },
                close: function (tagName, lineNo) {
                    var matchedNamespace = namespaces[tagName];
                    if (matchedNamespace) {
                        state.namespaceStack.pop();
                    }
                    var isCustomTag = viewCallbacks.tag(tagName), renderer;
                    if (isCustomTag) {
                        renderer = section.endSubSectionAndReturnRenderer();
                    }
                    if (textContentOnlyTag[tagName]) {
                        section.last().add(state.textContentOnly.compile(copyState()));
                        state.textContentOnly = null;
                    }
                    var oldNode = section.pop();
                    if (isCustomTag) {
                        if (tagName === 'can-template') {
                            var parent = state.sectionElementStack[state.sectionElementStack.length - 2];
                            if (renderer) {
                                parent.templates[oldNode.attrs.name] = makeRendererConvertScopes(renderer);
                            }
                            section.removeCurrentNode();
                        } else {
                            var current = state.sectionElementStack[state.sectionElementStack.length - 1];
                            addAttributesCallback(oldNode, function (scope, parentNodeList) {
                                viewCallbacks.tagHandler(this, tagName, {
                                    scope: scope,
                                    subtemplate: renderer ? makeRendererConvertScopes(renderer) : renderer,
                                    templateType: 'stache',
                                    parentNodeList: parentNodeList,
                                    templates: current.templates,
                                    directlyNested: current.directlyNested
                                });
                            });
                        }
                    }
                    state.sectionElementStack.pop();
                },
                attrStart: function (attrName, lineNo) {
                    if (state.node.section) {
                        state.node.section.add(attrName + '="');
                    } else {
                        state.attr = {
                            name: attrName,
                            value: ''
                        };
                    }
                },
                attrEnd: function (attrName, lineNo) {
                    var matchedAttrNamespacesURI = attrsNamespacesURI[attrName];
                    if (state.node.section) {
                        state.node.section.add('" ');
                    } else {
                        if (!state.node.attrs) {
                            state.node.attrs = {};
                        }
                        if (state.attr.section) {
                            state.node.attrs[state.attr.name] = state.attr.section.compile(copyState());
                        } else if (matchedAttrNamespacesURI) {
                            state.node.attrs[state.attr.name] = {
                                value: state.attr.value,
                                namespaceURI: attrsNamespacesURI[attrName]
                            };
                        } else {
                            state.node.attrs[state.attr.name] = state.attr.value;
                        }
                        var attrCallback = viewCallbacks.attr(attrName);
                        if (attrCallback) {
                            if (!state.node.attributes) {
                                state.node.attributes = [];
                            }
                            state.node.attributes.push(function (scope, nodeList) {
                                attrCallback(this, {
                                    attributeName: attrName,
                                    scope: scope,
                                    nodeList: nodeList
                                });
                            });
                        }
                        state.attr = null;
                    }
                },
                attrValue: function (value, lineNo) {
                    var section = state.node.section || state.attr.section;
                    if (section) {
                        section.add(value);
                    } else {
                        state.attr.value += value;
                    }
                },
                chars: function (text, lineNo) {
                    (state.textContentOnly || section).add(text);
                },
                special: function (text, lineNo) {
                    var firstAndText = mustacheCore.splitModeFromExpression(text, state), mode = firstAndText.mode, expression = firstAndText.expression;
                    if (expression === 'else') {
                        var inverseSection;
                        if (state.attr && state.attr.section) {
                            inverseSection = state.attr.section;
                        } else if (state.node && state.node.section) {
                            inverseSection = state.node.section;
                        } else {
                            inverseSection = state.textContentOnly || section;
                        }
                        inverseSection.inverse();
                        return;
                    }
                    if (mode === '!') {
                        return;
                    }
                    if (state.node && state.node.section) {
                        makeRendererAndUpdateSection(state.node.section, mode, expression, lineNo);
                        if (state.node.section.subSectionDepth() === 0) {
                            state.node.attributes.push(state.node.section.compile(copyState()));
                            delete state.node.section;
                        }
                    } else if (state.attr) {
                        if (!state.attr.section) {
                            state.attr.section = new TextSectionBuilder(filename);
                            if (state.attr.value) {
                                state.attr.section.add(state.attr.value);
                            }
                        }
                        makeRendererAndUpdateSection(state.attr.section, mode, expression, lineNo);
                    } else if (state.node) {
                        if (!state.node.attributes) {
                            state.node.attributes = [];
                        }
                        if (!mode) {
                            state.node.attributes.push(mustacheCore.makeLiveBindingBranchRenderer(null, expression, copyState({
                                filename: section.filename,
                                lineNo: lineNo
                            })));
                        } else if (mode === '#' || mode === '^') {
                            if (!state.node.section) {
                                state.node.section = new TextSectionBuilder(filename);
                            }
                            makeRendererAndUpdateSection(state.node.section, mode, expression, lineNo);
                        } else {
                            throw new Error(mode + ' is currently not supported within a tag.');
                        }
                    } else {
                        makeRendererAndUpdateSection(state.textContentOnly || section, mode, expression, lineNo);
                    }
                },
                comment: function (text) {
                    section.add({ comment: text });
                },
                done: function (lineNo) {
                }
            });
            var renderer = section.compile();
            var scopifiedRenderer = ObservationRecorder.ignore(function (scope, options, nodeList) {
                if (nodeList === undefined && canReflect.isListLike(options)) {
                    nodeList = options;
                    options = undefined;
                }
                if (options && !options.helpers && !options.partials && !options.tags) {
                    options = { helpers: options };
                }
                canReflect.eachKey(options && options.helpers, function (helperValue) {
                    helperValue.requiresOptionsArgument = true;
                });
                var templateContext = new TemplateContext(options);
                canReflect.eachKey(inlinePartials, function (partial, partialName) {
                    canReflect.setKeyValue(templateContext.partials, partialName, partial);
                });
                canReflect.setKeyValue(templateContext, 'view', scopifiedRenderer);
                if (!(scope instanceof Scope)) {
                    scope = new Scope(templateContext).add(scope);
                } else {
                    var templateContextScope = new Scope(templateContext);
                    templateContextScope._parent = scope._parent;
                    scope._parent = templateContextScope;
                }
                return renderer(scope.addLetContext(), nodeList);
            });
            scopifiedRenderer[isViewSymbol] = true;
            return scopifiedRenderer;
        }
        assign(stache, mustacheHelpers);
        stache.safeString = function (text) {
            return canReflect.assignSymbols({}, {
                'can.toDOM': function () {
                    return text;
                }
            });
        };
        stache.async = function (source) {
            var iAi = getIntermediateAndImports(source);
            var importPromises = iAi.imports.map(function (moduleName) {
                return importer(moduleName);
            });
            return Promise.all(importPromises).then(function () {
                return stache(iAi.intermediate);
            });
        };
        var templates = {};
        stache.from = mustacheCore.getTemplateById = function (id) {
            if (!templates[id]) {
                var el = DOCUMENT().getElementById(id);
                if (el) {
                    templates[id] = stache('#' + id, el.innerHTML);
                }
            }
            return templates[id];
        };
        stache.registerPartial = function (id, partial) {
            templates[id] = typeof partial === 'string' ? stache(partial) : partial;
        };
        stache.addBindings = viewCallbacks.attrs;
        module.exports = namespace.stache = stache;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-view-model@4.0.1#can-view-model*/
define('can-view-model@4.0.1#can-view-model', [
    'require',
    'exports',
    'module',
    'can-simple-map',
    'can-namespace',
    'can-globals/document/document',
    'can-reflect',
    'can-symbol'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var SimpleMap = require('can-simple-map');
        var ns = require('can-namespace');
        var getDocument = require('can-globals/document/document');
        var canReflect = require('can-reflect');
        var canSymbol = require('can-symbol');
        var viewModelSymbol = canSymbol.for('can.viewModel');
        module.exports = ns.viewModel = function (el, attr, val) {
            if (typeof el === 'string') {
                el = getDocument().querySelector(el);
            } else if (canReflect.isListLike(el) && !el.nodeType) {
                el = el[0];
            }
            if (canReflect.isObservableLike(attr) && canReflect.isMapLike(attr)) {
                el[viewModelSymbol] = attr;
                return;
            }
            var scope = el[viewModelSymbol];
            if (!scope) {
                scope = new SimpleMap();
                el[viewModelSymbol] = scope;
            }
            switch (arguments.length) {
            case 0:
            case 1:
                return scope;
            case 2:
                return canReflect.getKeyValue(scope, attr);
            default:
                canReflect.setKeyValue(scope, attr, val);
                return el;
            }
        };
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-attribute-observable@1.2.1#event*/
define('can-attribute-observable@1.2.1#event', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-dom-events',
    'can-dom-events/helpers/util'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var domEvents = require('can-dom-events');
    var isDomEventTarget = require('can-dom-events/helpers/util').isDomEventTarget;
    var canEvent = {
        on: function on(eventName, handler, queue) {
            if (isDomEventTarget(this)) {
                domEvents.addEventListener(this, eventName, handler, queue);
            } else {
                canReflect.onKeyValue(this, eventName, handler, queue);
            }
        },
        off: function off(eventName, handler, queue) {
            if (isDomEventTarget(this)) {
                domEvents.removeEventListener(this, eventName, handler, queue);
            } else {
                canReflect.offKeyValue(this, eventName, handler, queue);
            }
        },
        one: function one(event, handler, queue) {
            var one = function () {
                canEvent.off.call(this, event, one, queue);
                return handler.apply(this, arguments);
            };
            canEvent.on.call(this, event, one, queue);
            return this;
        }
    };
    module.exports = canEvent;
});
/*can-attribute-observable@1.2.1#get-event-name*/
define('can-attribute-observable@1.2.1#get-event-name', [
    'require',
    'exports',
    'module',
    './behaviors'
], function (require, exports, module) {
    'use strict';
    var attr = require('./behaviors');
    var isRadioInput = function isRadioInput(el) {
        return el.nodeName.toLowerCase() === 'input' && el.type === 'radio';
    };
    module.exports = function getEventName(el, prop) {
        var event = 'change';
        if (isRadioInput(el) && prop === 'checked') {
            event = 'can-attribute-observable-radiochange';
        }
        if (attr.findSpecialListener(prop)) {
            event = prop;
        }
        return event;
    };
});
/*can-event-dom-radiochange@2.2.0#can-event-dom-radiochange*/
define('can-event-dom-radiochange@2.2.0#can-event-dom-radiochange', [
    'require',
    'exports',
    'module',
    'can-globals/document/document',
    'can-namespace'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getDocument = require('can-globals/document/document');
        var namespace = require('can-namespace');
        function getRoot() {
            return getDocument().documentElement;
        }
        function findParentForm(el) {
            while (el) {
                if (el.nodeName === 'FORM') {
                    break;
                }
                el = el.parentNode;
            }
            return el;
        }
        function shouldReceiveEventFromRadio(source, dest) {
            var name = source.getAttribute('name');
            return name && name === dest.getAttribute('name') && findParentForm(source) === findParentForm(dest);
        }
        function isRadioInput(el) {
            return el.nodeName === 'INPUT' && el.type === 'radio';
        }
        function attachRootListener(domEvents, eventTypeTargets) {
            var root = getRoot();
            var newListener = function (event) {
                var target = event.target;
                if (!isRadioInput(target)) {
                    return;
                }
                for (var eventType in eventTypeTargets) {
                    var newEvent = { type: eventType };
                    var listeningNodes = eventTypeTargets[eventType];
                    listeningNodes.forEach(function (el) {
                        if (shouldReceiveEventFromRadio(target, el)) {
                            domEvents.dispatch(el, newEvent, false);
                        }
                    });
                }
            };
            domEvents.addEventListener(root, 'change', newListener);
            return newListener;
        }
        function detachRootListener(domEvents, listener) {
            var root = getRoot();
            domEvents.removeEventListener(root, 'change', listener);
        }
        var radioChangeEvent = {
            defaultEventType: 'radiochange',
            addEventListener: function (target, eventType, handler) {
                if (!isRadioInput(target)) {
                    throw new Error('Listeners for ' + eventType + ' must be radio inputs');
                }
                var eventTypeTrackedRadios = radioChangeEvent._eventTypeTrackedRadios;
                if (!eventTypeTrackedRadios) {
                    eventTypeTrackedRadios = radioChangeEvent._eventTypeTrackedRadios = {};
                    if (!radioChangeEvent._rootListener) {
                        radioChangeEvent._rootListener = attachRootListener(this, eventTypeTrackedRadios);
                    }
                }
                var trackedRadios = radioChangeEvent._eventTypeTrackedRadios[eventType];
                if (!trackedRadios) {
                    trackedRadios = radioChangeEvent._eventTypeTrackedRadios[eventType] = new Set();
                }
                trackedRadios.add(target);
                target.addEventListener(eventType, handler);
            },
            removeEventListener: function (target, eventType, handler) {
                target.removeEventListener(eventType, handler);
                var eventTypeTrackedRadios = radioChangeEvent._eventTypeTrackedRadios;
                if (!eventTypeTrackedRadios) {
                    return;
                }
                var trackedRadios = eventTypeTrackedRadios[eventType];
                if (!trackedRadios) {
                    return;
                }
                trackedRadios.delete(target);
                if (trackedRadios.size === 0) {
                    delete eventTypeTrackedRadios[eventType];
                    for (var key in eventTypeTrackedRadios) {
                        if (eventTypeTrackedRadios.hasOwnProperty(key)) {
                            return;
                        }
                    }
                    delete radioChangeEvent._eventTypeTrackedRadios;
                    detachRootListener(this, radioChangeEvent._rootListener);
                    delete radioChangeEvent._rootListener;
                }
            }
        };
        module.exports = namespace.domEventRadioChange = radioChangeEvent;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-attribute-observable@1.2.1#can-attribute-observable*/
define('can-attribute-observable@1.2.1#can-attribute-observable', [
    'require',
    'exports',
    'module',
    'can-queues',
    './event',
    'can-reflect',
    'can-observation',
    './behaviors',
    './get-event-name',
    'can-reflect-dependencies',
    'can-observation-recorder',
    'can-simple-observable/settable/settable',
    'can-assign',
    'can-symbol',
    'can-dom-events',
    'can-event-dom-radiochange'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var queues = require('can-queues');
        var canEvent = require('./event');
        var canReflect = require('can-reflect');
        var Observation = require('can-observation');
        var attr = require('./behaviors');
        var getEventName = require('./get-event-name');
        var canReflectDeps = require('can-reflect-dependencies');
        var ObservationRecorder = require('can-observation-recorder');
        var SettableObservable = require('can-simple-observable/settable/settable');
        var canAssign = require('can-assign');
        var canSymbol = require('can-symbol');
        var onValueSymbol = canSymbol.for('can.onValue');
        var offValueSymbol = canSymbol.for('can.offValue');
        var onEmitSymbol = canSymbol.for('can.onEmit');
        var offEmitSymbol = canSymbol.for('can.offEmit');
        var domEvents = require('can-dom-events');
        var radioChangeEvent = require('can-event-dom-radiochange');
        var internalRadioChangeEventType = 'can-attribute-observable-radiochange';
        domEvents.addEvent(radioChangeEvent, internalRadioChangeEventType);
        var isSelect = function isSelect(el) {
            return el.nodeName.toLowerCase() === 'select';
        };
        var isMultipleSelect = function isMultipleSelect(el, prop) {
            return isSelect(el) && prop === 'value' && el.multiple;
        };
        var slice = Array.prototype.slice;
        function canUtilAEL() {
            var args = slice.call(arguments, 0);
            args.unshift(this);
            return domEvents.addEventListener.apply(null, args);
        }
        function canUtilREL() {
            var args = slice.call(arguments, 0);
            args.unshift(this);
            return domEvents.removeEventListener.apply(null, args);
        }
        function AttributeObservable(el, prop, bindingData, event) {
            if (typeof bindingData === 'string') {
                event = bindingData;
                bindingData = undefined;
            }
            this.el = el;
            this.bound = false;
            this.prop = isMultipleSelect(el, prop) ? 'values' : prop;
            this.event = event || getEventName(el, prop);
            this.handler = this.handler.bind(this);
            if (event !== undefined) {
                this[onValueSymbol] = null;
                this[offValueSymbol] = null;
                this[onEmitSymbol] = AttributeObservable.prototype.on;
                this[offEmitSymbol] = AttributeObservable.prototype.off;
            }
        }
        AttributeObservable.prototype = Object.create(SettableObservable.prototype);
        canAssign(AttributeObservable.prototype, {
            constructor: AttributeObservable,
            get: function get() {
                if (ObservationRecorder.isRecording()) {
                    ObservationRecorder.add(this);
                    if (!this.bound) {
                        Observation.temporarilyBind(this);
                    }
                }
                var value = attr.get(this.el, this.prop);
                if (typeof value === 'function') {
                    value = value.bind(this.el);
                }
                return value;
            },
            set: function set(newVal) {
                var setterDispatchedEvents = attr.setAttrOrProp(this.el, this.prop, newVal);
                if (!setterDispatchedEvents) {
                    this._value = newVal;
                }
                return newVal;
            },
            handler: function handler(newVal, event) {
                var old = this._value;
                var queuesArgs = [];
                this._value = attr.get(this.el, this.prop);
                if (event !== undefined || this._value !== old) {
                    queuesArgs = [
                        this.handlers.getNode([]),
                        this,
                        [
                            newVal,
                            old
                        ]
                    ];
                    queues.enqueueByQueue.apply(queues, queuesArgs);
                }
            },
            onBound: function onBound() {
                var observable = this;
                observable.bound = true;
                observable._handler = function (event) {
                    observable.handler(attr.get(observable.el, observable.prop), event);
                };
                if (observable.event === internalRadioChangeEventType) {
                    canEvent.on.call(observable.el, 'change', observable._handler);
                }
                var specialBinding = attr.findSpecialListener(observable.prop);
                if (specialBinding) {
                    observable._specialDisposal = specialBinding.call(observable.el, observable.prop, observable._handler, canUtilAEL);
                }
                canEvent.on.call(observable.el, observable.event, observable._handler);
                this._value = attr.get(this.el, this.prop);
            },
            onUnbound: function onUnbound() {
                var observable = this;
                observable.bound = false;
                if (observable.event === internalRadioChangeEventType) {
                    canEvent.off.call(observable.el, 'change', observable._handler);
                }
                if (observable._specialDisposal) {
                    observable._specialDisposal.call(observable.el, canUtilREL);
                    observable._specialDisposal = null;
                }
                canEvent.off.call(observable.el, observable.event, observable._handler);
            },
            valueHasDependencies: function valueHasDependencies() {
                return true;
            },
            getValueDependencies: function getValueDependencies() {
                var m = new Map();
                var s = new Set();
                s.add(this.prop);
                m.set(this.el, s);
                return { keyDependencies: m };
            }
        });
        canReflect.assignSymbols(AttributeObservable.prototype, {
            'can.isMapLike': false,
            'can.getValue': AttributeObservable.prototype.get,
            'can.setValue': AttributeObservable.prototype.set,
            'can.onValue': AttributeObservable.prototype.on,
            'can.offValue': AttributeObservable.prototype.off,
            'can.valueHasDependencies': AttributeObservable.prototype.hasDependencies,
            'can.getValueDependencies': AttributeObservable.prototype.getValueDependencies
        });
        module.exports = AttributeObservable;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-stache-bindings@4.8.0#can-stache-bindings*/
define('can-stache-bindings@4.8.0#can-stache-bindings', [
    'require',
    'exports',
    'module',
    'can-bind',
    'can-stache/src/expression',
    'can-view-callbacks',
    'can-view-model',
    'can-stache-key',
    'can-observation-recorder',
    'can-simple-observable',
    'can-assign',
    'can-log/dev/dev',
    'can-dom-mutate',
    'can-dom-data-state',
    'can-symbol',
    'can-reflect',
    'can-reflect-dependencies',
    'can-attribute-encoder',
    'can-queues',
    'can-simple-observable/setter/setter',
    'can-attribute-observable',
    'can-view-scope/make-compute-like',
    'can-view-nodelist',
    'can-event-queue/map/map'
], function (require, exports, module) {
    'use strict';
    var Bind = require('can-bind');
    var expression = require('can-stache/src/expression');
    var viewCallbacks = require('can-view-callbacks');
    var canViewModel = require('can-view-model');
    var observeReader = require('can-stache-key');
    var ObservationRecorder = require('can-observation-recorder');
    var SimpleObservable = require('can-simple-observable');
    var assign = require('can-assign');
    var dev = require('can-log/dev/dev');
    var domMutate = require('can-dom-mutate');
    var domData = require('can-dom-data-state');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var canReflectDeps = require('can-reflect-dependencies');
    var encoder = require('can-attribute-encoder');
    var queues = require('can-queues');
    var SettableObservable = require('can-simple-observable/setter/setter');
    var AttributeObservable = require('can-attribute-observable');
    var makeCompute = require('can-view-scope/make-compute-like');
    var ViewNodeList = require('can-view-nodelist');
    var canEventQueue = require('can-event-queue/map/map');
    var bindings = new Map();
    var onMatchStr = 'on:', vmMatchStr = 'vm:', elMatchStr = 'el:', byMatchStr = ':by:', toMatchStr = ':to', fromMatchStr = ':from', bindMatchStr = ':bind', viewModelBindingStr = 'viewModel', attributeBindingStr = 'attribute', scopeBindingStr = 'scope', viewModelOrAttributeBindingStr = 'viewModelOrAttribute';
    var throwOnlyOneTypeOfBindingError = function () {
        throw new Error('can-stache-bindings - you can not have contextual bindings ( this:from=\'value\' ) and key bindings ( prop:from=\'value\' ) on one element.');
    };
    var checkBindingState = function (bindingState, bindingInfo) {
        var isSettingOnViewModel = bindingInfo.parentToChild && bindingInfo.child === viewModelBindingStr;
        if (isSettingOnViewModel) {
            var bindingName = bindingInfo.childName;
            var isSettingViewModel = isSettingOnViewModel && (bindingName === 'this' || bindingName === '.');
            if (isSettingViewModel) {
                if (bindingState.isSettingViewModel || bindingState.isSettingOnViewModel) {
                    throwOnlyOneTypeOfBindingError();
                } else {
                    return {
                        isSettingViewModel: true,
                        initialViewModelData: undefined
                    };
                }
            } else {
                if (bindingState.isSettingViewModel) {
                    throwOnlyOneTypeOfBindingError();
                } else {
                    return {
                        isSettingOnViewModel: true,
                        initialViewModelData: bindingState.initialViewModelData
                    };
                }
            }
        } else {
            return bindingState;
        }
    };
    var onKeyValueSymbol = canSymbol.for('can.onKeyValue');
    var makeScopeFromEvent = function (element, event, viewModel, args, data, bindingContext) {
        var shiftArgumentsForLegacyArguments = bindingContext[onKeyValueSymbol] !== undefined;
        var specialValues = {
            element: element,
            event: event,
            viewModel: viewModel,
            arguments: shiftArgumentsForLegacyArguments ? Array.prototype.slice.call(args, 1) : args,
            args: args
        };
        return data.scope.add(specialValues, { special: true });
    };
    var runEventCallback = function (el, ev, data, scope, expr, attributeName, attrVal) {
        var updateFn = function () {
            var value = expr.value(scope, { doNotWrapInObservation: true });
            value = canReflect.isValueLike(value) ? canReflect.getValue(value) : value;
            return typeof value === 'function' ? value(el) : value;
        };
        queues.batch.start();
        var mutateQueueArgs = [];
        mutateQueueArgs = [
            updateFn,
            null,
            null,
            {}
        ];
        queues.mutateQueue.enqueue.apply(queues.mutateQueue, mutateQueueArgs);
        queues.batch.stop();
    };
    var behaviors = {
        viewModel: function (el, tagData, makeViewModel, initialViewModelData, staticDataBindingsOnly) {
            var viewModel, onCompleteBindings = [], onTeardowns = {}, bindingInfos = {}, attributeViewModelBindings = assign({}, initialViewModelData), bindingsState = {
                    isSettingOnViewModel: false,
                    isSettingViewModel: false,
                    initialViewModelData: initialViewModelData || {}
                }, hasDataBinding = false;
            canReflect.eachListLike(el.attributes || [], function (node) {
                var dataBinding = makeDataBinding(node, el, {
                    templateType: tagData.templateType,
                    scope: tagData.scope,
                    getViewModel: function () {
                        return viewModel;
                    },
                    attributeViewModelBindings: attributeViewModelBindings,
                    alreadyUpdatedChild: true,
                    nodeList: tagData.parentNodeList,
                    favorViewModel: true
                });
                if (dataBinding) {
                    var bindingInfo = dataBinding.bindingInfo;
                    bindingsState = checkBindingState(bindingsState, bindingInfo);
                    hasDataBinding = true;
                    if (bindingInfo.parentToChild) {
                        var parentValue = bindingInfo.stickyParentToChild ? makeCompute(dataBinding.parent) : dataBinding.canBinding.parentValue;
                        if (parentValue !== undefined) {
                            if (bindingsState.isSettingViewModel) {
                                bindingsState.initialViewModelData = parentValue;
                            } else {
                                bindingsState.initialViewModelData[cleanVMName(bindingInfo.childName, tagData.scope)] = parentValue;
                            }
                        }
                    }
                    onCompleteBindings.push(dataBinding.canBinding.start.bind(dataBinding.canBinding));
                    onTeardowns[node.name] = dataBinding.canBinding.stop.bind(dataBinding.canBinding);
                }
            });
            if (staticDataBindingsOnly && !hasDataBinding) {
                return;
            }
            viewModel = makeViewModel(bindingsState.initialViewModelData, hasDataBinding, bindingsState);
            for (var i = 0, len = onCompleteBindings.length; i < len; i++) {
                onCompleteBindings[i]();
            }
            var attributeDisposal;
            if (!bindingsState.isSettingViewModel) {
                attributeDisposal = domMutate.onNodeAttributeChange(el, function (ev) {
                    var attrName = ev.attributeName, value = el.getAttribute(attrName);
                    if (onTeardowns[attrName]) {
                        onTeardowns[attrName]();
                    }
                    var parentBindingWasAttribute = bindingInfos[attrName] && bindingInfos[attrName].parent === attributeBindingStr;
                    if (value !== null || parentBindingWasAttribute) {
                        var dataBinding = makeDataBinding({
                            name: attrName,
                            value: value
                        }, el, {
                            templateType: tagData.templateType,
                            scope: tagData.scope,
                            getViewModel: function () {
                                return viewModel;
                            },
                            attributeViewModelBindings: attributeViewModelBindings,
                            initializeValues: true,
                            nodeList: tagData.parentNodeList
                        });
                        if (dataBinding) {
                            dataBinding.canBinding.start();
                            bindingInfos[attrName] = dataBinding.bindingInfo;
                            onTeardowns[attrName] = dataBinding.canBinding.stop.bind(dataBinding.canBinding);
                        }
                    }
                });
            }
            return function () {
                if (attributeDisposal) {
                    attributeDisposal();
                    attributeDisposal = undefined;
                }
                for (var attrName in onTeardowns) {
                    onTeardowns[attrName]();
                }
            };
        },
        data: function (el, attrData) {
            if (domData.get.call(el, 'preventDataBindings')) {
                return;
            }
            var viewModel, getViewModel = ObservationRecorder.ignore(function () {
                    return viewModel || (viewModel = canViewModel(el));
                }), teardown, attributeDisposal, removedDisposal;
            var dataBinding = makeDataBinding({
                name: attrData.attributeName,
                value: el.getAttribute(attrData.attributeName),
                nodeList: attrData.nodeList
            }, el, {
                templateType: attrData.templateType,
                scope: attrData.scope,
                getViewModel: getViewModel,
                syncChildWithParent: false
            });
            dataBinding.canBinding.start();
            var attributeListener = function (ev) {
                var attrName = ev.attributeName, value = el.getAttribute(attrName);
                if (attrName === attrData.attributeName) {
                    if (teardown) {
                        teardown();
                    }
                    if (value !== null) {
                        var dataBinding = makeDataBinding({
                            name: attrName,
                            value: value
                        }, el, {
                            templateType: attrData.templateType,
                            scope: attrData.scope,
                            getViewModel: getViewModel,
                            initializeValues: true,
                            nodeList: attrData.nodeList,
                            syncChildWithParent: false
                        });
                        if (dataBinding) {
                            dataBinding.canBinding.start();
                            teardown = dataBinding.canBinding.stop.bind(dataBinding.canBinding);
                        }
                        teardown = dataBinding.onTeardown;
                    }
                }
            };
            var tearItAllDown = function () {
                if (teardown) {
                    teardown();
                    teardown = undefined;
                }
                if (removedDisposal) {
                    removedDisposal();
                    removedDisposal = undefined;
                }
                if (attributeDisposal) {
                    attributeDisposal();
                    attributeDisposal = undefined;
                }
            };
            if (attrData.nodeList) {
                ViewNodeList.register([], tearItAllDown, attrData.nodeList, false);
            }
            teardown = dataBinding.canBinding.stop.bind(dataBinding.canBinding);
            attributeDisposal = domMutate.onNodeAttributeChange(el, attributeListener);
            removedDisposal = domMutate.onNodeRemoval(el, function () {
                var doc = el.ownerDocument;
                var ownerNode = doc.contains ? doc : doc.documentElement;
                if (!ownerNode || ownerNode.contains(el) === false) {
                    tearItAllDown();
                }
            });
        },
        event: function (el, data) {
            var attributeName = encoder.decode(data.attributeName), event, bindingContext;
            if (attributeName.indexOf(toMatchStr + ':') !== -1 || attributeName.indexOf(fromMatchStr + ':') !== -1 || attributeName.indexOf(bindMatchStr + ':') !== -1) {
                return this.data(el, data);
            }
            if (startsWith.call(attributeName, onMatchStr)) {
                event = attributeName.substr(onMatchStr.length);
                var viewModel = el[canSymbol.for('can.viewModel')];
                var byParent = data.scope;
                if (startsWith.call(event, elMatchStr)) {
                    event = event.substr(elMatchStr.length);
                    bindingContext = el;
                } else {
                    if (startsWith.call(event, vmMatchStr)) {
                        event = event.substr(vmMatchStr.length);
                        bindingContext = viewModel;
                        byParent = viewModel;
                    } else {
                        bindingContext = viewModel || el;
                    }
                    var byIndex = event.indexOf(byMatchStr);
                    if (byIndex >= 0) {
                        bindingContext = byParent.get(event.substr(byIndex + byMatchStr.length));
                        event = event.substr(0, byIndex);
                    }
                }
            } else {
                throw new Error('can-stache-bindings - unsupported event bindings ' + attributeName);
            }
            var handler = function (ev) {
                var attrVal = el.getAttribute(encoder.encode(attributeName));
                if (!attrVal) {
                    return;
                }
                var viewModel = canViewModel(el);
                var expr = expression.parse(attrVal, {
                    lookupRule: function () {
                        return expression.Lookup;
                    },
                    methodRule: 'call'
                });
                var runScope = makeScopeFromEvent(el, ev, viewModel, arguments, data, bindingContext);
                if (expr instanceof expression.Hashes) {
                    var hashExprs = expr.hashExprs;
                    var key = Object.keys(hashExprs)[0];
                    var value = expr.hashExprs[key].value(runScope);
                    var isObservableValue = canReflect.isObservableLike(value) && canReflect.isValueLike(value);
                    runScope.set(key, isObservableValue ? canReflect.getValue(value) : value);
                } else if (expr instanceof expression.Call) {
                    runEventCallback(el, ev, data, runScope, expr, attributeName, attrVal);
                } else {
                    throw new Error('can-stache-bindings: Event bindings must be a call expression. Make sure you have a () in ' + data.attributeName + '=' + JSON.stringify(attrVal));
                }
            };
            var attributesDisposal, removalDisposal;
            var attributesHandler = function (ev) {
                var isEventAttribute = ev.attributeName === attributeName;
                var isRemoved = !el.getAttribute(attributeName);
                var isEventAttributeRemoved = isEventAttribute && isRemoved;
                if (isEventAttributeRemoved) {
                    unbindEvent();
                }
            };
            var removalHandler = function () {
                var doc = el.ownerDocument;
                var ownerNode = doc.contains ? doc : doc.documentElement;
                if (!ownerNode || !ownerNode.contains(el)) {
                    unbindEvent();
                }
            };
            var unbindEvent = function () {
                canEventQueue.off.call(bindingContext, event, handler);
                if (attributesDisposal) {
                    attributesDisposal();
                    attributesDisposal = undefined;
                }
                if (removalDisposal) {
                    removalDisposal();
                    removalDisposal = undefined;
                }
            };
            canEventQueue.on.call(bindingContext, event, handler);
            attributesDisposal = domMutate.onNodeAttributeChange(el, attributesHandler);
            removalDisposal = domMutate.onNodeRemoval(el, removalHandler);
        }
    };
    bindings.set(/[\w\.:]+:to$/, behaviors.data);
    bindings.set(/[\w\.:]+:from$/, behaviors.data);
    bindings.set(/[\w\.:]+:bind$/, behaviors.data);
    bindings.set(/[\w\.:]+:raw$/, behaviors.data);
    bindings.set(/[\w\.:]+:to:on:[\w\.:]+/, behaviors.data);
    bindings.set(/[\w\.:]+:from:on:[\w\.:]+/, behaviors.data);
    bindings.set(/[\w\.:]+:bind:on:[\w\.:]+/, behaviors.data);
    bindings.set(/on:[\w\.:]+/, behaviors.event);
    var getObservableFrom = {
        viewModelOrAttribute: function (el, scope, vmNameOrProp, bindingData, mustBeGettable, stickyCompute, event) {
            var viewModel = el[canSymbol.for('can.viewModel')];
            if (viewModel) {
                return this.viewModel.apply(this, arguments);
            } else {
                return this.attribute.apply(this, arguments);
            }
        },
        scope: function (el, scope, scopeProp, bindingData, mustBeGettable, stickyCompute) {
            if (!scopeProp) {
                return new SimpleObservable();
            } else {
                if (mustBeGettable || scopeProp.indexOf('(') >= 0 || scopeProp.indexOf('=') >= 0) {
                    var parentExpression = expression.parse(scopeProp, { baseMethodType: 'Call' });
                    if (parentExpression instanceof expression.Hashes) {
                        return new SimpleObservable(function () {
                            var hashExprs = parentExpression.hashExprs;
                            var key = Object.keys(hashExprs)[0];
                            var value = parentExpression.hashExprs[key].value(scope);
                            var isObservableValue = canReflect.isObservableLike(value) && canReflect.isValueLike(value);
                            scope.set(key, isObservableValue ? canReflect.getValue(value) : value);
                        });
                    } else {
                        return parentExpression.value(scope);
                    }
                } else {
                    var observation = {};
                    canReflect.assignSymbols(observation, {
                        'can.getValue': function getValue() {
                        },
                        'can.valueHasDependencies': function hasValueDependencies() {
                            return false;
                        },
                        'can.setValue': function setValue(newVal) {
                            var expr = expression.parse(cleanVMName(scopeProp, scope), { baseMethodType: 'Call' });
                            var value = expr.value(scope);
                            canReflect.setValue(value, newVal);
                        },
                        'can.getWhatIChange': function getWhatIChange() {
                            var data = scope.getDataForScopeSet(cleanVMName(scopeProp, scope));
                            var m = new Map();
                            var s = new Set();
                            s.add(data.key);
                            m.set(data.parent, s);
                            return { mutate: { keyDependencies: m } };
                        },
                        'can.getName': function getName() {
                        }
                    });
                    var data = scope.getDataForScopeSet(cleanVMName(scopeProp, scope));
                    if (data.parent && data.key) {
                        canReflectDeps.addMutatedBy(data.parent, data.key, observation);
                    }
                    return observation;
                }
            }
        },
        viewModel: function (el, scope, vmName, bindingData, mustBeGettable, stickyCompute, childEvent) {
            var setName = cleanVMName(vmName, scope);
            var isBoundToContext = vmName === '.' || vmName === 'this';
            var keysToRead = isBoundToContext ? [] : observeReader.reads(vmName);
            function getViewModelProperty() {
                var viewModel = bindingData.getViewModel();
                return observeReader.read(viewModel, keysToRead, {}).value;
            }
            var observation = new SettableObservable(getViewModelProperty, function setViewModelProperty(newVal) {
                var viewModel = bindingData.getViewModel();
                if (stickyCompute) {
                    var oldValue = canReflect.getKeyValue(viewModel, setName);
                    if (canReflect.isObservableLike(oldValue)) {
                        canReflect.setValue(oldValue, newVal);
                    } else {
                        canReflect.setKeyValue(viewModel, setName, new SimpleObservable(canReflect.getValue(stickyCompute)));
                    }
                } else {
                    if (isBoundToContext) {
                        canReflect.setValue(viewModel, newVal);
                    } else {
                        canReflect.setKeyValue(viewModel, setName, newVal);
                    }
                }
            });
            return observation;
        },
        attribute: function (el, scope, prop, bindingData, mustBeGettable, stickyCompute, event, bindingInfo) {
            if (prop === 'this') {
                return canReflect.assignSymbols({}, {
                    'can.getValue': function () {
                        return el;
                    },
                    'can.valueHasDependencies': function () {
                        return false;
                    },
                    'can.getName': function getName() {
                    }
                });
            } else {
                return new AttributeObservable(el, prop, {}, event);
            }
        }
    };
    var startsWith = String.prototype.startsWith || function (text) {
        return this.indexOf(text) === 0;
    };
    function getEventName(result) {
        if (result.special.on !== undefined) {
            return result.tokens[result.special.on + 1];
        }
    }
    var bindingRules = {
        to: {
            childToParent: true,
            parentToChild: false,
            syncChildWithParent: false
        },
        from: {
            childToParent: false,
            parentToChild: true,
            syncChildWithParent: false
        },
        bind: {
            childToParent: true,
            parentToChild: true,
            syncChildWithParent: true
        },
        raw: {
            childToParent: false,
            parentToChild: true,
            syncChildWithParent: false
        }
    };
    var bindingNames = [];
    var special = {
        vm: true,
        on: true
    };
    canReflect.each(bindingRules, function (value, key) {
        bindingNames.push(key);
        special[key] = true;
    });
    function tokenize(source) {
        var splitByColon = source.split(':');
        var result = {
            tokens: [],
            special: {}
        };
        splitByColon.forEach(function (token) {
            if (special[token]) {
                result.special[token] = result.tokens.push(token) - 1;
            } else {
                result.tokens.push(token);
            }
        });
        return result;
    }
    var getChildBindingStr = function (tokens, favorViewModel) {
        if (tokens.indexOf('vm') >= 0) {
            return viewModelBindingStr;
        } else if (tokens.indexOf('el') >= 0) {
            return attributeBindingStr;
        } else {
            return favorViewModel ? viewModelBindingStr : viewModelOrAttributeBindingStr;
        }
    };
    var getBindingInfo = function (node, attributeViewModelBindings, templateType, tagName, favorViewModel) {
        var bindingInfo, attributeName = encoder.decode(node.name), attributeValue = node.value || '';
        var result = tokenize(attributeName), dataBindingName, specialIndex;
        bindingNames.forEach(function (name) {
            if (result.special[name] !== undefined && result.special[name] > 0) {
                dataBindingName = name;
                specialIndex = result.special[name];
                return false;
            }
        });
        if (dataBindingName) {
            var childEventName = getEventName(result);
            var initializeValues = childEventName && dataBindingName !== 'bind' ? false : true;
            bindingInfo = assign({
                parent: scopeBindingStr,
                child: getChildBindingStr(result.tokens, favorViewModel),
                childName: result.tokens[specialIndex - 1],
                childEvent: childEventName,
                bindingAttributeName: attributeName,
                parentName: result.special.raw ? '"' + attributeValue + '"' : attributeValue,
                initializeValues: initializeValues
            }, bindingRules[dataBindingName]);
            if (attributeValue.trim().charAt(0) === '~') {
                bindingInfo.stickyParentToChild = true;
            }
            return bindingInfo;
        }
    };
    var makeDataBinding = function (node, el, bindingData) {
        var bindingInfo = getBindingInfo(node, bindingData.attributeViewModelBindings, bindingData.templateType, el.nodeName.toLowerCase(), bindingData.favorViewModel);
        if (!bindingInfo) {
            return;
        }
        var parentObservable = getObservableFrom[bindingInfo.parent](el, bindingData.scope, bindingInfo.parentName, bindingData, bindingInfo.parentToChild, undefined, undefined, bindingInfo), childObservable = getObservableFrom[bindingInfo.child](el, bindingData.scope, bindingInfo.childName, bindingData, bindingInfo.childToParent, bindingInfo.stickyParentToChild && parentObservable, bindingInfo.childEvent, bindingInfo);
        var childToParent = !!bindingInfo.childToParent;
        var parentToChild = !!bindingInfo.parentToChild;
        var bindingOptions = {
            child: childObservable,
            childToParent: childToParent,
            cycles: childToParent === true && parentToChild === true ? 0 : 100,
            onInitDoNotUpdateChild: bindingData.alreadyUpdatedChild || bindingInfo.initializeValues === false,
            onInitDoNotUpdateParent: bindingInfo.initializeValues === false,
            onInitSetUndefinedParentIfChildIsDefined: true,
            parent: parentObservable,
            parentToChild: parentToChild,
            priority: bindingData.nodeList ? bindingData.nodeList.nesting + 1 : undefined,
            queue: 'domUI',
            sticky: bindingInfo.syncChildWithParent ? 'childSticksToParent' : undefined
        };
        var canBinding = new Bind(bindingOptions);
        canBinding.startParent();
        return {
            bindingInfo: bindingInfo,
            canBinding: canBinding,
            parent: parentObservable
        };
    };
    var cleanVMName = function (name, scope) {
        return name.replace(/@/g, '');
    };
    var canStacheBindings = {
        behaviors: behaviors,
        getBindingInfo: getBindingInfo,
        bindings: bindings
    };
    canStacheBindings[canSymbol.for('can.callbackMap')] = bindings;
    viewCallbacks.attrs(canStacheBindings);
    module.exports = canStacheBindings;
});
/*can-define@2.7.5#list/list*/
define('can-define@2.7.5#list/list', [
    'require',
    'exports',
    'module',
    'can-construct',
    'can-define',
    'can-queues',
    'can-event-queue/type/type',
    'can-observation-recorder',
    'can-log',
    'can-log/dev/dev',
    '../define-helpers/define-helpers',
    'can-assign',
    'can-diff/list/list',
    'can-namespace',
    'can-reflect',
    'can-symbol',
    'can-single-reference'
], function (require, exports, module) {
    'use strict';
    var Construct = require('can-construct');
    var define = require('can-define');
    var make = define.make;
    var queues = require('can-queues');
    var addTypeEvents = require('can-event-queue/type/type');
    var ObservationRecorder = require('can-observation-recorder');
    var canLog = require('can-log');
    var canLogDev = require('can-log/dev/dev');
    var defineHelpers = require('../define-helpers/define-helpers');
    var assign = require('can-assign');
    var diff = require('can-diff/list/list');
    var ns = require('can-namespace');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var singleReference = require('can-single-reference');
    var splice = [].splice;
    var runningNative = false;
    var identity = function (x) {
        return x;
    };
    var localOnPatchesSymbol = 'can.patches';
    var makeFilterCallback = function (props) {
        return function (item) {
            for (var prop in props) {
                if (item[prop] !== props[prop]) {
                    return false;
                }
            }
            return true;
        };
    };
    var onKeyValue = define.eventsProto[canSymbol.for('can.onKeyValue')];
    var offKeyValue = define.eventsProto[canSymbol.for('can.offKeyValue')];
    var getSchemaSymbol = canSymbol.for('can.getSchema');
    function getSchema() {
        var definitions = this.prototype._define.definitions;
        var schema = {
            type: 'list',
            keys: {}
        };
        schema = define.updateSchemaKeys(schema, definitions);
        if (schema.keys['#']) {
            schema.values = definitions['#'].Type;
            delete schema.keys['#'];
        }
        return schema;
    }
    var DefineList = Construct.extend('DefineList', {
        setup: function (base) {
            if (DefineList) {
                addTypeEvents(this);
                var prototype = this.prototype;
                var result = define(prototype, prototype, base.prototype._define);
                define.makeDefineInstanceKey(this, result);
                var itemsDefinition = result.definitions['#'] || result.defaultDefinition;
                if (itemsDefinition) {
                    if (itemsDefinition.Type) {
                        this.prototype.__type = make.set.Type('*', itemsDefinition.Type, identity);
                    } else if (itemsDefinition.type) {
                        this.prototype.__type = make.set.type('*', itemsDefinition.type, identity);
                    }
                }
                this[getSchemaSymbol] = getSchema;
            }
        }
    }, {
        setup: function (items) {
            if (!this._define) {
                Object.defineProperty(this, '_define', {
                    enumerable: false,
                    value: {
                        definitions: {
                            length: { type: 'number' },
                            _length: { type: 'number' }
                        }
                    }
                });
                Object.defineProperty(this, '_data', {
                    enumerable: false,
                    value: {}
                });
            }
            define.setup.call(this, {}, false);
            Object.defineProperty(this, '_length', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: 0
            });
            if (items) {
                this.splice.apply(this, [
                    0,
                    0
                ].concat(canReflect.toArray(items)));
            }
        },
        __type: define.types.observable,
        _triggerChange: function (attr, how, newVal, oldVal) {
            var index = +attr;
            if (!isNaN(index)) {
                var itemsDefinition = this._define.definitions['#'];
                var patches, dispatched;
                if (how === 'add') {
                    if (itemsDefinition && typeof itemsDefinition.added === 'function') {
                        ObservationRecorder.ignore(itemsDefinition.added).call(this, newVal, index);
                    }
                    patches = [{
                            type: 'splice',
                            insert: newVal,
                            index: index,
                            deleteCount: 0
                        }];
                    dispatched = {
                        type: how,
                        patches: patches
                    };
                    this.dispatch(dispatched, [
                        newVal,
                        index
                    ]);
                } else if (how === 'remove') {
                    if (itemsDefinition && typeof itemsDefinition.removed === 'function') {
                        ObservationRecorder.ignore(itemsDefinition.removed).call(this, oldVal, index);
                    }
                    patches = [{
                            type: 'splice',
                            index: index,
                            deleteCount: oldVal.length
                        }];
                    dispatched = {
                        type: how,
                        patches: patches
                    };
                    this.dispatch(dispatched, [
                        oldVal,
                        index
                    ]);
                } else {
                    this.dispatch(how, [
                        newVal,
                        index
                    ]);
                }
            } else {
                this.dispatch({
                    type: '' + attr,
                    target: this
                }, [
                    newVal,
                    oldVal
                ]);
            }
        },
        get: function (index) {
            if (arguments.length) {
                if (isNaN(index)) {
                    ObservationRecorder.add(this, index);
                } else {
                    ObservationRecorder.add(this, 'length');
                }
                return this[index];
            } else {
                return canReflect.unwrap(this, Map);
            }
        },
        set: function (prop, value) {
            if (typeof prop !== 'object') {
                prop = isNaN(+prop) || prop % 1 ? prop : +prop;
                if (typeof prop === 'number') {
                    if (typeof prop === 'number' && prop > this._length - 1) {
                        var newArr = new Array(prop + 1 - this._length);
                        newArr[newArr.length - 1] = value;
                        this.push.apply(this, newArr);
                        return newArr;
                    }
                    this.splice(prop, 1, value);
                } else {
                    var defined = defineHelpers.defineExpando(this, prop, value);
                    if (!defined) {
                        this[prop] = value;
                    }
                }
            } else {
                if (canReflect.isListLike(prop)) {
                    if (value) {
                        this.replace(prop);
                    } else {
                        canReflect.assignList(this, prop);
                    }
                } else {
                    canReflect.assignMap(this, prop);
                }
            }
            return this;
        },
        assign: function (prop) {
            if (canReflect.isListLike(prop)) {
                canReflect.assignList(this, prop);
            } else {
                canReflect.assignMap(this, prop);
            }
            return this;
        },
        update: function (prop) {
            if (canReflect.isListLike(prop)) {
                canReflect.updateList(this, prop);
            } else {
                canReflect.updateMap(this, prop);
            }
            return this;
        },
        assignDeep: function (prop) {
            if (canReflect.isListLike(prop)) {
                canReflect.assignDeepList(this, prop);
            } else {
                canReflect.assignDeepMap(this, prop);
            }
            return this;
        },
        updateDeep: function (prop) {
            if (canReflect.isListLike(prop)) {
                canReflect.updateDeepList(this, prop);
            } else {
                canReflect.updateDeepMap(this, prop);
            }
            return this;
        },
        _items: function () {
            var arr = [];
            this._each(function (item) {
                arr.push(item);
            });
            return arr;
        },
        _each: function (callback) {
            for (var i = 0, len = this._length; i < len; i++) {
                callback(this[i], i);
            }
        },
        splice: function (index, howMany) {
            var args = canReflect.toArray(arguments), added = [], i, len, listIndex, allSame = args.length > 2, oldLength = this._length;
            index = index || 0;
            for (i = 0, len = args.length - 2; i < len; i++) {
                listIndex = i + 2;
                args[listIndex] = this.__type(args[listIndex], listIndex);
                added.push(args[listIndex]);
                if (this[i + index] !== args[listIndex]) {
                    allSame = false;
                }
            }
            if (allSame && this._length <= added.length) {
                return added;
            }
            if (howMany === undefined) {
                howMany = args[1] = this._length - index;
            }
            runningNative = true;
            var removed = splice.apply(this, args);
            runningNative = false;
            queues.batch.start();
            if (howMany > 0) {
                this._triggerChange('' + index, 'remove', undefined, removed);
            }
            if (args.length > 2) {
                this._triggerChange('' + index, 'add', added, removed);
            }
            this.dispatch('length', [
                this._length,
                oldLength
            ]);
            queues.batch.stop();
            return removed;
        },
        serialize: function () {
            return canReflect.serialize(this, Map);
        }
    });
    for (var prop in define.eventsProto) {
        Object.defineProperty(DefineList.prototype, prop, {
            enumerable: false,
            value: define.eventsProto[prop],
            writable: true
        });
    }
    var eventsProtoSymbols = 'getOwnPropertySymbols' in Object ? Object.getOwnPropertySymbols(define.eventsProto) : [
        canSymbol.for('can.onKeyValue'),
        canSymbol.for('can.offKeyValue')
    ];
    eventsProtoSymbols.forEach(function (sym) {
        Object.defineProperty(DefineList.prototype, sym, {
            configurable: true,
            enumerable: false,
            value: define.eventsProto[sym],
            writable: true
        });
    });
    var getArgs = function (args) {
        return args[0] && Array.isArray(args[0]) ? args[0] : canReflect.toArray(args);
    };
    canReflect.eachKey({
        push: 'length',
        unshift: 0
    }, function (where, name) {
        var orig = [][name];
        DefineList.prototype[name] = function () {
            var args = [], len = where ? this._length : 0, i = arguments.length, res, val;
            while (i--) {
                val = arguments[i];
                args[i] = this.__type(val, i);
            }
            runningNative = true;
            res = orig.apply(this, args);
            runningNative = false;
            if (!this.comparator || args.length) {
                queues.batch.start();
                this._triggerChange('' + len, 'add', args, undefined);
                this.dispatch('length', [
                    this._length,
                    len
                ]);
                queues.batch.stop();
            }
            return res;
        };
    });
    canReflect.eachKey({
        pop: 'length',
        shift: 0
    }, function (where, name) {
        var orig = [][name];
        DefineList.prototype[name] = function () {
            if (!this._length) {
                return undefined;
            }
            var args = getArgs(arguments), len = where && this._length ? this._length - 1 : 0, oldLength = this._length ? this._length : 0, res;
            runningNative = true;
            res = orig.apply(this, args);
            runningNative = false;
            queues.batch.start();
            this._triggerChange('' + len, 'remove', undefined, [res]);
            this.dispatch('length', [
                this._length,
                oldLength
            ]);
            queues.batch.stop();
            return res;
        };
    });
    canReflect.eachKey({
        'map': 3,
        'filter': 3,
        'reduce': 4,
        'reduceRight': 4,
        'every': 3,
        'some': 3
    }, function a(fnLength, fnName) {
        DefineList.prototype[fnName] = function () {
            var self = this;
            var args = [].slice.call(arguments, 0);
            var callback = args[0];
            var thisArg = args[fnLength - 1] || self;
            if (typeof callback === 'object') {
                callback = makeFilterCallback(callback);
            }
            args[0] = function () {
                var cbArgs = [].slice.call(arguments, 0);
                cbArgs[fnLength - 3] = self.get(cbArgs[fnLength - 2]);
                return callback.apply(thisArg, cbArgs);
            };
            var ret = Array.prototype[fnName].apply(this, args);
            if (fnName === 'map') {
                return new DefineList(ret);
            } else if (fnName === 'filter') {
                return new self.constructor(ret);
            } else {
                return ret;
            }
        };
    });
    assign(DefineList.prototype, {
        indexOf: function (item, fromIndex) {
            for (var i = fromIndex || 0, len = this.length; i < len; i++) {
                if (this.get(i) === item) {
                    return i;
                }
            }
            return -1;
        },
        lastIndexOf: function (item, fromIndex) {
            fromIndex = typeof fromIndex === 'undefined' ? this.length - 1 : fromIndex;
            for (var i = fromIndex; i >= 0; i--) {
                if (this.get(i) === item) {
                    return i;
                }
            }
            return -1;
        },
        join: function () {
            ObservationRecorder.add(this, 'length');
            return [].join.apply(this, arguments);
        },
        reverse: function () {
            var list = [].reverse.call(this._items());
            return this.replace(list);
        },
        slice: function () {
            ObservationRecorder.add(this, 'length');
            var temp = Array.prototype.slice.apply(this, arguments);
            return new this.constructor(temp);
        },
        concat: function () {
            var args = [];
            canReflect.eachIndex(arguments, function (arg) {
                if (canReflect.isListLike(arg)) {
                    var arr = Array.isArray(arg) ? arg : canReflect.toArray(arg);
                    arr.forEach(function (innerArg) {
                        args.push(this.__type(innerArg));
                    }, this);
                } else {
                    args.push(this.__type(arg));
                }
            }, this);
            return new this.constructor(Array.prototype.concat.apply(canReflect.toArray(this), args));
        },
        forEach: function (cb, thisarg) {
            var item;
            for (var i = 0, len = this.length; i < len; i++) {
                item = this.get(i);
                if (cb.call(thisarg || item, item, i, this) === false) {
                    break;
                }
            }
            return this;
        },
        replace: function (newList) {
            var patches = diff(this, newList);
            queues.batch.start();
            for (var i = 0, len = patches.length; i < len; i++) {
                this.splice.apply(this, [
                    patches[i].index,
                    patches[i].deleteCount
                ].concat(patches[i].insert));
            }
            queues.batch.stop();
            return this;
        },
        sort: function (compareFunction) {
            var sorting = Array.prototype.slice.call(this);
            Array.prototype.sort.call(sorting, compareFunction);
            this.splice.apply(this, [
                0,
                sorting.length
            ].concat(sorting));
            return this;
        }
    });
    for (var prop in define.eventsProto) {
        DefineList[prop] = define.eventsProto[prop];
        Object.defineProperty(DefineList.prototype, prop, {
            enumerable: false,
            value: define.eventsProto[prop],
            writable: true
        });
    }
    Object.defineProperty(DefineList.prototype, 'length', {
        get: function () {
            if (!this.__inSetup) {
                ObservationRecorder.add(this, 'length');
            }
            return this._length;
        },
        set: function (newVal) {
            if (runningNative) {
                this._length = newVal;
                return;
            }
            if (newVal == null || isNaN(+newVal) || newVal === this._length) {
                return;
            }
            if (newVal > this._length - 1) {
                var newArr = new Array(newVal - this._length);
                this.push.apply(this, newArr);
            } else {
                this.splice(newVal);
            }
        },
        enumerable: true
    });
    DefineList.prototype.attr = function (prop, value) {
        canLog.warn('DefineMap::attr shouldn\'t be called');
        if (arguments.length === 0) {
            return this.get();
        } else if (prop && typeof prop === 'object') {
            return this.set.apply(this, arguments);
        } else if (arguments.length === 1) {
            return this.get(prop);
        } else {
            return this.set(prop, value);
        }
    };
    DefineList.prototype.item = function (index, value) {
        if (arguments.length === 1) {
            return this.get(index);
        } else {
            return this.set(index, value);
        }
    };
    DefineList.prototype.items = function () {
        canLog.warn('DefineList::get should should be used instead of DefineList::items');
        return this.get();
    };
    var defineListProto = {
        'can.isMoreListLikeThanMapLike': true,
        'can.isMapLike': true,
        'can.isListLike': true,
        'can.isValueLike': false,
        'can.getKeyValue': DefineList.prototype.get,
        'can.setKeyValue': DefineList.prototype.set,
        'can.onKeyValue': function (key, handler, queue) {
            var translationHandler;
            if (isNaN(key)) {
                return onKeyValue.apply(this, arguments);
            } else {
                translationHandler = function () {
                    handler(this[key]);
                };
                singleReference.set(handler, this, translationHandler, key);
                return onKeyValue.call(this, 'length', translationHandler, queue);
            }
        },
        'can.offKeyValue': function (key, handler, queue) {
            var translationHandler;
            if (isNaN(key)) {
                return offKeyValue.apply(this, arguments);
            } else {
                translationHandler = singleReference.getAndDelete(handler, this, key);
                return offKeyValue.call(this, 'length', translationHandler, queue);
            }
        },
        'can.deleteKeyValue': function (prop) {
            prop = isNaN(+prop) || prop % 1 ? prop : +prop;
            if (typeof prop === 'number') {
                this.splice(prop, 1);
            } else if (prop === 'length' || prop === '_length') {
                return;
            } else {
                this.set(prop, undefined);
            }
            return this;
        },
        'can.assignDeep': function (source) {
            queues.batch.start();
            canReflect.assignList(this, source);
            queues.batch.stop();
        },
        'can.updateDeep': function (source) {
            queues.batch.start();
            this.replace(source);
            queues.batch.stop();
        },
        'can.keyHasDependencies': function (key) {
            return !!(this._computed && this._computed[key] && this._computed[key].compute);
        },
        'can.getKeyDependencies': function (key) {
            var ret;
            if (this._computed && this._computed[key] && this._computed[key].compute) {
                ret = {};
                ret.valueDependencies = new Set();
                ret.valueDependencies.add(this._computed[key].compute);
            }
            return ret;
        },
        'can.splice': function (index, deleteCount, insert) {
            this.splice.apply(this, [
                index,
                deleteCount
            ].concat(insert));
        },
        'can.onPatches': function (handler, queue) {
            this[canSymbol.for('can.onKeyValue')](localOnPatchesSymbol, handler, queue);
        },
        'can.offPatches': function (handler, queue) {
            this[canSymbol.for('can.offKeyValue')](localOnPatchesSymbol, handler, queue);
        }
    };
    canReflect.assignSymbols(DefineList.prototype, defineListProto);
    canReflect.setKeyValue(DefineList.prototype, canSymbol.iterator, function () {
        var index = -1;
        if (typeof this.length !== 'number') {
            this.length = 0;
        }
        return {
            next: function () {
                index++;
                return {
                    value: this[index],
                    done: index >= this.length
                };
            }.bind(this)
        };
    });
    define.DefineList = DefineList;
    module.exports = ns.DefineList = DefineList;
});
/*can-component@4.4.11#can-component*/
define('can-component@4.4.11#can-component', [
    'require',
    'exports',
    'module',
    './control/control',
    'can-namespace',
    'can-bind',
    'can-construct',
    'can-stache',
    'can-stache-bindings',
    'can-view-scope',
    'can-view-callbacks',
    'can-view-nodelist',
    'can-reflect',
    'can-stache-key',
    'can-simple-observable/setter/setter',
    'can-simple-observable',
    'can-simple-map',
    'can-define/map/map',
    'can-log',
    'can-log/dev/dev',
    'can-assign',
    'can-observation-recorder',
    'can-queues',
    'can-view-model',
    'can-define/list/list',
    'can-dom-data-state',
    'can-child-nodes',
    'can-string',
    'can-dom-events',
    'can-dom-mutate',
    'can-dom-mutate/node',
    'can-symbol',
    'can-globals/document/document'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var ComponentControl = require('./control/control');
        var namespace = require('can-namespace');
        var Bind = require('can-bind');
        var Construct = require('can-construct');
        var stache = require('can-stache');
        var stacheBindings = require('can-stache-bindings');
        var Scope = require('can-view-scope');
        var viewCallbacks = require('can-view-callbacks');
        var nodeLists = require('can-view-nodelist');
        var canReflect = require('can-reflect');
        var observeReader = require('can-stache-key');
        var SettableObservable = require('can-simple-observable/setter/setter');
        var SimpleObservable = require('can-simple-observable');
        var SimpleMap = require('can-simple-map');
        var DefineMap = require('can-define/map/map');
        var canLog = require('can-log');
        var canDev = require('can-log/dev/dev');
        var assign = require('can-assign');
        var ObservationRecorder = require('can-observation-recorder');
        var queues = require('can-queues');
        require('can-view-model');
        require('can-define/list/list');
        var domData = require('can-dom-data-state');
        var getChildNodes = require('can-child-nodes');
        var string = require('can-string');
        var domEvents = require('can-dom-events');
        var domMutate = require('can-dom-mutate');
        var domMutateNode = require('can-dom-mutate/node');
        var canSymbol = require('can-symbol');
        var DOCUMENT = require('can-globals/document/document');
        var createdByCanComponentSymbol = canSymbol('can.createdByCanComponent');
        var getValueSymbol = canSymbol.for('can.getValue');
        var setValueSymbol = canSymbol.for('can.setValue');
        var viewInsertSymbol = canSymbol.for('can.viewInsert');
        var viewModelSymbol = canSymbol.for('can.viewModel');
        stache.addBindings(stacheBindings);
        function addContext(el, tagData, insertionElementTagData) {
            var vm;
            domData.set.call(el, 'preventDataBindings', true);
            var teardown = stacheBindings.behaviors.viewModel(el, insertionElementTagData, function (initialData, hasDataBinding, bindingState) {
                if (bindingState && bindingState.isSettingOnViewModel === true) {
                    return vm = new SimpleMap(initialData);
                } else {
                    return vm = new SimpleObservable(initialData);
                }
            }, undefined, true);
            if (!teardown) {
                return tagData;
            } else {
                return assign(assign({}, tagData), {
                    teardown: teardown,
                    scope: tagData.scope.add(vm)
                });
            }
        }
        function makeInsertionTagCallback(tagName, componentTagData, shadowTagData, leakScope, getPrimaryTemplate) {
            var options = shadowTagData.options;
            return function hookupFunction(el, insertionElementTagData) {
                var template = getPrimaryTemplate(el) || insertionElementTagData.subtemplate, renderingLightContent = template !== insertionElementTagData.subtemplate;
                if (template) {
                    delete options.tags[tagName];
                    var tagData;
                    if (renderingLightContent) {
                        if (leakScope.toLightContent) {
                            tagData = addContext(el, {
                                scope: insertionElementTagData.scope.cloneFromRef(),
                                options: insertionElementTagData.options
                            }, insertionElementTagData);
                        } else {
                            tagData = addContext(el, componentTagData, insertionElementTagData);
                        }
                    } else {
                        tagData = addContext(el, insertionElementTagData, insertionElementTagData);
                    }
                    var nodeList = nodeLists.register([el], function () {
                        if (tagData.teardown) {
                            tagData.teardown();
                        }
                    }, insertionElementTagData.parentNodeList || true, insertionElementTagData.directlyNested);
                    nodeList.expression = '<can-slot name=\'' + el.getAttribute('name') + '\'/>';
                    var frag = template(tagData.scope, tagData.options, nodeList);
                    var newNodes = canReflect.toArray(getChildNodes(frag));
                    var oldNodes = nodeLists.update(nodeList, newNodes);
                    nodeLists.replace(oldNodes, frag);
                    options.tags[tagName] = hookupFunction;
                }
            };
        }
        function getSetupFunctionForComponentVM(componentInitVM) {
            return ObservationRecorder.ignore(function (el, makeViewModel, initialVMData) {
                var onCompleteBindings = [];
                var onTeardowns = [];
                var viewModel;
                canReflect.eachKey(componentInitVM, function (parent, propName) {
                    var canGetParentValue = parent != null && !!parent[getValueSymbol];
                    var canSetParentValue = parent != null && !!parent[setValueSymbol];
                    if (canGetParentValue === true || canSetParentValue) {
                        var keysToRead = observeReader.reads(propName);
                        var child = new SettableObservable(function () {
                            return observeReader.read(viewModel, keysToRead).value;
                        }, function (newValue) {
                            canReflect.setKeyValue(viewModel, propName, newValue);
                        });
                        var canBinding = new Bind({
                            child: child,
                            parent: parent,
                            queue: 'domUI'
                        });
                        canBinding.startParent();
                        if (canGetParentValue === true) {
                            initialVMData[propName] = canBinding.parentValue;
                        }
                        onCompleteBindings.push(canBinding.start.bind(canBinding));
                        onTeardowns.push(canBinding.stop.bind(canBinding));
                    } else {
                        initialVMData[propName] = parent;
                    }
                });
                viewModel = makeViewModel(initialVMData);
                for (var i = 0, len = onCompleteBindings.length; i < len; i++) {
                    onCompleteBindings[i]();
                }
                return function () {
                    onTeardowns.forEach(function (onTeardown) {
                        onTeardown();
                    });
                };
            });
        }
        var Component = Construct.extend({
            setup: function () {
                Construct.setup.apply(this, arguments);
                if (Component) {
                    var self = this;
                    if (this.prototype.events !== undefined && canReflect.size(this.prototype.events) !== 0) {
                        this.Control = ComponentControl.extend(this.prototype.events);
                    }
                    var protoViewModel = this.prototype.viewModel || this.prototype.scope;
                    if (protoViewModel && this.prototype.ViewModel) {
                        throw new Error('Cannot provide both a ViewModel and a viewModel property');
                    }
                    var vmName = string.capitalize(string.camelize(this.prototype.tag)) + 'VM';
                    if (this.prototype.ViewModel) {
                        if (typeof this.prototype.ViewModel === 'function') {
                            this.ViewModel = this.prototype.ViewModel;
                        } else {
                            this.ViewModel = DefineMap.extend(vmName, {}, this.prototype.ViewModel);
                        }
                    } else {
                        if (protoViewModel) {
                            if (typeof protoViewModel === 'function') {
                                if (canReflect.isObservableLike(protoViewModel.prototype) && canReflect.isMapLike(protoViewModel.prototype)) {
                                    this.ViewModel = protoViewModel;
                                } else {
                                    this.viewModelHandler = protoViewModel;
                                }
                            } else {
                                if (canReflect.isObservableLike(protoViewModel) && canReflect.isMapLike(protoViewModel)) {
                                    this.viewModelInstance = protoViewModel;
                                } else {
                                    canLog.warn('can-component: ' + this.prototype.tag + ' is extending the viewModel into a can-simple-map');
                                    this.ViewModel = SimpleMap.extend(vmName, {}, protoViewModel);
                                }
                            }
                        } else {
                            this.ViewModel = SimpleMap.extend(vmName, {}, {});
                        }
                    }
                    if (this.prototype.template) {
                        this.renderer = this.prototype.template;
                    }
                    if (this.prototype.view) {
                        this.renderer = this.prototype.view;
                    }
                    if (typeof this.renderer === 'string') {
                        var viewName = string.capitalize(string.camelize(this.prototype.tag)) + 'View';
                        this.renderer = stache(viewName, this.renderer);
                    }
                    var renderComponent = function (el, tagData) {
                        if (el[createdByCanComponentSymbol] === undefined) {
                            new self(el, tagData);
                        }
                    };
                    viewCallbacks.tag(this.prototype.tag, renderComponent);
                }
            }
        }, {
            setup: function (el, componentTagData) {
                this._initialArgs = [
                    el,
                    componentTagData
                ];
                var component = this;
                var options = {
                    helpers: {},
                    tags: {}
                };
                if (componentTagData === undefined) {
                    if (el === undefined) {
                        componentTagData = {};
                    } else {
                        componentTagData = el;
                        el = undefined;
                    }
                }
                if (el === undefined) {
                    el = DOCUMENT().createElement(this.tag);
                    el[createdByCanComponentSymbol] = true;
                }
                this.element = el;
                var componentContent = componentTagData.content;
                if (componentContent !== undefined) {
                    if (typeof componentContent === 'function') {
                        componentTagData.subtemplate = componentContent;
                    } else if (typeof componentContent === 'string') {
                        componentTagData.subtemplate = stache(componentContent);
                    }
                }
                var componentScope = componentTagData.scope;
                if (componentScope !== undefined && componentScope instanceof Scope === false) {
                    componentTagData.scope = new Scope(componentScope);
                }
                var componentTemplates = componentTagData.templates;
                if (componentTemplates !== undefined) {
                    canReflect.eachKey(componentTemplates, function (template, name) {
                        if (typeof template === 'string') {
                            var debugName = name + ' template';
                            componentTemplates[name] = stache(debugName, template);
                        }
                    });
                }
                var teardownFunctions = [];
                var initialViewModelData = {};
                var callTeardownFunctions = function () {
                    for (var i = 0, len = teardownFunctions.length; i < len; i++) {
                        teardownFunctions[i]();
                    }
                };
                var preventDataBindings = domData.get.call(el, 'preventDataBindings');
                var viewModel, frag;
                var teardownBindings;
                if (preventDataBindings) {
                    viewModel = el[viewModelSymbol];
                } else {
                    var setupFn;
                    if (componentTagData.setupBindings) {
                        setupFn = componentTagData.setupBindings;
                    } else if (componentTagData.viewModel) {
                        setupFn = getSetupFunctionForComponentVM(componentTagData.viewModel);
                    } else {
                        setupFn = function (el, callback, data) {
                            return stacheBindings.behaviors.viewModel(el, componentTagData, callback, data);
                        };
                    }
                    teardownBindings = setupFn(el, function (initialViewModelData) {
                        var ViewModel = component.constructor.ViewModel, viewModelHandler = component.constructor.viewModelHandler, viewModelInstance = component.constructor.viewModelInstance;
                        if (viewModelHandler) {
                            var scopeResult = viewModelHandler.call(component, initialViewModelData, componentTagData.scope, el);
                            if (canReflect.isObservableLike(scopeResult) && canReflect.isMapLike(scopeResult)) {
                                viewModelInstance = scopeResult;
                            } else if (canReflect.isObservableLike(scopeResult.prototype) && canReflect.isMapLike(scopeResult.prototype)) {
                                ViewModel = scopeResult;
                            } else {
                                ViewModel = SimpleMap.extend(scopeResult);
                            }
                        }
                        if (ViewModel) {
                            viewModelInstance = new component.constructor.ViewModel(initialViewModelData);
                        }
                        viewModel = viewModelInstance;
                        return viewModelInstance;
                    }, initialViewModelData);
                }
                this.viewModel = viewModel;
                el[viewModelSymbol] = viewModel;
                el.viewModel = viewModel;
                domData.set.call(el, 'preventDataBindings', true);
                if (this.helpers !== undefined) {
                    canReflect.eachKey(this.helpers, function (val, prop) {
                        if (typeof val === 'function') {
                            options.helpers[prop] = val.bind(viewModel);
                        }
                    });
                }
                if (this.constructor.Control) {
                    this._control = new this.constructor.Control(el, {
                        scope: this.viewModel,
                        viewModel: this.viewModel,
                        destroy: callTeardownFunctions
                    });
                } else {
                    var removalDisposal = domMutate.onNodeRemoval(el, function () {
                        var doc = el.ownerDocument;
                        var rootNode = doc.contains ? doc : doc.documentElement;
                        if (!rootNode || !rootNode.contains(el)) {
                            removalDisposal();
                            callTeardownFunctions();
                        }
                    });
                }
                var leakScope = {
                    toLightContent: this.leakScope === true,
                    intoShadowContent: this.leakScope === true
                };
                var hasShadowTemplate = !!this.constructor.renderer;
                var betweenTagsRenderer;
                var betweenTagsTagData;
                if (hasShadowTemplate) {
                    var shadowTagData;
                    if (leakScope.intoShadowContent) {
                        shadowTagData = {
                            scope: componentTagData.scope.add(this.viewModel, { viewModel: true }),
                            options: options
                        };
                    } else {
                        shadowTagData = {
                            scope: new Scope(this.viewModel, null, { viewModel: true }),
                            options: options
                        };
                    }
                    options.tags['can-slot'] = makeInsertionTagCallback('can-slot', componentTagData, shadowTagData, leakScope, function (el) {
                        var templates = componentTagData.templates;
                        if (templates) {
                            return templates[el.getAttribute('name')];
                        }
                    });
                    options.tags.content = makeInsertionTagCallback('content', componentTagData, shadowTagData, leakScope, function () {
                        return componentTagData.subtemplate;
                    });
                    betweenTagsRenderer = this.constructor.renderer;
                    betweenTagsTagData = shadowTagData;
                } else {
                    var lightTemplateTagData = {
                        scope: componentTagData.scope.add(this.viewModel, { viewModel: true }),
                        options: options
                    };
                    betweenTagsTagData = lightTemplateTagData;
                    betweenTagsRenderer = componentTagData.subtemplate || el.ownerDocument.createDocumentFragment.bind(el.ownerDocument);
                }
                var disconnectedCallback, componentInPage;
                var nodeList = nodeLists.register([], function () {
                    component._torndown = true;
                    domEvents.dispatch(el, 'beforeremove', false);
                    if (teardownBindings) {
                        teardownBindings();
                    }
                    if (disconnectedCallback) {
                        disconnectedCallback(el);
                    } else if (typeof viewModel.stopListening === 'function') {
                        viewModel.stopListening();
                    }
                }, componentTagData.parentNodeList || true, false);
                nodeList.expression = '<' + this.tag + '>';
                teardownFunctions.push(function () {
                    nodeLists.unregister(nodeList);
                });
                this.nodeList = nodeList;
                frag = betweenTagsRenderer(betweenTagsTagData.scope, betweenTagsTagData.options, nodeList);
                domMutateNode.appendChild.call(el, frag);
                nodeLists.update(nodeList, getChildNodes(el));
                if (viewModel && viewModel.connectedCallback) {
                    var body = DOCUMENT().body;
                    componentInPage = body && body.contains(el);
                    if (componentInPage) {
                        disconnectedCallback = viewModel.connectedCallback(el);
                    } else {
                        var insertionDisposal = domMutate.onNodeInsertion(el, function () {
                            insertionDisposal();
                            disconnectedCallback = viewModel.connectedCallback(el);
                        });
                    }
                }
                component._torndown = false;
            }
        });
        Component.prototype[viewInsertSymbol] = function (viewData) {
            if (this._torndown) {
                this.setup.apply(this, this._initialArgs);
            }
            viewData.nodeList.newDeepChildren.push(this.nodeList);
            return this.element;
        };
        module.exports = namespace.Component = Component;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*pto-tracker@0.1.0#models/api-info*/
define('pto-tracker@0.1.0#models/api-info', [
    'exports',
    'can-define@2.7.5#map/map',
    'can@5.21.4#enable-can-debug',
    'can-component@4.4.11#can-component'
], function (exports, _map) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var _map2 = _interopRequireDefault(_map);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
    var APIInfo = _map2.default.extend('APIInfo', {
        get isValid() {
            return this.token && this.url ? this.url.includes('freshbooks') || this.url.includes('billingarm') : false;
        },
        token: 'string',
        url: 'string'
    });
    exports.default = APIInfo;
});
/*can-view-import@4.2.1#can-view-import*/
define('can-view-import@4.2.1#can-view-import', [
    'require',
    'exports',
    'module',
    'can-assign',
    'can-dom-data-state',
    'can-symbol',
    'can-globals/document/document',
    'can-child-nodes',
    'can-import-module',
    'can-dom-mutate',
    'can-dom-mutate/node',
    'can-view-nodelist',
    'can-view-callbacks',
    'can-log/',
    'can-log/dev/dev'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var assign = require('can-assign');
        var canData = require('can-dom-data-state');
        var canSymbol = require('can-symbol');
        var DOCUMENT = require('can-globals/document/document');
        var getChildNodes = require('can-child-nodes');
        var importer = require('can-import-module');
        var domMutate = require('can-dom-mutate');
        var domMutateNode = require('can-dom-mutate/node');
        var nodeLists = require('can-view-nodelist');
        var viewCallbacks = require('can-view-callbacks');
        var tag = viewCallbacks.tag;
        var canLog = require('can-log/');
        var dev = require('can-log/dev/dev');
        function setViewModel(element, viewModel) {
            element[canSymbol.for('can.viewModel')] = viewModel;
        }
        function processImport(el, tagData) {
            var moduleName = el.getAttribute('from');
            var templateModule = tagData.scope.get('scope.helpers.module');
            var parentName = templateModule ? templateModule.id : undefined;
            if (!moduleName) {
                return Promise.reject('No module name provided');
            }
            var importPromise = importer(moduleName, parentName);
            importPromise.catch(function (err) {
                canLog.error(err);
            });
            setViewModel(el, importPromise);
            canData.set.call(el, 'scope', importPromise);
            var scope = tagData.scope.add(importPromise, { notContext: true });
            var handOffTag = el.getAttribute('can-tag');
            if (handOffTag) {
                var callback = tag(handOffTag);
                if (!callback || callback === viewCallbacks.defaultCallback) {
                } else {
                    canData.set.call(el, 'preventDataBindings', true);
                    callback(el, assign(tagData, { scope: scope }));
                    canData.set.call(el, 'preventDataBindings', false);
                    setViewModel(el, importPromise);
                    canData.set.call(el, 'scope', importPromise);
                }
            } else {
                var nodeList = nodeLists.register([], undefined, tagData.parentNodeList || true, false);
                nodeList.expression = '<' + this.tagName + '>';
                var frag = tagData.subtemplate ? tagData.subtemplate(scope, tagData.options, nodeList) : DOCUMENT().createDocumentFragment();
                var removalDisposal = domMutate.onNodeRemoval(el, function () {
                    var doc = el.ownerDocument;
                    var ownerNode = doc.contains ? doc : doc.documentElement;
                    if (!ownerNode || ownerNode.contains(el) === false) {
                        removalDisposal();
                        nodeLists.unregister(nodeList);
                    }
                });
                domMutateNode.appendChild.call(el, frag);
                nodeLists.update(nodeList, getChildNodes(el));
            }
        }
        [
            'can-import',
            'can-dynamic-import'
        ].forEach(function (tagName) {
            tag(tagName, processImport.bind({ tagName: tagName }));
        });
    }(function () {
        return this;
    }(), require, exports, module));
});
/*steal-stache@4.1.2#add-bundles*/
define('steal-stache@4.1.2#add-bundles', [], function(){ return {}; });
/*steal-config-utils@1.0.0#import-specifiers*/
define('steal-config-utils@1.0.0#import-specifiers', [], function(){ return {}; });
/*steal-stache@4.1.2#steal-stache*/
define('steal-stache@4.1.2#steal-stache', [], function(){ return {}; });
/*pto-tracker@0.1.0#components/loading/loading.stache!steal-stache@4.1.2#steal-stache*/
define('pto-tracker@0.1.0#components/loading/loading.stache!steal-stache@4.1.2#steal-stache', [
    'module',
    'can-stache',
    'can-stache/src/mustache_core',
    'can-view-import@4.2.1#can-view-import',
    'can-stache-bindings@4.8.0#can-stache-bindings'
], function (module, stache, mustacheCore) {
    var renderer = stache('components/loading/loading.stache', [
        {
            'tokenType': 'start',
            'args': [
                'div',
                false,
                1
            ]
        },
        {
            'tokenType': 'attrStart',
            'args': [
                'class',
                1
            ]
        },
        {
            'tokenType': 'attrValue',
            'args': [
                'loading',
                1
            ]
        },
        {
            'tokenType': 'attrEnd',
            'args': [
                'class',
                1
            ]
        },
        {
            'tokenType': 'end',
            'args': [
                'div',
                false,
                1
            ]
        },
        {
            'tokenType': 'close',
            'args': [
                'div',
                1
            ]
        },
        {
            'tokenType': 'done',
            'args': [1]
        }
    ]);
    return function (scope, options, nodeList) {
        var moduleOptions = Object.assign({}, options);
        if (moduleOptions.helpers) {
            moduleOptions.helpers = Object.assign({ module: module }, moduleOptions.helpers);
        } else {
            moduleOptions.module = module;
        }
        return renderer(scope, moduleOptions, nodeList);
    };
});
/*pto-tracker@0.1.0#components/loading/loading*/
define('pto-tracker@0.1.0#components/loading/loading', [
    'pto-tracker@0.1.0#components/loading/loading.stache!steal-stache@4.1.2#steal-stache',
    'can-component@4.4.11#can-component',
    'can@5.21.4#enable-can-debug',
    'can-define@2.7.5#map/map'
], function (_loadingStacheStealStache, _canComponent) {
    'use strict';
    var _loadingStacheStealStache2 = _interopRequireDefault(_loadingStacheStealStache);
    var _canComponent2 = _interopRequireDefault(_canComponent);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
    _canComponent2.default.extend({
        tag: 'pto-loading',
        view: _loadingStacheStealStache2.default,
        ViewModel: {}
    });
});
/*pto-tracker@0.1.0#app.stache!steal-stache@4.1.2#steal-stache*/
define('pto-tracker@0.1.0#app.stache!steal-stache@4.1.2#steal-stache', [
    'module',
    'can-stache',
    'can-stache/src/mustache_core',
    'can-view-import@4.2.1#can-view-import',
    'can-stache-bindings@4.8.0#can-stache-bindings',
    '~/components/loading/'
], function (module, stache, mustacheCore) {
    var renderer = stache('app.stache', [
        {
            'tokenType': 'start',
            'args': [
                'can-import',
                true,
                1
            ]
        },
        {
            'tokenType': 'attrStart',
            'args': [
                'from',
                1
            ]
        },
        {
            'tokenType': 'attrValue',
            'args': [
                '~/components/loading/',
                1
            ]
        },
        {
            'tokenType': 'attrEnd',
            'args': [
                'from',
                1
            ]
        },
        {
            'tokenType': 'end',
            'args': [
                'can-import',
                true,
                1
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                ' ',
                1
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                '#if(isAuthenticated)',
                1
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n  ',
                1
            ]
        },
        {
            'tokenType': 'start',
            'args': [
                'can-import',
                false,
                2
            ]
        },
        {
            'tokenType': 'attrStart',
            'args': [
                'from',
                2
            ]
        },
        {
            'tokenType': 'attrValue',
            'args': [
                '~/components/dashboard/',
                2
            ]
        },
        {
            'tokenType': 'attrEnd',
            'args': [
                'from',
                2
            ]
        },
        {
            'tokenType': 'end',
            'args': [
                'can-import',
                false,
                2
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n    ',
                2
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                '#if(isPending)',
                3
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n      ',
                3
            ]
        },
        {
            'tokenType': 'start',
            'args': [
                'pto-loading',
                true,
                4
            ]
        },
        {
            'tokenType': 'end',
            'args': [
                'pto-loading',
                true,
                4
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n    ',
                4
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                'else',
                5
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n      ',
                5
            ]
        },
        {
            'tokenType': 'start',
            'args': [
                'pto-dashboard',
                true,
                6
            ]
        },
        {
            'tokenType': 'attrStart',
            'args': [
                'api:u:info:from',
                6
            ]
        },
        {
            'tokenType': 'attrValue',
            'args': [
                'apiInfo',
                6
            ]
        },
        {
            'tokenType': 'attrEnd',
            'args': [
                'api:u:info:from',
                6
            ]
        },
        {
            'tokenType': 'end',
            'args': [
                'pto-dashboard',
                true,
                6
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n    ',
                6
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                '/if',
                7
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n  ',
                7
            ]
        },
        {
            'tokenType': 'close',
            'args': [
                'can-import',
                8
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n',
                8
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                'else',
                9
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n  ',
                9
            ]
        },
        {
            'tokenType': 'start',
            'args': [
                'can-import',
                false,
                10
            ]
        },
        {
            'tokenType': 'attrStart',
            'args': [
                'from',
                10
            ]
        },
        {
            'tokenType': 'attrValue',
            'args': [
                '~/components/authenticate/',
                10
            ]
        },
        {
            'tokenType': 'attrEnd',
            'args': [
                'from',
                10
            ]
        },
        {
            'tokenType': 'end',
            'args': [
                'can-import',
                false,
                10
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n    ',
                10
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                '#if(isPending)',
                11
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n      ',
                11
            ]
        },
        {
            'tokenType': 'start',
            'args': [
                'pto-loading',
                true,
                12
            ]
        },
        {
            'tokenType': 'end',
            'args': [
                'pto-loading',
                true,
                12
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n    ',
                12
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                'else',
                13
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n      ',
                13
            ]
        },
        {
            'tokenType': 'start',
            'args': [
                'pto-authenticate',
                true,
                14
            ]
        },
        {
            'tokenType': 'attrStart',
            'args': [
                'api:u:info:from',
                14
            ]
        },
        {
            'tokenType': 'attrValue',
            'args': [
                'apiInfo',
                14
            ]
        },
        {
            'tokenType': 'attrEnd',
            'args': [
                'api:u:info:from',
                14
            ]
        },
        {
            'tokenType': 'end',
            'args': [
                'pto-authenticate',
                true,
                14
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n    ',
                14
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                '/if',
                15
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n  ',
                15
            ]
        },
        {
            'tokenType': 'close',
            'args': [
                'can-import',
                16
            ]
        },
        {
            'tokenType': 'chars',
            'args': [
                '\n',
                16
            ]
        },
        {
            'tokenType': 'special',
            'args': [
                '/if',
                17
            ]
        },
        {
            'tokenType': 'done',
            'args': [17]
        }
    ]);
    return function (scope, options, nodeList) {
        var moduleOptions = Object.assign({}, options);
        if (moduleOptions.helpers) {
            moduleOptions.helpers = Object.assign({ module: module }, moduleOptions.helpers);
        } else {
            moduleOptions.module = module;
        }
        return renderer(scope, moduleOptions, nodeList);
    };
});
/*steal-css@1.3.2#css*/
define('steal-css@1.3.2#css', [
    'require',
    'exports',
    'module',
    '@loader',
    '@steal'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        var loader = require('@loader');
        var steal = require('@steal');
        var isNode = typeof process === 'object' && {}.toString.call(process) === '[object process]';
        var importRegEx = /@import [^uU]['"]?([^'"\)]*)['"]?/g;
        var resourceRegEx = /url\(['"]?([^'"\)]*)['"]?\)/g;
        var waitSeconds = loader.cssOptions && loader.cssOptions.timeout ? parseInt(loader.cssOptions.timeout, 10) : 60;
        var onloadCss = function (link, cb) {
            var styleSheets = getDocument().styleSheets, i = styleSheets.length;
            while (i--) {
                if (styleSheets[i].href === link.href) {
                    return cb();
                }
            }
            setTimeout(function () {
                onloadCss(link, cb);
            });
        };
        function isIE9() {
            var doc = getDocument();
            return doc && !!Function('/*@cc_on return (/^9/.test(@_jscript_version) && /MSIE 9.0(?!.*IEMobile)/i.test(navigator.userAgent)); @*/')();
        }
        function getDocument() {
            if (typeof doneSsr !== 'undefined' && doneSsr.globalDocument) {
                return doneSsr.globalDocument;
            }
            if (typeof document !== 'undefined') {
                return document;
            }
            throw new Error('Unable to load CSS in an environment without a document.');
        }
        function getHead() {
            var doc = getDocument();
            var head = doc.head || doc.getElementsByTagName('head')[0];
            if (!head) {
                var docEl = doc.documentElement || doc;
                head = doc.createElement('head');
                docEl.insertBefore(head, docEl.firstChild);
            }
            return head;
        }
        function CSSModule(load, loader) {
            if (typeof load === 'object') {
                this.load = load;
                this.loader = loader;
                this.address = this.load.address;
                this.source = this.load.source;
            } else {
                this.address = load;
                this.source = loader;
            }
        }
        CSSModule.cssCount = 0;
        CSSModule.ie9MaxStyleSheets = 31;
        CSSModule.currentStyleSheet = null;
        CSSModule.prototype = {
            injectLink: function () {
                if (this._loaded) {
                    return this._loaded;
                }
                if (this.linkExists()) {
                    this._loaded = Promise.resolve('');
                    return this._loaded;
                }
                var doc = getDocument();
                var link = this.link = doc.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = this.address;
                this._loaded = new Promise(function (resolve, reject) {
                    var timeout = setTimeout(function () {
                        reject('Unable to load CSS');
                    }, waitSeconds * 1000);
                    var loadCB = function (event) {
                        clearTimeout(timeout);
                        link.removeEventListener('load', loadCB);
                        link.removeEventListener('error', loadCB);
                        if (event && event.type === 'error') {
                            reject('Unable to load CSS');
                        } else {
                            resolve('');
                        }
                    };
                    if ('isApplicationInstalled' in navigator || !link.addEventListener) {
                        onloadCss(link, loadCB);
                    } else if (navigator.noUI) {
                        loadCB();
                    } else {
                        link.addEventListener('load', loadCB);
                        link.addEventListener('error', loadCB);
                    }
                    getHead().appendChild(link);
                });
                return this._loaded;
            },
            injectStyle: function () {
                var doc = getDocument();
                var head = getHead();
                var style = this.style = doc.createElement('style');
                style.type = 'text/css';
                if (style.sheet) {
                    style.sheet.cssText = this.source;
                } else if (style.styleSheet) {
                    style.styleSheet.cssText = this.source;
                } else {
                    style.appendChild(doc.createTextNode(this.source));
                }
                head.appendChild(style);
            },
            ie9StyleSheetLimitHack: function () {
                var doc = getDocument();
                if (!CSSModule.cssCount) {
                    CSSModule.currentStyleSheet = doc.createStyleSheet();
                }
                CSSModule.cssCount += 1;
                CSSModule.currentStyleSheet.cssText += this.source;
                if (CSSModule.cssCount === CSSModule.ie9MaxStyleSheets) {
                    CSSModule.cssCount = 0;
                }
            },
            updateURLs: function () {
                var rawSource = this.source, address = this.address;
                this.source = rawSource.replace(importRegEx, function (whole, part) {
                    if (isNode) {
                        return '@import url(' + part + ')';
                    } else {
                        return '@import url(' + steal.joinURIs(address, part) + ')';
                    }
                });
                if (!loader.isEnv('build')) {
                    this.source = this.source + '/*# sourceURL=' + address + ' */';
                    this.source = this.source.replace(resourceRegEx, function (whole, part) {
                        return 'url(' + steal.joinURIs(address, part) + ')';
                    });
                }
                return this.source;
            },
            getExistingNode: function () {
                var doc = getDocument();
                var selector = '[href=\'' + this.address + '\']';
                return doc.querySelector && doc.querySelector(selector);
            },
            linkExists: function () {
                var styleSheets = getDocument().styleSheets;
                for (var i = 0; i < styleSheets.length; ++i) {
                    if (this.address === styleSheets[i].href) {
                        return true;
                    }
                }
                return false;
            },
            setupLiveReload: function (loader, name) {
                var head = getHead();
                var css = this;
                if (loader.liveReloadInstalled) {
                    var cssReload = loader['import']('live-reload', { name: module.id });
                    Promise.resolve(cssReload).then(function (reload) {
                        loader['import'](name).then(function () {
                            reload.once('!dispose/' + name, function () {
                                css.style.__isDirty = true;
                                reload.once('!cycleComplete', function () {
                                    head.removeChild(css.style);
                                });
                            });
                        });
                    });
                }
            }
        };
        if (loader.isEnv('production')) {
            exports.fetch = function (load) {
                var css = new CSSModule(load.address);
                return css.injectLink();
            };
        } else {
            exports.instantiate = function (load) {
                var loader = this;
                var css = new CSSModule(load.address, load.source);
                load.source = css.updateURLs();
                load.metadata.deps = [];
                load.metadata.format = 'css';
                load.metadata.execute = function () {
                    if (getDocument()) {
                        if (isIE9()) {
                            css.ie9StyleSheetLimitHack();
                        } else {
                            css.injectStyle();
                        }
                        css.setupLiveReload(loader, load.name);
                    }
                    return loader.newModule({ source: css.source });
                };
            };
        }
        exports.CSSModule = CSSModule;
        exports.getDocument = getDocument;
        exports.getHead = getHead;
        exports.locateScheme = true;
        exports.buildType = 'css';
        exports.includeInBuild = true;
        exports.pluginBuilder = 'steal-css/slim';
    }(function () {
        return this;
    }(), require, exports, module));
});
/*@node-require/steal-less@1.3.4#less-engine-node*/
define('@node-require/steal-less@1.3.4#less-engine-node', [], function(){ return {}; });
/*steal-less@1.3.4#less-engine-node*/
define('steal-less@1.3.4#less-engine-node', [], function(){ return {}; });
/*steal-less@1.3.4#less*/
define('steal-less@1.3.4#less', [], function(){ return {}; });
/*pto-tracker@0.1.0#app*/
define('pto-tracker@0.1.0#app', [
    'pto-tracker@0.1.0#models/api-info',
    'pto-tracker@0.1.0#app.stache!steal-stache@4.1.2#steal-stache',
    'can-component@4.4.11#can-component',
    'styles.less!steal-less@1.3.4#less',
    'can@5.21.4#enable-can-debug',
    'can-debug@2.0.5#can-debug',
    'can-namespace@1.0.0#can-namespace',
    'can-globals@1.2.1#can-globals',
    'can-globals@1.2.1#can-globals-instance',
    'can-globals@1.2.1#can-globals-proto',
    'can-reflect@1.17.9#can-reflect',
    'can-reflect@1.17.9#reflections/call/call',
    'can-symbol@1.6.4#can-symbol',
    'can-reflect@1.17.9#reflections/type/type',
    'can-reflect@1.17.9#reflections/helpers',
    'can-reflect@1.17.9#reflections/get-set/get-set',
    'can-reflect@1.17.9#reflections/observe/observe',
    'can-reflect@1.17.9#reflections/shape/shape',
    'can-reflect@1.17.9#reflections/shape/schema/schema',
    'can-reflect@1.17.9#reflections/get-name/get-name',
    'can-reflect@1.17.9#types/map',
    'can-reflect@1.17.9#types/set',
    'can-globals@1.2.1#global/global',
    'can-globals@1.2.1#document/document',
    'can-globals@1.2.1#location/location',
    'can-globals@1.2.1#mutation-observer/mutation-observer',
    'can-globals@1.2.1#is-browser-window/is-browser-window',
    'can-globals@1.2.1#is-node/is-node',
    'can-globals@1.2.1#custom-elements/custom-elements',
    'can-debug@2.0.5#src/proxy-namespace',
    'can-debug@2.0.5#src/temporarily-bind',
    'can-debug@2.0.5#src/get-graph/get-graph',
    'can-debug@2.0.5#src/graph/graph',
    'can-assign@1.3.1#can-assign',
    'can-debug@2.0.5#src/get-graph/make-node',
    'can-reflect-dependencies@1.1.1#can-reflect-dependencies',
    'can-reflect-dependencies@1.1.1#src/add-mutated-by',
    'can-reflect-dependencies@1.1.1#src/delete-mutated-by',
    'can-reflect-dependencies@1.1.1#src/get-dependency-data-of',
    'can-reflect-dependencies@1.1.1#src/is-function',
    'can-debug@2.0.5#src/format-graph/format-graph',
    'can-debug@2.0.5#src/what-i-change/what-i-change',
    'can-debug@2.0.5#src/log-data/log-data',
    'can-debug@2.0.5#src/get-data/get-data',
    'can-debug@2.0.5#src/label-cycles/label-cycles',
    'can-debug@2.0.5#src/what-changes-me/what-changes-me',
    'can-debug@2.0.5#src/get-what-i-change/get-what-i-change',
    'can-debug@2.0.5#src/get-what-changes-me/get-what-changes-me',
    'can-queues@1.2.1#can-queues',
    'can-log@1.0.0#dev/dev',
    'can-log@1.0.0#can-log',
    'can-queues@1.2.1#queue',
    'can-queues@1.2.1#queue-state',
    'can-queues@1.2.1#priority-queue',
    'can-queues@1.2.1#completion-queue',
    'can-diff@1.4.4#merge-deep/merge-deep',
    'can-diff@1.4.4#list/list',
    'can-define@2.7.5#map/map',
    'can-construct@3.5.3#can-construct',
    'can-string@1.0.0#can-string',
    'can-define@2.7.5#can-define',
    'can-observation@4.1.2#can-observation',
    'can-observation-recorder@1.3.0#can-observation-recorder',
    'can-event-queue@1.1.4#value/value',
    'can-key-tree@1.2.0#can-key-tree',
    'can-define-lazy-value@1.1.0#define-lazy-value',
    'can-event-queue@1.1.4#dependency-record/merge',
    'can-observation@4.1.2#recorder-dependency-helpers',
    'can-observation@4.1.2#temporarily-bind',
    'can-simple-observable@2.4.1#async/async',
    'can-simple-observable@2.4.1#can-simple-observable',
    'can-simple-observable@2.4.1#log',
    'can-simple-observable@2.4.1#settable/settable',
    'can-simple-observable@2.4.1#resolver/resolver',
    'can-event-queue@1.1.4#map/map',
    'can-dom-events@1.3.3#can-dom-events',
    'can-dom-events@1.3.3#helpers/util',
    'can-dom-events@1.3.3#helpers/make-event-registry',
    'can-dom-events@1.3.3#helpers/-make-delegate-event-tree',
    'can-event-queue@1.1.4#type/type',
    'can-string-to-any@1.2.0#can-string-to-any',
    'can-data-types@1.2.0#maybe-boolean/maybe-boolean',
    'can-data-types@1.2.0#maybe-date/maybe-date',
    'can-data-types@1.2.0#maybe-number/maybe-number',
    'can-data-types@1.2.0#maybe-string/maybe-string',
    'can-define@2.7.5#define-helpers/define-helpers',
    'can-define@2.7.5#ensure-meta',
    'can-component@4.4.11#control/control',
    'can-control@4.4.1#can-control',
    'can-stache-key@1.4.0#can-stache-key',
    'can-reflect-promise@2.2.0#can-reflect-promise',
    'can-key@1.2.0#get/get',
    'can-key@1.2.0#utils',
    'can-dom-mutate@1.3.6#can-dom-mutate',
    'can-dom-mutate@1.3.6#-util',
    'can-bind@1.3.0#can-bind',
    'can-stache@4.17.5#can-stache',
    'can-view-parser@4.1.2#can-view-parser',
    'can-attribute-encoder@1.1.2#can-attribute-encoder',
    'can-view-callbacks@4.3.6#can-view-callbacks',
    'can-dom-mutate@1.3.6#node',
    'can-dom-mutate@1.3.6#node/node',
    'can-view-nodelist@4.3.3#can-view-nodelist',
    'can-fragment@1.3.0#can-fragment',
    'can-child-nodes@1.2.0#can-child-nodes',
    'can-stache@4.17.5#src/html_section',
    'can-view-target@4.1.2#can-view-target',
    'can-stache@4.17.5#src/utils',
    'can-view-scope@4.13.0#can-view-scope',
    'can-view-scope@4.13.0#template-context',
    'can-simple-map@4.3.0#can-simple-map',
    'can-view-scope@4.13.0#compute_data',
    'can-view-scope@4.13.0#scope-key-data',
    'can-view-scope@4.13.0#make-compute-like',
    'can-single-reference@1.2.0#can-single-reference',
    'can-cid@1.3.0#can-cid',
    'can-stache-helpers@1.2.0#can-stache-helpers',
    'can-stache@4.17.5#src/key-observable',
    'can-stache@4.17.5#src/text_section',
    'can-view-live@4.2.7#can-view-live',
    'can-view-live@4.2.7#lib/core',
    'can-view-live@4.2.7#lib/attr',
    'can-attribute-observable@1.2.1#behaviors',
    'can-dom-data-state@1.0.5#can-dom-data-state',
    'can-view-live@4.2.7#lib/attrs',
    'can-view-live@4.2.7#lib/html',
    'can-view-live@4.2.7#lib/list',
    'can-view-live@4.2.7#lib/set-observable',
    'can-diff@1.4.4#patcher/patcher',
    'can-view-live@4.2.7#lib/text',
    'can-stache@4.17.5#src/mustache_core',
    'can-stache@4.17.5#src/expression',
    'can-stache@4.17.5#expressions/arg',
    'can-stache@4.17.5#expressions/literal',
    'can-stache@4.17.5#expressions/hashes',
    'can-stache@4.17.5#src/expression-helpers',
    'can-simple-observable@2.4.1#setter/setter',
    'can-stache@4.17.5#expressions/bracket',
    'can-stache@4.17.5#expressions/call',
    'can-stache@4.17.5#src/set-identifier',
    'can-stache@4.17.5#expressions/helper',
    'can-stache@4.17.5#expressions/lookup',
    'can-stache@4.17.5#helpers/core',
    'can-globals@1.2.1#base-url/base-url',
    'can-join-uris@1.2.0#can-join-uris',
    'can-parse-uri@1.2.0#can-parse-uri',
    'can-stache@4.17.5#helpers/-debugger',
    'can-stache@4.17.5#src/truthy-observable',
    'can-stache@4.17.5#helpers/converter',
    'can-dom-data@1.0.1#can-dom-data',
    'can-stache@4.17.5#helpers/-for-of',
    'can-stache@4.17.5#helpers/-let',
    'can-stache@4.17.5#helpers/-portal',
    'can-stache-ast@1.1.0#can-stache-ast',
    'can-stache-ast@1.1.0#controls',
    'can-import-module@1.2.0#can-import-module',
    'can-stache-bindings@4.8.0#can-stache-bindings',
    'can-view-model@4.0.1#can-view-model',
    'can-attribute-observable@1.2.1#can-attribute-observable',
    'can-attribute-observable@1.2.1#event',
    'can-attribute-observable@1.2.1#get-event-name',
    'can-event-dom-radiochange@2.2.0#can-event-dom-radiochange',
    'can-define@2.7.5#list/list',
    'can-view-import@4.2.1#can-view-import',
    'pto-tracker@0.1.0#components/loading/loading',
    'pto-tracker@0.1.0#components/loading/loading.stache!steal-stache@4.1.2#steal-stache'
], function (_apiInfo, _ptoTracker010AppStacheStealStache, _canComponent) {
    'use strict';
    var _apiInfo2 = _interopRequireDefault(_apiInfo);
    var _ptoTracker010AppStacheStealStache2 = _interopRequireDefault(_ptoTracker010AppStacheStealStache);
    var _canComponent2 = _interopRequireDefault(_canComponent);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
    _canComponent2.default.extend({
        tag: 'pto-tracker',
        view: _ptoTracker010AppStacheStealStache2.default,
        ViewModel: {
            get isAuthenticated() {
                return this.apiInfo.isValid;
            },
            apiInfo: {
                default: function _default() {
                    return new _apiInfo2.default({});
                }
            }
        }
    });
});