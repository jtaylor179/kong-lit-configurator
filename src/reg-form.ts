
import {CSSResultGroup, html, LitElement, TemplateResult} from "lit";
import { customElement, property } from "lit/decorators.js";
import styles  from './regEditor.scss';

import {html as staticHtml} from 'lit/static-html.js';
import {observer} from "./@material/web/compat/base/observer";

interface FieldSettings {
    value: any;
    required: boolean;
    display: boolean;
    priority: number;
    field: any;
}


// @ts-ignore
@customElement('reg-form')
export class RegForm extends LitElement {
    // @ts-ignore
    static styles: CSSResultGroup | undefined = styles;
    // static styles = css``;

    @property({type:Object})
    registrationConfig:any = {};

    @property()
    contextType: string = 'service';

    @property()
    @observer(function(this: RegForm) {
        console.log(this.routeName);
        this.contextType = !!this.routeName ? 'route':'service';
    })
    routeName?: string;

    @property()
    section: string = 'GeneralService';


    @property( { type: Object})
    savedSettings: any = { services : [{ plugins: [], routes: []}]};

    private fieldRuntimeProps : Map<number, FieldSettings> = new Map<number, FieldSettings>();

    protected renderMenuSurface(sTag:string): TemplateResult {
        return staticHtml`<${sTag}
      class="md3-autocomplete__menu-surface"
      .corner="BOTTOM_START"
      ?stayOpenOnBodyClick=${true}
    >
      <${sTag} class="md3-autocomplete__list">
        <slot></slot>
      </${sTag}>
    </${sTag}>`;
    }

    renderFields(fields:any[]):TemplateResult {
        return html`
            ${fields.map((ref:any) => this.renderField(ref))}
        `;
    }

    renderLabel(field:any):TemplateResult{
        return html`<label class="fieldLabel">${field.label}</label>`;
    }

    renderCheckboxGroup(field:any, value:string[] = []):TemplateResult {
        return html`
            <div class="checkboxgroup">
            ${field.options.map((o:string) => html`<md-checkbox type="checkbox" .checked=${value.indexOf(o) !== -1} @change=${(evt:any) => this._changeHandler(evt, field)} value=${o}></md-checkbox><label>${o}</label>`)}
            </div>
        `;
    }

    renderTextField(field:any, value:string):TemplateResult {
        const type = field.dataType === 'number'?  'number':'text';
        return html`
            <div class="textfield">
            <md-outlined-text-field ?required=${!!field.required} @input=${(evt:any) => this._handleTextInput(evt, field)} type=${type} .value=${value}/>
            </div>
        `;
    }

    renderSwitch(field:any, value:string):TemplateResult {
        return html`
            <div class="textfield">
            <md-switch @action=${(evt:any) => this._switchHandler(evt, field)} ?checked=${value}/>
            </div>
        `;
    }



    private _handleFieldUpdate(field:any,  value:any,  action = 'set'){
        const prop = field.property;

        const isPlugin: boolean = !!field.plugin;
        const plugin = field.plugin;
        if(field.dataType === 'number'){
            value = Number(value);
        }
        let targetConfig:any = this.getDataRoot();

        if(isPlugin) {
            let pluginDef: any = targetConfig.plugins.find((ref: any) => ref.name === plugin);
            if (!pluginDef) {
                pluginDef = {name: plugin, config: {}};
                targetConfig.plugins.push(pluginDef);
            }
            targetConfig  = pluginDef.config;
        }

        // Translate function returns key value pairs
        if(typeof(prop) === 'object'){
            const fn = new Function('field', 'value', prop.out);
            const updates  = fn.call(this, field, value) || {};
            Object.assign(targetConfig, updates);
        } else {
            if (field.dataType === 'array') {
                if(!Array.isArray(targetConfig[prop])){
                    targetConfig[prop] = [];
                }
                if (action === 'set') {
                    targetConfig[prop].push(value);
                } else if (action === 'replace') {
                    targetConfig[prop] = value;
                } else { // remove
                    const index = targetConfig[prop].indexOf(value);
                    if (index >= 0) {
                        targetConfig[prop].splice(index, 1);
                    }
                }
            } else {
                targetConfig[prop] = value;
            }
        }

        this.dispatchEvent(new CustomEvent("change", {bubbles: true, composed:true, detail: { value: this.savedSettings} }));

    }

