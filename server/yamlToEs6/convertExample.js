"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
var yaml = require("js-yaml");
var fs = require("fs");
var common_tags_1 = require("common-tags");
// Load the input YAML file
var input = yaml.load(fs.readFileSync('../../src/formDefinition.yaml', 'utf8'));
function genSections(sections) {
    return "\n    ".concat((sections || []).map(function (section) {
        return renderProperties(section);
    }).join(','));
}
function renderProperties(obj) {
    var props = Object.entries(obj).map(function (_a) {
        var key = _a[0], value = _a[1];
        if (value == null) { // check for null or undefined
            return;
        }
        if (key === 'items') {
            var items = value;
            return (0, common_tags_1.oneLine)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\"items\": [", "]"], ["\"items\": [", "]"])), (items || []).map(function (item) {
                return renderProperties(item);
            }).join(','));
        }
        if (key === 'containerRenderer') {
            return (0, common_tags_1.oneLine)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\"", "\": (items, html, renderSubItems) => { ", " }"], ["\"", "\": (items, html, renderSubItems) => { ", " }"])), key, value);
        }
        else if (key === 'required') {
            var val = obj[key];
            if (val === true || val === false) {
                return (0, common_tags_1.oneLine)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\"", "\":", ""], ["\"", "\":", ""])), key, val);
            }
            else {
                return (0, common_tags_1.oneLine)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\"", "\": (fieldIndex) => { ", " }"], ["\"", "\": (fieldIndex) => { ", " }"])), key, value);
            }
        }
        else if (key === 'display' || key === 'requiredIf') {
            return (0, common_tags_1.oneLine)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\"", "\": (value, fieldIndex) => { ", " }"], ["\"", "\": (value, fieldIndex) => { ", " }"])), key, value);
        }
        else {
            return (0, common_tags_1.oneLine)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\"", "\":", ""], ["\"", "\":", ""])), key, JSON.stringify(value));
        }
    });
    return (0, common_tags_1.oneLine)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["{", "}"], ["{", "}"])), props.filter(function (val) { return val != null; }).join(','));
}
function generateItemDefinitions(itemDefs) {
    return "\n    ".concat(Object.keys(itemDefs).map(function (key) {
        var def = itemDefs[key];
        return (0, common_tags_1.oneLine)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n              ", ": ", "\n        "], ["\n              ", ": ", "\n        "])), key, renderProperties(def));
    }));
}
// Create a function to generate the code using a tagged template literal
function generateConfig(config) {
    return "\nexport class Config {\n    static registrationConfig = {\n            sections: [\n                ".concat(genSections(config.sections || []), "\n            ],\n            itemDefinitions: {").concat(generateItemDefinitions(config.itemDefinitions), "\n      }\n   }\n}");
}
// Generate the code using the input YAML file and the generateConfig function
var code = generateConfig(input.registrationConfig);
console.log(code);
// Export the generated class
exports["default"] = code;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
