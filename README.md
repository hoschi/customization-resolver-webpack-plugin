

# customization-resolver-webpack-plugin
[![NPM version][npm-image]][npm-url]
[![Codecov Status][codecov-image]][codecov-url]

> Makes file imported by relative path overridable from within customization folder

## Install

```sh
npm install --save-dev customization-resolver-webpack-plugin
```

## Usage with webpack 1.x

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
    plugins: [
        new webpack.ResolverPlugin([
            new CustomizationResolverPlugin({
                customizationDir: dir_customize,
                sourceDir: dir_src
            })
        ])
    ],
    resolve: {
        root: [
            dir_customize,
            dir_src,
        ],
    },
}
```

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
