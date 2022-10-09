const express = require("express");
const path = require("path");
const app = express();

const {NodeVM} = require('vm2');
const {exec} = require("child_process");
const bodyParser = require("express");
const fs = require("fs");
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

app.post('/api/runKongSync', async function(req, resp){
    const { exec } = require("child_process");

    //To access POST variable use req.body()methods.
    console.log(req.body);
    const update = req.body;

    const fs = require('fs').promises;

    const data = "Hello my name is Hugo, I'm using the new fs promises API";

    try {
        await fs.writeFile(path.resolve('./kong/' + update.name + '.yaml'), update.deck); // need to be in an async function
    } catch (error) {
        console.log(error)
    }

    exec("cd kong && deck sync -s " + update.name + ".yaml", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
});

app.get('/api/formDefinition', function(req, res){
    res.sendFile(path.resolve('../src/formDefinition.yaml'));
});

app.get('/api/formDefinition2', function(req, res){
    res.sendFile(path.resolve('../src/formDefinition.yaml'));
});

app.get('/api/loadRegistration', function(req, res){
    res.sendFile(path.resolve('../src/deckExample.yaml'));
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