

# customization-resolver-webpack-plugin
[![NPM version][npm-image]][npm-url]
[![Codecov Status][codecov-image]][codecov-url]

> Makes file imported by relative path overridable from within customization folder

## Install

This is for webpack 2.x, for webpack 1.x see
[this version](https://github.com/hoschi/customization-resolver-webpack-plugin/tree/v1.0.1  ).

```sh
npm install --save-dev customization-resolver-webpack-plugin
```

## Usage with webpack

```js
import path from 'path';
import CustomizationResolverPlugin from 'customization-resolver-webpack-plugin';

let dir_base = path.resolve(__dirname, '../');
let dir_customize = path.resolve(dir_base, '../../customizedSrc/');
let dir_src = path.resolve(dir_base, 'src/');

let webpackConfig = {
    entry:'...',
    target:'web',
    // other webpack config stuff
    resolve: {
        modules: [
            dir_customize,
            dir_src,
        ],
        plugins: [
            new CustomizationResolverPlugin({
                customizationDir: dir_customize,
                sourceDir: dir_src
            })
        ],
    },
}
```

## Configuration

* `sourceDir` *required* String: absolute path to source directory, containing files which can be overriden
* `customizationDir` *required* String: absolute path to customization directory, containing files which can override source files
* `excludePath` String/RegEx: RegEx which matches `path` property of request object which should not be resolved, defaults to 'node_modules'
* `excludeRequest` String/RegEx: RegEx which matches `request` property of request object which should not be resolved, defaults to 'node_modules'
* `jsFileExtension` String: JS file extension (with dot) which gets added to file names without file extension, defaults to '.js'
* `isCompleteFileName` String/RegEx: RegEx which matches `request` property of request object to identify filenames with a valid extension. E.g. `/\.scss$/` to match SCSS files.

## Run with debug output

Say you start your bundling process with `webpack ./app.js`. Use
`NODE_DEBUG=customization-resolver-webpack-plugin webpack ./app.js` to see
debug output of this plugin.

## License

 MIT ©

[npm-url]: https://npmjs.org/package/customization-resolver-webpack-plugin
[npm-image]: https://img.shields.io/npm/v/customization-resolver-webpack-plugin.svg?style=flat

[codecov-url]: https://codecov.io/github/hoschi/customization-resolver-webpack-plugin
[codecov-image]: https://img.shields.io/codecov/c/github/hoschi/customization-resolver-webpack-plugin.svg?style=flat

[download-image]: http://img.shields.io/npm/dm/customization-resolver-webpack-plugin.svg?style=flat
