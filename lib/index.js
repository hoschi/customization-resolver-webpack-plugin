function CustomizationResolverPlugin ({customizationDir, sourceDir, excludePath, excludeRequest}) {
    this.customizationDir = customizationDir;
    this.sourceDir = sourceDir;
    this.excludePath = excludePath || 'node_modules';
    this.excludeRequest = excludeRequest || 'node_modules';
}

CustomizationResolverPlugin.prototype.apply = function (resolver) {
    let customizationDir = this.customizationDir;
    let sourceDir = this.sourceDir;
    let excludePath = this.excludePath;
    let excludeRequest = this.excludeRequest;
    console.log(customizationDir, sourceDir);
    resolver.plugin('file', function (request, finalCallback) {
        // FIXME remove test cases
        if ( //!request.request.match(/^\.\/mockMediaCard\.scss/) ||
            //!request.request.match(/^\.\/BrandLogo$/) ||
            //!request.request.match(/^\.\/CardSimpleState$/) ||
            !request.request.startsWith('./') ||
            request.path.match(excludePath) ||
            request.request.match(excludeRequest)
        ) {
            return finalCallback()
        }

        let subDir, newPath, newFile;
        let fs = this.fileSystem;
        // FIXME make configurable
        let isCompleteFileName = (file) => !!file.match(/\.scss$/)
        let resolve = (newPath, newFile) => {
            // FIXME replace with "debug" npm package
            console.log("resolving result", newFile);
            return this.doResolve("result", {
                path: newFile,
                query: request.query,
                file: true,
                resolved: true
            }, finalCallback);
        }
        let getFile = (newPath, fileName) => {
            if (isCompleteFileName(fileName)) {
                return this.join(newPath, fileName);
            } else {
                // FIXME make configurable, with '.js' as default
                return this.join(newPath, fileName) + '.js';
            }
        }

        console.log("-----------------------");
        console.log(request);

        if (request.path.startsWith(sourceDir)) {
            subDir = request.path.substring(sourceDir.length + 1)
        } else if (request.path.startsWith(customizationDir)) {
            subDir = request.path.substring(customizationDir.length + 1)
        } else {
            return finalCallback();
        }
        console.log('subdir', subDir);

        // look in customization dir first
        newPath = this.join(customizationDir, subDir)
        newFile = getFile(newPath, request.request)
        console.log('newPath', newPath);
        console.log("try customization", newFile);
        fs.stat(newFile, (err, stat) => {
            if (!err && stat && stat.isFile()) {
                // found, use it
                return resolve(newPath, newFile);
            }

            // try with source dir location next
            newPath = this.join(sourceDir, subDir)
            newFile = getFile(newPath, request.request)
            console.log("try source", newFile);
            fs.stat(newFile, (err, stat) => {
                if (!err && stat && stat.isFile()) {
                    // found, use it
                    return resolve(newPath, newFile);
                }
                // nothing worked, lets other plugins try
                console.log("nothing found", request.path, request.request);
                return finalCallback();
            })
        })

    })
};

module.exports = CustomizationResolverPlugin
