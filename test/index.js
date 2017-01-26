import test from 'ava';
import sinon from 'sinon';
import path from 'path';
import Plugin from '../lib/index.js';

function getHandler (plugin, fileFakePaths = []) {
    let handler;
    let doResolve = sinon.spy();
    let fakeFsStat = (fileName, callback) => {
        if (fileFakePaths.includes(fileName)) {
            return callback(null, {
                isFile: () => true,
            });
        }
        return callback(new Error('no such file or directory'));
    };
    let fakeEnv = {
        join: path.join.bind(path),
        fileSystem: {
            stat: fakeFsStat,
        },
        doResolve,
    };
    let resolver = {
        plugin(type, handlerParam) {
            handler = handlerParam.bind(fakeEnv);
        },
    };

    plugin.apply(resolver);
    return {
        handler,
        doResolve,
    };
}

test('does\'t resolve absolute files', (t) => {
    let plugin = new Plugin({});
    let finalCallback = sinon.spy();
    let {handler} = getHandler(plugin);

    let request = {
        path: '/foo/bar',
        request: 'myFile.js',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 1);
    t.true(finalCallback.lastCall.args.length === 0, 'no error, no result');
});

test('does\'t resolve excluded path', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
        excludePath: 'foo',
    });
    let finalCallback = sinon.spy();
    let fileFakePaths = [
        '/repo/myProject/core/src/components/BigButton.js',
    ];
    let {handler, doResolve} = getHandler(plugin, fileFakePaths);

    request = {
        path: '/foo/bar',
        request: './myFile',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 1);
    t.true(finalCallback.lastCall.args.length === 0, 'no error, no result');
    finalCallback.reset();

    request = {
        path: '/repo/myProject/core/src/components',
        request: './BigButton',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 0);
    t.true(doResolve.callCount === 1, 'resolved because path is not excluded');
    t.true(doResolve.lastCall.args[0] === 'result', 'resolves as result, because it is an existing file');
    t.deepEqual(doResolve.lastCall.args[1], {
        path: fileFakePaths[0],
        query: undefined,
        file: true,
        resolved: true,
    }, 'resolved with object containing all necessary information');
});

test('does\'t resolve excluded request', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
        excludeRequest: 'my',
    });
    let finalCallback = sinon.spy();
    let fileFakePaths = [
        '/repo/myProject/core/src/components/BigButton.js',
    ];
    let {handler, doResolve} = getHandler(plugin, fileFakePaths);

    request = {
        path: '/repo/myProject/core/src/components',
        request: './myFile',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 1);
    t.true(finalCallback.lastCall.args.length === 0, 'no error, no result');
    finalCallback.reset();

    request = {
        path: '/repo/myProject/core/src/components',
        request: './BigButton',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 0);
    t.true(doResolve.callCount === 1, 'resolved because request is not excluded');
    t.true(doResolve.lastCall.args[0] === 'result', 'resolves as result, because it is an existing file');
    t.deepEqual(doResolve.lastCall.args[1], {
        path: fileFakePaths[0],
        query: undefined,
        file: true,
        resolved: true,
    }, 'resolved with object containing all necessary information');
});

test('does\'t resolve relative files which are not in source or customization directory', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
    });
    let finalCallback = sinon.spy();
    let {handler} = getHandler(plugin);

    request = {
        path: '/repo/MY_OTHER_PROJECT/core/src/components',
        request: './myFile',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 1);
    t.true(finalCallback.lastCall.args.length === 0, 'no error, no result');
});

test('does\'t resolve relative files which should be there but doesn\'t exist', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
    });
    let finalCallback = sinon.spy();
    let {handler} = getHandler(plugin);

    request = {
        path: '/repo/myProject/core/src/components',
        request: './BigButton',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 1);
    t.true(finalCallback.lastCall.args.length === 0, 'no error, no result');
});

test('resolves source file when not customized', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
    });
    let finalCallback = sinon.spy();
    let fileFakePaths = [
        '/repo/myProject/core/src/components/BigButton.js',
    ];
    let {handler, doResolve} = getHandler(plugin, fileFakePaths);

    request = {
        path: '/repo/myProject/core/src/components',
        query: '?foo=bar',
        request: './BigButton',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 0);
    t.true(doResolve.callCount === 1);
    t.true(doResolve.lastCall.args[0] === 'result', 'resolves as result, because it is an existing file');
    t.deepEqual(doResolve.lastCall.args[1], {
        path: '/repo/myProject/core/src/components/BigButton.js',
        query: request.query,
        file: true,
        resolved: true,
    }, 'resolved with source file, because no customization file exists');
});

