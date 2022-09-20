import {html, css, LitElement, PropertyValues} from "lit";
import {customElement, property} from "lit/decorators.js";
import * as yaml from 'js-yaml'
import {CodeEditor} from "./code-editor";


@customElement('config-form')
export class ConfigForm extends LitElement {
    static style = css`
        
    `;

    @property({type:String})
    currentKongConfig:string = '---';

    protected async firstUpdated(_changedProperties: PropertyValues) {
        super.firstUpdated(_changedProperties);
    }

    handleChange(evt:any){
        evt.stopPropagation();
        const ref  = yaml.load(evt.detail.value);
        console.log(JSON.stringify(ref));
        this.dispatchEvent(new CustomEvent("change", {bubbles: true, composed:true, detail: { value: ref} }));
    }

    render(){
        return html`<code-editor @change=${this.handleChange} code=${this.currentKongConfig || '---'} language="yaml"></code-editor>`;
    }
}