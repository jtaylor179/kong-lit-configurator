
import {CSSResultGroup, html, LitElement, TemplateResult} from "lit";
import { customElement, property } from "lit/decorators.js";
import styles  from './regEditor.scss';

import {html as staticHtml} from 'lit/static-html.js';
import {observer} from "./@material/web/compat/base/observer";


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
        return html`
            <div class="textfield">
            <md-outlined-text-field @input=${(evt:any) => this._handleTextInput(evt, field)}  .value=${value}/>
            </div>
        `;
    }

    private _handleFieldUpdate(field:any,  value:any,  action = 'set'){
        const prop = field.property;

        const isPlugin: boolean = !!field.plugin;
        const plugin = field.plugin;
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
        let val:any = defaultValue;
        if(typeof field.property === 'object'){
            const fn = new Function('field', field.property.in);
            val = fn.call(dataContext, field);
        } else {
            val = field.plugin ?  dataContext.config[field.property] : dataContext[field.property];
        }
        return val || defaultValue;
    }

    renderField(field:any):TemplateResult {
        let fieldDef: TemplateResult = html``;
        // get field value;
        const defaults:any = {'array':[], 'string':'', number:0};
        const dataContext:any = this.getDataRoot();

        let fieldValue:any =  defaults[field.dataType];

        if(field.plugin){
            const pluginData:any = dataContext.plugins.find((ref:any) => ref.name === field.plugin);
            if(pluginData && pluginData.config){
                fieldValue = this.getPropertyValue(pluginData, field, fieldValue);
            }
        } else {
            fieldValue = this.getPropertyValue(dataContext, field, fieldValue);
        }
        switch(field.type){
            case 'checkbox':
                fieldDef = this.renderCheckboxGroup(field, fieldValue);
                break;
            case 'textfield':
                fieldDef = this.renderTextField(field, fieldValue);
                break;
        }
        if(field.type === 'checkbox' || field.type==='textfield') {
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
        if(!!refContainer.containerRenderer){
            const fn = new Function('items', 'html', refContainer.containerRenderer);
            return html`${fn.call(this, items, html)}`;
        } else {
            return html`
                <div class="container">
                    ${this.renderSubItems(items)}
                </div>
            `;
        }
    }

    render(){
        const currentSection = this.registrationConfig.sections.find((ref:any) => ref.name === this.section) || { items:[] };
        return html`
            <div class="grid-container">
                ${this.renderContainer(currentSection || { items :[]})}
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