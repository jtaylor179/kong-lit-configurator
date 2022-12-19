import * as yaml from 'js-yaml';
import * as fs from 'fs';
import {oneLine} from 'common-tags';

// Load the input YAML file
const input: any = yaml.load(fs.readFileSync('../src/formDefinition.yaml', 'utf8'));

function genSections(sections: any[]) {
    return `
    ${(sections || []).map((section: any) =>
        renderProperties(section)
    ).join(',')}`;
}

function renderProperties(obj: any): string {
    const props = Object.entries(obj).map(([key, value]) => {
        if (value == null) { // check for null or undefined
            return;
        }
        if (key === 'items') {
            const items: any[] = <any[]>value;
            return oneLine`"items": [${(items || []).map((item: any) =>
                renderProperties(item)
            ).join(',')}]`;
        }
        if (key === 'containerRenderer') {
            return oneLine`"${key}": function(items, html, renderSubItems){ ${value} }`;
        } else if (key === 'required') {
            const val = obj[key];
            if (val === true || val === false) {
                return oneLine`"${key}":${val}`;
            } else {
                return oneLine`"${key}": function(fieldIndex){ ${value} }`;
            }
        } else if ( key === 'display' || key === 'requiredIf'){
            return oneLine`"${key}": function(value, fieldIndex){ ${value} }`;
        }

        else {
            return oneLine`"${key}":${JSON.stringify(value)}`;
        }
    });

    return oneLine`{${props.filter(val => val != null).join(',')}}`;
}


function generateItemDefinitions(itemDefs: any) {
    return `
    ${Object.keys(itemDefs).map((key: string) => {
        const def = itemDefs[key];
        return oneLine`
              ${key}: ${renderProperties(def)}
        `
    })
    }`;
}


// Create a function to generate the code using a tagged template literal
function generateConfig(config: {
    itemDefinitions: any;
    sections: any;
}) {
    return `
export class Config {
    static registrationConfig = {
            sections: [
                ${genSections(config.sections || [])}
            ],
            itemDefinitions: {${generateItemDefinitions(config.itemDefinitions)}
      }
   }
}`
}

// Generate the code using the input YAML file and the generateConfig function
const code = generateConfig(input.registrationConfig);

console.log(code);


// Export the generated class
export default code;
