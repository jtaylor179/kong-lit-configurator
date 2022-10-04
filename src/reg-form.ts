
import {CSSResultGroup, html, LitElement, TemplateResult} from "lit";
import { customElement, property } from "lit/decorators.js";
import styles  from './regEditor.scss';

import {html as staticHtml} from 'lit/static-html.js';
import {observer} from "./@material/web/compat/base/observer";
import * as yaml from "js-yaml";


// @ts-ignore
@customElement('reg-form')
export class RegForm extends LitElement {
    // @ts-ignore
    static styles: CSSResultGroup | undefined = styles;
    // static styles = css``;

    @property({type:Object})
    formDefinition:any = {};

    @property()
    contextType: string = 'service';

    @property()
    routeName?: string;


    @property( { type: Object})
    @observer(function(this: RegForm) {
        console.log(JSON.stringify(this.savedSettings));
    })
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
        return html`<label>${field.label}</label>`;
    }

    renderCheckboxGroup(field:any, value:string[] = []):TemplateResult {
        return html`
            <div class="checkboxgroup">
            ${field.options.map((o:string) => html`<input type="checkbox" ?checked=${value.indexOf(o) !== -1} @click=${(evt:any) => this._clickHandler(evt, field)} value=${o}/><label>${o}</label>`)}
            </div>
        `;
    }

    renderTextField(field:any, value:string):TemplateResult {
        return html`
            <div class="textfield">
            <input @input=${(evt:any) => this._handleInput(evt, field)} data-property=${field.property} value=${value}/>
            </div>
        `;
    }

    private _handleFieldUpdate(field:any, value:any, el:any,  action = 'set'){
        const propId = field.property;

        // const fieldType = field.type;
        const isPlugin: boolean = !!field.plugin;
        const plugin = field.plugin;
        const contextId = el.closest('[data-context-name]').getAttribute('data-context-name');
        const contextType = el.closest('[data-context-type]').getAttribute('data-context-type');
        const settings = this.savedSettings;
        let contextObj:any;
        if( contextType === 'service' ) {
            contextObj = settings.services[0];
        } else {
            contextObj = settings.routes.find((ref:any) => ref.name === contextId)
            if(!contextObj){
                settings.routes.push(contextObj);
            }
        }

        let targetConfig:any = contextObj;
        if(isPlugin) {
            let pluginDef: any = contextObj.plugins.find((ref: any) => ref.name === plugin);
            if (!pluginDef) {
                pluginDef = {name: plugin, config: {}};
                contextObj.plugins.push(pluginDef);
            }
            targetConfig  = pluginDef.config;

            //pluginConfig[prop] = pluginConfig[prop] || defaultVal;


        }
         // set default Value
        const defaults:any = {'array':[], 'string':'', number:0};
        const defaultVal:any = defaults[field.dataType];
        targetConfig[propId] = targetConfig[propId]  || defaultVal;

        // Translate function returns key value pairs
        if(!!field.translateOutFn){
            const fn = new Function('field', 'value', field.translateOutFn);
            const updates  = fn.call(this, field, value) || {};
            Object.assign(targetConfig, updates);
        } else {
            if (field.dataType === 'array') {
                if (action === 'set') {
                    targetConfig[propId].push(value);
                } else {
                    const index = targetConfig[propId].indexOf(value);
                    if (index >= 0) {
                        targetConfig[propId].splice(index, 1);
                    }
                }
            } else {
                targetConfig[propId] = value;
            }
        }

        this.dispatchEvent(new CustomEvent("change", {bubbles: true, composed:true, detail: { value: this.savedSettings} }));

    }

    private _clickHandler(e: Event, field: any) {
        const ref: any = e.currentTarget;
        console.log(ref.outerHTML);
        const action = ref.checked ? 'set':'unset';
        this._handleFieldUpdate(field, ref.value, ref, action);
    }

    private _handleInput(e: Event, field:any) {
        const ref: any = e.currentTarget;
        console.log(ref.outerHTML);
        console.log(field.name);
        this._handleFieldUpdate(field, ref.value, ref);
    }

    private getDataRoot(){
        const root:any = this.savedSettings || {};
        const rootService:any = root.services && root.services.length > 0 ? root.services[0]  : { routes:[], plugins:[]};
        if(this.contextType === 'service'){
            return rootService;
        } else {
            return rootService.routes.find( (ref:any) => ref.name === this.routeName) || {};
        }

    }

    private getPropertyValue(dataContext:any, field:any, defaultValue:any){
        let val:any = defaultValue;
        if(typeof field.property === 'object'){
            const fn = new Function('field', field.property.in);
            val = fn.call(dataContext, field) || defaultValue;
        } else {
            return
        }
        return val;
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
                fieldValue = this.getPropertyValue(pluginData, field.property, fieldValue);
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

    render(){
        return html`

            
            <div class="grid-container" data-context-type="service" data-context-name="mockbin">
                ${this.renderFields(this.formDefinition!.fields || [])}
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