import {
    generateFromString,
    generateFromSpec,
    generate, ConversionResultType, OpenApi3Spec,
} from 'openapi-2-kong';
import * as yaml from 'js-yaml'
import { writeFileSync } from 'fs';

const spec = `
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

const examples = async () => {
    const tags = [ 'MyTag' ];
    const type: ConversionResultType = 'kong-declarative-config'; // or 'kong-for-kubernetes'

    // Generate a config from YAML string
    const config1 = await generateFromString(spec, type, tags);

    // Generate a config from a JavaScript Object
    const specObject:OpenApi3Spec = yaml.load(spec) as OpenApi3Spec;
    const config2 = generateFromSpec(specObject, type, tags);

    // Generate a config from a JSON string
    const specJSON = JSON.stringify(specObject);
    const config3 = await generateFromString(specJSON, type, tags);

    // generate a config from a file path
    writeFileSync('/tmp/spec.yaml', spec);
    const config4 = await generate('/tmp/spec.yaml', type, tags);

    console.log('Generated:', JSON.stringify({ config1, config2, config3, config4 }));
};

examples();