    private _changeHandler(e: Event, field: any) {
        e.preventDefault();
        e.stopPropagation();
        const ref: any = e.currentTarget;
        console.log(ref.outerHTML);
        const action = ref.checked ? 'set':'unset';
        this._handleFieldUpdate(field, ref.value, action);
    }

    private async _switchHandler(e: Event, field: any) {
        e.preventDefault();
        e.stopPropagation();
        const ref: any = e.currentTarget;
        console.log(ref.outerHTML);
        const value = !!ref.selected;
        this._handleFieldUpdate(field, value);
    }

    private _handleTextInput(e: Event, field:any) {
        const ref: any = e.currentTarget;
        console.log(ref.outerHTML);
        console.log(field.name);
        let actionType = 'set';
        let value = ref.value;
        if(field.dataType === 'array'){
            actionType = 'replace';
            value = ref.value.split(',');
        }
        this._handleFieldUpdate(field, value, actionType);
    }

    private getDataRoot(){
        const root:any = this.savedSettings || {};
        const rootService:any = root.services && root.services.length > 0 ? root.services[0]  : { routes:[], plugins:[]};
        if(this.contextType === 'service'){
            rootService.plugins = rootService.plugins ?? []
            return rootService;
        } else {
            let rootRoute = rootService.routes.find((ref: any) => ref.name === this.routeName);
            if(!rootRoute){
                rootRoute = { name: this.routeName, plugins:[]};
                rootService.routes.push(rootRoute);
            }
            rootRoute.plugins = rootRoute.plugins ?? []
            return rootRoute;
        }

    }

    private getPropertyValue(dataContext:any, field:any, defaultValue:any){
        let val:any;
        if(typeof field.property === 'object'){
            const fn = new Function('field', field.property.in);
            val = fn.call(dataContext, field);
        } else {
            val = field.plugin ?  dataContext.config[field.property] : dataContext[field.property];
        }
        if(typeof(val) !== 'undefined'){
            return val;
        } else if(typeof(field.default) !== 'undefined'){
            return field.default;
        } else {
            return defaultValue;
        }
    }

    renderField(field:any):TemplateResult {
        let fieldDef: TemplateResult = html``;
        // get field value;
        // const defaults:any = {'array':[], 'string':'', 'number':0};
        // const dataContext:any = this.getDataRoot();

        const fieldProps = this.fieldRuntimeProps.get(field.name)!;
        const fieldValue: any = fieldProps.value;
        if(!fieldProps.display){
            return html``;
        }
        // let fieldValue:any =  defaults[field.dataType];
        //
        // if(field.plugin){
        //     const pluginData:any = dataContext.plugins.find((ref:any) => ref.name === field.plugin);
        //     if(pluginData && pluginData.config){
        //         fieldValue = this.getPropertyValue(pluginData, field, fieldValue);
        //     }
        // } else {
        //     fieldValue = this.getPropertyValue(dataContext, field, fieldValue);
        // }

        switch(field.type){
            case 'checkbox':
                fieldDef = this.renderCheckboxGroup(field, fieldValue);
                break;
            case 'textfield':
                fieldDef = this.renderTextField(field, fieldValue);
                break;
            case 'switch':
                fieldDef = this.renderSwitch(field, fieldValue);
                break;
        }
        if(field.type === 'checkbox' || field.type === 'textfield' || field.type === 'switch') {
            return html`
                ${this.renderLabel(field)}
                ${fieldDef}
            `;
        } else {
            return html``;
        }
    }

    renderSubItems(items:any[]):TemplateResult{
        return html`
            ${items.map((ref:any) => {
                if(ref.itemRef){
                    ref = this.registrationConfig.itemDefinitions[ref.itemRef];
                }
                if(ref.itemType === 'container'){
                    return this.renderContainer(ref);
                } else {
                    return this.renderField(ref);
                }
            })}
        `;
    }

