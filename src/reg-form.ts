
import {CSSResultGroup, html, LitElement,  TemplateResult} from "lit";
import { customElement, property } from "lit/decorators.js";
import styles  from './regEditor.scss';

import {observer} from "./@material/web/compat/base/observer";
import {ifDefined} from "lit/directives/if-defined.js";
import {FieldSettings} from "./types";
import {builtInValidators, isPromise} from "./standardValidations";


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

    private _currentSection: any;


    renderLabel(field:any):TemplateResult{
        return html`<label class="fieldLabel">${field.label}</label>`;
    }

    renderCheckboxGroup(field:any, value:string[] = []):TemplateResult {
        const initValue:string[]  = Array.isArray(value) ? value : [];
        return html`
            <div class="checkboxgroup">
            ${field.options.map((o:string) => html`<md-checkbox type="checkbox" .checked=${initValue.indexOf(o) !== -1} @change=${(evt:any) => this._changeHandler(evt, field)} value=${o}></md-checkbox><label>${o}</label>`)}
            </div>
        `;
    }


    renderTextField(field:any, value:string):TemplateResult {
        const type = field.dataType === 'number'?  'number':'text';
        return html`
            <div class="textfield">
            <md-outlined-text-field pattern=${ifDefined(field.pattern)} errorText=${ifDefined(field.errorText)}  ?required=${!!field.required} @input=${(evt:any) => this._handleTextInput(evt, field)} type=${type} .value=${value}/>
            </div>
        `;
    }


    renderSwitch(field:any, value:string):TemplateResult {
        return html`
            <div class="textfield">
            <md-switch @action=${(evt:any) => this._switchHandler(evt, field)} ?selected=${value}/>
            </div>
        `;
    }

    private _handleFieldUpdate(field:any,  value:any,  action = 'set'){
        const prop = field.property;
        const isPlugin: boolean = !!field.plugin;
        const useConfig: boolean = isPlugin && prop.indexOf('config') !== -1;

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
            targetConfig  = useConfig ? pluginDef.config: pluginDef;
        }

        // Translate function returns key value pairs
        if(typeof(prop) === 'object'){
            const fn = new Function('field', 'value', prop.out);
            const updates  = fn.call(this, field, value) || {};
            Object.assign(targetConfig, updates);
        } else {
            const propToSet = useConfig ? prop.split('.')[1] : prop;
            if (field.dataType === 'array') {
                if(!Array.isArray(targetConfig[propToSet])){
                    targetConfig[propToSet] = [];
                }
                if (action === 'set') {
                    targetConfig[propToSet].push(value);
                } else if (action === 'replace') {
                    targetConfig[propToSet] = value;
                } else { // remove
                    const index = targetConfig[propToSet].indexOf(value);
                    if (index >= 0) {
                        targetConfig[propToSet].splice(index, 1);
                    }
                }
            } else {
                targetConfig[propToSet] = value;
            }
        }
        if(field.triggerRender) {
            this.requestUpdate();
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

    private async _handleTextInput(e: Event, field:any) {
        const ref: any = e.currentTarget;

        console.log(ref.outerHTML);
        console.log(field.name);
        let actionType = 'set';
        let value = ref.value;
        if(field.dataType === 'array'){
            actionType = 'replace';
            value = ref.value.split(',');
        }
        // reset custom validity
        ref.setCustomValidity('');

        const isValid = ref.checkValidity();
        if(isValid) {
            if(Array.isArray(field.validators) && field.validators.length > 0){
                let { isValid, errorText } = await this.processFieldValidators(field, value);
                if(!isValid){
                    ref.setCustomValidity(errorText);
                } else {
                    this._handleFieldUpdate(field, value, actionType);
                }
            } else {
                this._handleFieldUpdate(field, value, actionType);
            }
            await this.updateComplete;
        } else if(ref.errorText){
            ref.setCustomValidity(ref.errorText);
        }
        ref.reportValidity();
    }

    // Loop through all validators - end on first error
    async processFieldValidators(field:any, value:any):Promise<{ isValid: boolean, errorText: string}>{
        for (let x = 0; x < field.validators.length; x++) {
            const def = field.validators[x];
            const validator = builtInValidators[def.key];
            if (!validator) {
                alert('invalid validation specified');
            }
            let validationResult: boolean | Promise<boolean> = validator.call(this, value);
            if (isPromise(validationResult)) {
                validationResult = await validationResult;
            }
            if (!validationResult) {
                return Promise.resolve({isValid: false, errorText: def.errorText});
            }
        }
        return Promise.resolve({isValid:true, errorText: ''});
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
        const prop = field.property;
        const isPlugin: boolean = !!field.plugin;
        const useConfig: boolean = isPlugin && prop.indexOf('config') !== -1;
        const getProp = useConfig ? prop.split('.')[1] : prop;
        let val:any;
        if(typeof prop === 'object'){
            const fn = new Function('field', field.property.in);
            val = fn.call(dataContext, field);
        } else {
            val = useConfig ?  dataContext.config[getProp] : dataContext[getProp];
        }
        if(!(val === undefined || val === null)){
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
                const fn = new Function('items', 'html', 'renderSubItems', refContainer.containerRenderer);
                return html`${fn.call(this, items, html, this.renderSubItems.bind(this))}`;
            } else {
                return html`
                    <form class="container mainForm">
                        ${this.renderSubItems(items)}
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
        if(field.plugin ){
            const pluginData:any = dataContext.plugins.find((ref:any) => ref.name === field.plugin);
            if(pluginData){
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

    willUpdate(){
        if(this.registrationConfig && this.registrationConfig.sections) {
            this._currentSection = this.registrationConfig.sections.find((ref: any) => ref.name === this.section) || {items: []};

            this.initializeSectionValues(this._currentSection);
        }
    }

    render(){
        if(this._currentSection) {
            return html`
                <div class="grid-container">
                    ${this.renderContainer(this._currentSection)}
                </div>
            `;
        } else {
            return html``;
        }
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