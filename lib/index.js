const logger = require('oniyi-logger')('customization-resolver-webpack-plugin');

const log = logger.debug.bind(logger);

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
    resolver.plugin('file', function resolverPlugin (request, finalCallback) {
        if (!request.request.startsWith('./') ||
            request.path.match(excludePath) ||
            request.request.match(excludeRequest)
        ) {
            return finalCallback();
        }

        let subDir, newPath, newFile;
        const fs = this.fileSystem;
        const resolve = (file) => {
            log('resolving result', file);
            return this.doResolve('result', {
                path: file,
                query: request.query,
                file: true,
                resolved: true,
            }, finalCallback);
        };
        const getFile = (path, fileName) => {
            if (isCompleteFileName && fileName.match(isCompleteFileName)) {
                return this.join(path, fileName);
            }
            return `${this.join(path, fileName)}${jsFileExtension}`;
        };

        log('-----------------------');
        log(request);

        if (request.path.startsWith(sourceDir)) {
            subDir = request.path.substring(sourceDir.length + 1);
        } else if (request.path.startsWith(customizationDir)) {
            subDir = request.path.substring(customizationDir.length + 1);
        } else {
            return finalCallback();
        }
        log('subdir', subDir);

        // look in customization dir first
        newPath = this.join(customizationDir, subDir);
        newFile = getFile(newPath, request.request);
        log('newPath', newPath);
        log('try customization', newFile);
        fs.stat(newFile, (err, stat) => {
            if (!err && stat && stat.isFile()) {
                // found, use it
                return resolve(newFile);
            }

            // try with source dir location next
            newPath = this.join(sourceDir, subDir);
            newFile = getFile(newPath, request.request);
            log('try source', newFile);
            fs.stat(newFile, (err, stat) => {
                if (!err && stat && stat.isFile()) {
                    // found, use it
                    return resolve(newFile);
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
