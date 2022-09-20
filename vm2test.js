const {NodeVM} = require('vm2');

const vm = new NodeVM({
    console: 'inherit',
    sandbox: {},
    require: {
        external: true,
        builtin: ['fs', 'path'],
        root: './',
        mock: {
            fs: {
                readFileSync: () => 'Nice try!'
            }
        }
    }
});

// Sync

let functionInSandbox = vm.run('module.exports = function(who) { console.log("hello "+ who); }');
functionInSandbox('world');

// Async

let functionWithCallbackInSandbox = vm.run('module.exports = function(who, callback) { callback("hello "+ who); }');
functionWithCallbackInSandbox('world', (greeting) => {
    console.log(greeting);
});