    renderContainer(refContainer:any):TemplateResult{
        const items = refContainer.items || [];
        let display = true;
        if(typeof refContainer.display === "boolean"){
            display = refContainer.display;
        } else if(typeof refContainer.display === 'string'){
            const fn = new Function('fieldIndex', refContainer.display);
            display = fn.call(refContainer, this.fieldRuntimeProps);
        }
        if(display) {
            if (!!refContainer.containerRenderer) {
                const fn = new Function('items', 'html', refContainer.containerRenderer);
                return html`${fn.call(this, items, html)}`;
            } else {
                return html`
                    <form class="container">
                        ${this.renderSubItems(items)}
                        <button type="submit">Submit</button>
                    </form>
                `;
            }
        } else {
            return html``;
        }
    }

    /*
        need to get
        later may
     */


    private initializeSectionValues(rootContainer: any){
        // this.fieldRuntimeProps = new Map<number, FieldSettings>();
        // create
        let arrFields: FieldSettings[] = this.getFieldList(rootContainer);
        // need to sort in case of dependent fields
        arrFields = arrFields.sort((a, b) => (a.priority > b.priority) ? 1 : -1);
        arrFields.forEach(ref => this.initializeFieldValues(ref));
    }

    // note - container depth determines field value evaluation priority
    private getFieldList(refContainer:any, defaultPriorityLevel: number = 0): FieldSettings[]{
        let items = refContainer.items || [];
        let arrFields: FieldSettings[] = [];
        items.forEach((ref:any) => {
           if(ref.itemRef){
               ref = this.registrationConfig.itemDefinitions[ref.itemRef];
           }
            if(ref.itemType === 'container'){
                arrFields = arrFields.concat(this.getFieldList(ref, ++defaultPriorityLevel));
            } else {
                arrFields.push( {
                    value: null,
                    required: false,
                    display: true,
                    priority: ref.priority || defaultPriorityLevel,
                    field: ref
                });
            }
        });
        return arrFields;
    }

    private initializeFieldValues(fieldDef:FieldSettings){
        const defaults:any = {'array':[], 'string':'', 'number':0};
        const dataContext:any = this.getDataRoot();
        const field = fieldDef.field;
        const fieldIndex = this.fieldRuntimeProps;
        let fieldValue:any =  defaults[field.dataType];

        // TODO - cache dynamic functions in fieldIndex  requireFunction, displayFunction, valueFunction
        // TODO - this should only be done on first load
        // Add field to global index
        fieldIndex.set(field.name, fieldDef);

        // Set Field Value
        if(field.plugin){
            const pluginData:any = dataContext.plugins.find((ref:any) => ref.name === field.plugin);
            if(pluginData && pluginData.config){
                fieldDef.value = this.getPropertyValue(pluginData, field, fieldValue);
            }
        } else {
            fieldDef.value = this.getPropertyValue(dataContext, field, fieldValue);
        }



        // Set Required property -
        if(typeof(field.required) === 'boolean'){
            fieldDef.required = field.required;
        } else if(typeof(field.required) === 'string'){
            const fn = new Function('fieldIndex', field.required);
            fieldDef.required = fn.call(fieldDef, fieldIndex);
        }

        if(typeof field.display === "boolean"){
            fieldDef.display = field.display;
        } else if(typeof  field.display === 'string'){
            const fn = new Function('fieldIndex', field.display);
            fieldDef.display = fn.call(fieldDef, fieldIndex);
        }
    }

    render(){
        const currentSection = this.registrationConfig.sections.find((ref:any) => ref.name === this.section) || { items:[] };

        this.initializeSectionValues(currentSection);
        return html`
            <div class="grid-container">
                ${this.renderContainer(currentSection)}
            </div>
        `;
    }
}

// ${this.definition?.fields?.map((ref:any) =>
//     html`<li>${ref.label}</li>`
// )}
// <md-badge value="hello"></md-badge>
// <md-tonal-button label="Hello"></md-tonal-button>
// <label>Hi</label>
// <md-outlined-text-field id=""></md-outlined-text-field>
//
// <label>CORS Support</label>
// <md-switch id="second"></md-switch>

declare global {
    interface HTMLElementTagNameMap {
        "reg-form": RegForm;
    }
}