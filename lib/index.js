const logger = require('oniyi-logger')('customization-resolver-webpack-plugin');
const R = require('ramda');

const log = logger.debug.bind(logger);
const formatRequest = R.omit([
    '__innerRequest_request',
    '__innerRequest_relativePath',
    '__innerRequest',
    'descriptionFileData',
]);

function CustomizationResolverPlugin (config) {
    let {customizationDir, sourceDir, excludePath, excludeRequest, isCompleteFileName, jsFileExtension} = config;
    this.customizationDir = customizationDir;
    this.sourceDir = sourceDir;
    this.excludePath = excludePath || 'node_modules';
    this.excludeRequest = excludeRequest || 'node_modules';
    this.isCompleteFileName = isCompleteFileName;
    this.jsFileExtension = jsFileExtension || '.js';
}

CustomizationResolverPlugin.prototype.apply = function apply (resolver) {
    const customizationDir = this.customizationDir;
    const sourceDir = this.sourceDir;
    const excludePath = this.excludePath;
    const excludeRequest = this.excludeRequest;
    const isCompleteFileName = this.isCompleteFileName;
    const jsFileExtension = this.jsFileExtension;
    log(customizationDir, sourceDir);
    resolver.plugin('before-new-resolve', function resolverPlugin (request, finalCallback) {
        if (!request.request.startsWith('./') ||
            request.path.match(excludePath) ||
            request.request.match(excludeRequest)
        ) {
            return finalCallback();
        }

        let subDir, newPath, newFile;
        const fs = this.fileSystem;
        const resolve = (customizedPath, resolutionMsg) => {
            log('injected path', resolutionMsg, customizedPath);
            let result = Object.assign({}, request, {
                path: customizedPath,
            });
            // we skip 'new-resolve' so we must do the work of this step: parse
            // request.request and add it to request. This seems the only way
            // to do the resolution without get caught in a infinite loop.
            let parsed = resolver.parse(result.request);
            let parsedResult = Object.assign({}, result, parsed);
            return this.doResolve('parsed-resolve', parsedResult, `found file: ${resolutionMsg}`, finalCallback);
        };
        const getFile = (path, fileName) => {
            if (isCompleteFileName && fileName.match(isCompleteFileName)) {
                return this.join(path, fileName);
            }
            return `${this.join(path, fileName)}${jsFileExtension}`;
        };

        if (request.path.startsWith(sourceDir)) {
            subDir = request.path.substring(sourceDir.length + 1);
        } else if (request.path.startsWith(customizationDir)) {
            subDir = request.path.substring(customizationDir.length + 1);
        } else {
            return finalCallback();
        }
        log('-----------------------');
        log('formatted request', formatRequest(request));
        log('subdir', subDir);

        // look in customization dir first
        newPath = this.join(customizationDir, subDir);
        newFile = getFile(newPath, request.request);
        log('newPath', newPath);
        log('try customization', newFile);
        fs.stat(newFile, (err, stat) => {
            if (!err && stat && stat.isFile()) {
                // found, use it
                log('resolving customized file', newFile);
                return resolve(newPath, 'customized file');
            }

            // try with source dir location next
            newPath = this.join(sourceDir, subDir);
            newFile = getFile(newPath, request.request);
            log('try source', newFile);
            fs.stat(newFile, (err, stat) => {
                if (!err && stat && stat.isFile()) {
                    // found, use it
                    log('resolving source file', newFile);
                    return resolve(newPath, 'source file');
                }
                // nothing worked, lets other plugins try
                log('nothing found', request.path, request.request);
                return finalCallback();
            });
            return null;
        });
        return null;
    });
};

module.exports = CustomizationResolverPlugin;
