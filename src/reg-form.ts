
import {html, LitElement, css, TemplateResult} from "lit";
import { customElement, property } from "lit/decorators.js";
import styles  from './regEditor.scss';
import './@material/web/badge/badge.ts';
import './@material/web/actionelement/action-element';
import './@material/web/button/tonal-button.ts';
import './@material/web/textfield/outlined-text-field';
import './@material/web/switch/switch';

import {html as staticHtml} from 'lit/static-html.js';


// @ts-ignore
@customElement('reg-form')
export class RegForm extends LitElement {
    static styles = styles;
    // static styles = css``;

    @property({type:Object})
    definition:any = {};

    @property( { type: Object})
    savedSettings: any = { service:{ plugins: []}, routes: []};

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

    renderCheckboxGroup(field:any):TemplateResult {
        return html`
            <div class="checkboxgroup">
            ${field.options.map((o:string) => html`<input type="checkbox" @click=${this._clickHandler} data-property=${field.property} data-plugin=${field.plugin} data-field-type=${field.type} value=${o}/><label>${o}</label>`)}
            </div>
        `;
    }

    private _clickHandler(e: Event) {
        debugger;
        const ref: any = e.currentTarget;
        console.log(ref.outerHTML);

        const propId = ref.getAttribute('data-property');
        const fieldType = ref.getAttribute('data-field-type');
        const plugin = ref.getAttribute('data-plugin');
        const contextId = ref.closest('[data-context-name]').getAttribute('data-context-name');
        const contextType = ref.closest('[data-context-type]').getAttribute('data-context-type');
        const value = ref.value;
        const settings = this.savedSettings;
        let contextObj:any = {name:contextId}, plugins:[];
        if( contextType === 'service' ) {
            contextObj = settings.service;
        } else {
            contextObj = settings.routes.find((ref:any) => ref.name === contextId)
            if(!contextObj){
                settings.routes.push(contextObj);
            }
        }

        let pluginConfig:any = contextObj.plugins.find((ref:any) => ref.name === plugin);
        if(!pluginConfig){
            pluginConfig = {name:plugin};
            contextObj.plugins.push(pluginConfig);
        }

        pluginConfig[propId] = pluginConfig[propId] || [];
        pluginConfig[propId].push(value);

        this.dispatchEvent(new CustomEvent("change", {bubbles: true, composed:true, detail: { value: this.savedSettings} }));

    }

    renderCheckbox(field:any): TemplateResult {

    }

    renderField(field:any):TemplateResult {
        let fieldDef: TemplateResult = html``;
        switch(field.type){
            case 'checkbox':
                fieldDef = this.renderCheckboxGroup(field);
                break;
        }

        return html`
            ${this.renderLabel(field)}
            ${fieldDef}
        `;
    }

    render(){
        return html`


            <div class="grid-container" data-context-type="service" data-context-name="mockbin">

                ${this.renderFields(this.definition!.fields || [])}
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