test('resolves customized file', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
    });
    let finalCallback = sinon.spy();
    let fileFakePaths = [
        '/repo/myProject/customer0/frontend/components/BigButton.js',
    ];
    let {handler, doResolve} = getHandler(plugin, fileFakePaths);

    request = {
        path: '/repo/myProject/core/src/components',
        query: '?foo=bar',
        request: './BigButton',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 0);
    t.true(doResolve.callCount === 1);
    t.true(doResolve.lastCall.args[0] === 'result', 'resolves as result, because it is an existing file');
    t.deepEqual(doResolve.lastCall.args[1], {
        path: '/repo/myProject/customer0/frontend/components/BigButton.js',
        query: request.query,
        file: true,
        resolved: true,
    }, 'path changed from source to customization fiile');
});

test('resolve logic prefers customization file of source file', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
    });
    let finalCallback = sinon.spy();
    let fileFakePaths = [
        '/repo/myProject/customer0/frontend/components/BigButton.js',
        '/repo/myProject/core/src/components/BigButton.js',
    ];
    let {handler, doResolve} = getHandler(plugin, fileFakePaths);

    request = {
        path: '/repo/myProject/core/src/components',
        query: '?foo=bar',
        request: './BigButton',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 0);
    t.true(doResolve.callCount === 1);
    t.true(doResolve.lastCall.args[0] === 'result', 'resolves as result, because it is an existing file');
    t.deepEqual(doResolve.lastCall.args[1], {
        path: '/repo/myProject/customer0/frontend/components/BigButton.js',
        query: request.query,
        file: true,
        resolved: true,
    }, 'resolved with customized file and not source file');
});

test('resolves customized file when it was requested and it exists', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
    });
    let finalCallback = sinon.spy();
    let fileFakePaths = [
        '/repo/myProject/customer0/frontend/components/BigButton.js',
    ];
    let {handler, doResolve} = getHandler(plugin, fileFakePaths);

    request = {
        path: '/repo/myProject/customer0/frontend/components',
        query: '?foo=bar',
        request: './BigButton',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 0);
    t.true(doResolve.callCount === 1);
    t.true(doResolve.lastCall.args[0] === 'result', 'resolves as result, because it is an existing file');
    t.deepEqual(doResolve.lastCall.args[1], {
        path: '/repo/myProject/customer0/frontend/components/BigButton.js',
        query: request.query,
        file: true,
        resolved: true,
    }, 'resolved customized file');
});

test('resolves source file when customized one was requested and it doesn\'t exist', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
    });
    let finalCallback = sinon.spy();
    let fileFakePaths = [
        '/repo/myProject/core/src/components/BigButton.js',
    ];
    let {handler, doResolve} = getHandler(plugin, fileFakePaths);

    request = {
        path: '/repo/myProject/customer0/frontend/components',
        query: '?foo=bar',
        request: './BigButton',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 0);
    t.true(doResolve.callCount === 1);
    t.true(doResolve.lastCall.args[0] === 'result', 'resolves as result, because it is an existing file');
    t.deepEqual(doResolve.lastCall.args[1], {
        path: '/repo/myProject/core/src/components/BigButton.js',
        query: request.query,
        file: true,
        resolved: true,
    }, 'resolved customized file');
});

test('resolves source file with file ending', (t) => {
    let request;
    let plugin = new Plugin({
        customizationDir: '/repo/myProject/customer0/frontend',
        sourceDir: '/repo/myProject/core/src',
    });
    let finalCallback = sinon.spy();
    let fileFakePaths = [
        '/repo/myProject/core/src/components/bigButton.scss',
    ];
    let {handler, doResolve} = getHandler(plugin, fileFakePaths);

    request = {
        path: '/repo/myProject/core/src/components',
        query: '?foo=bar',
        request: './bigButton.scss',
    };
    handler(request, finalCallback);

    t.true(finalCallback.callCount === 0);
    t.true(doResolve.callCount === 1);
    t.true(doResolve.lastCall.args[0] === 'result', 'resolves as result, because it is an existing file');
    t.deepEqual(doResolve.lastCall.args[1], {
        path: '/repo/myProject/core/src/components/bigButton.scss',
        query: request.query,
        file: true,
        resolved: true,
    }, 'resolved with source file, because no customization file exists');
});

