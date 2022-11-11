const express = require("express");
const path = require("path");
const app = express();

const {NodeVM} = require('vm2');
const {exec} = require("child_process");
const bodyParser = require("express");
const fs = require("fs");
const {generateFromString, ConversionResultType} = require("openapi-2-kong");
const subProcess = require("child_process");
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


app.post('/api/runKongSync/:svcname', async function(req, resp){
    const subProcess = require("child_process");

    const svc = req.params.svcname;
    const outfile = svc + ".yaml";

    //To access POST variable use req.body()methods.
    console.log(req.body);
    const update = req.body;

    const fs = require('fs').promises;

    try {
        await fs.writeFile(path.resolve('./kong/' + outfile), update.deck); // need to be in an async function

        // select-tag
        subProcess.exec("cd kong && deck sync -s " + outfile, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                process.exit(1);
                throw new Error(error.message);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                throw new Error(error.message);
                return;
            }
            console.log(`stdout: ${stdout}`);
            resp.json('{result:"' + stdout + '"}');
        });

    } catch (err) {
        console.error(err)
        resp.send(err.message);
    }
});

app.post('/api/translateOpenAPI', async function(req, resp){
    try {
    const type = 'kong-declarative-config';
    const tags = [  ];
    let spec = `
        openapi: "3.0.0"
        info:
          version: 1.0.0
          title: Swagger Petstore
        servers:
          - url: http://petstore.swagger.io/v1
        paths:
          /pets:
            get:
              summary: Get all pets
        `;

    //To access POST variable use req.body()methods.
    console.log(req.body.spec);
    spec = req.body.spec || spec;

    console.log(typeof spec);


    const result = await generateFromString(spec, type, tags);
    //return     resp.json(result.documents[0]);
    resp.json(result.documents[0]);
    } catch(e){
        resp.json({ok:false});
    }
});

app.get('/api/formDefinition', function(req, res){
    res.sendFile(path.resolve('../src/formDefinition.yaml'));
});

app.get('/api/formDefinition2', function(req, res){
    res.sendFile(path.resolve('../src/formDefinition.yaml'));
});

app.get('/api/loadRegistration/:svcname', function(req, res) {
    const svc = req.params.svcname;
    const outfile = svc + ".yaml";
    const fullpath = path.resolve('./kong/' + outfile);
    console.log(outfile);
    try {
        fs.unlinkSync(fullpath);
        //file removed

        exec("cd kong && deck dump --select-tag " + svc + " -o " + outfile, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            res.sendFile(path.resolve('./kong/' + outfile));
        });
    } catch (err) {
        console.error(err)
        throw(err);
    }
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