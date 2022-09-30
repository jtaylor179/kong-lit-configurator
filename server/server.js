const express = require("express");
const path = require("path");
const app = express();

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

app.use("/", express.static(path.join(__dirname, "public")));
app.get("/api/v1", (req, res) => {
    res.json({
        project: "React and Express Boilerplate",
        from: "Vanaldito",
    });
});

app.get('/api/formDefinition', function(req, res){
    res.sendFile(path.resolve('../src/formDefinition.yaml'));
});

app.get('/api/formeval', function(req, res){
    // Sync

    let functionInSandbox = vm.run('module.exports = function(who){ return {"hello": who}; }');
    res.json(functionInSandbox('world'));

});


app.get("/*", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
})
const { PORT = 5000 } = process.env;
app.listen(PORT, () => {
    console.log();
    console.log(`  App running in port ${PORT}`);
    console.log();
    console.log(`  > Local: \x1b[36mhttp://localhost:\x1b[1m${PORT}/\x1b[0m`);
});