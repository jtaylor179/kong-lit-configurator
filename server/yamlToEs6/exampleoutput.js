export class Config {
    static registrationConfig = {
        sections: [

            {
                "name": "ServiceSettings",
                "label": "Service Settings",
                "restrictTo": "service",
                "items": [{
                    "itemType": "container",
                    "containerRenderer": (items, html, renderSubItems) => {
                        return html`
                            <div> ${renderSubItems(items)}</div>`;
                    },
                    "style": "border: 1px solid red;",
                    "class": "defaultContainer",
                    "items": [{"itemRef": "nameField"}, {
                        "itemType": "field",
                        "type": "textfield",
                        "name": "tagField",
                        "label": "Tags",
                        "dataType": "array",
                        "property": "tags",
                        "pattern": "[Tt]ag\\d+$"
                    }, {
                        "itemType": "field",
                        "name": "upstreamUrl",
                        "type": "textfield",
                        "label": "Upstream URL",
                        "dataType": "string",
                        "property": {
                            "out": "const urlSpec = new URL(value); return {\"host\": urlSpec.hostname, \"protocol\": urlSpec.protocol.replace(\":\",\"\"), \"path\": urlSpec.pathname, \"port\": (urlSpec.port ? parseInt(urlSpec.port): 80)};\n",
                            "in": "if(this.host){\n  return this.protocol + '://' + this.host + (this.path ? this.path : '' );\n} else {\n  return '';\n}\n"
                        },
                        "validators": [{"name": "isUrl", "message": "invalid url"}, {
                            "name": "validateUpstreamUrl",
                            "async": true
                        }]
                    }]
                }, {"itemRef": "corsEnabledField"}, {
                    "itemType": "container", "display": (value, fieldIndex) => {
                        return fieldIndex.get("cors-enabled") ? fieldIndex.get("cors-enabled").value === true : false;
                    }, "items": [{"itemRef": "corsMethodsField"}, {"itemRef": "corsMaxAge"}]
                }]
            }, {
                "name": "RouteSettings",
                "label": "Route Settings",
                "restrictTo": "route",
                "items": [{
                    "itemType": "field",
                    "name": "path",
                    "type": "textfield",
                    "label": "Path",
                    "dataType": "array",
                    "property": "paths"
                }, {"itemRef": "methodsField"}, {"itemRef": "corsEnabledField"}, {
                    "itemType": "container",
                    "display": (value, fieldIndex) => {
                        return fieldIndex.get("cors-enabled") ? fieldIndex.get("cors-enabled").value === true : false;
                    },
                    "items": [{"itemRef": "corsMethodsField"}, {"itemRef": "corsMaxAge"}]
                }, {"itemRef": "demoContainer"}]
            }, {
                "name": "Authentication",
                "label": "Authentication",
                "items": [{"itemRef": "demoContainer"}, {"itemRef": "corsMethodsField"}]
            }, {"name": "Security", "label": "Security"}, {
                "name": "Traffic",
                "label": "Traffic Control"
            }, {"name": "Validation", "label": "Validation"}
        ],
        itemDefinitions: {
            demoContainer: {
                "itemType": "container",
                "items": [],
                "containerRenderer": (items, html, renderSubItems) => {
                    return html`
                        <div>ref container example</div>`;
                }
            },
            corsEnabledField: {
                "itemType": "field",
                "name": "cors-enabled",
                "property": "enabled",
                "type": "switch",
                "dataType": "boolean",
                "label": "CORS Enabled",
                "plugin": "cors",
                "default": false,
                "triggerRender": true
            },
            nameField: {
                "itemType": "field",
                "name": "name",
                "property": "name",
                "type": "textfield",
                "label": "Name",
                "dataType": "string",
                "required": true
            },
            corsMethodsField: {
                "itemType": "field",
                "name": "cors-methods",
                "plugin": "cors",
                "dataType": "array",
                "property": "config.methods",
                "type": "checkbox",
                "label": "CORS Methods",
                "options": ["GET", "POST", "PUT", "DELETE"],
                "requiredIf": (value, fieldIndex) => {
                    return fieldIndex.get("cors-enabled") ? fieldIndex.get("cors-enabled").value === true : false;
                },
                "help": "Blah blah"
            },
            corsMaxAge: {
                "itemType": "field",
                "name": "cors-max-age",
                "label": "CORS Max Age",
                "plugin": "cors",
                "property": "config.max_age",
                "type": "textfield",
                "dataType": "number",
                "default": 1000
            },
            corsOriginsField: {
                "itemType": "field",
                "name": "cors-origins",
                "plugin": "cors",
                "property": "config.origin",
                "label": "Origins",
                "type": "textfield",
                "dataType": "array"
            },
            methodsField: {
                "itemType": "field",
                "name": "methods",
                "property": "methods",
                "label": "Methods",
                "type": "checkbox",
                "dataType": "array",
                "default": ["GET", "POST"],
                "options": ["GET", "POST", "PUT", "DELETE"]
            }
        }
    }
}
