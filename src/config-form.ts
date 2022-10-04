import {html, css, LitElement, PropertyValues} from "lit";
import {customElement, property} from "lit/decorators.js";
import * as yaml from 'js-yaml'


@customElement('config-form')
export class ConfigForm extends LitElement {
    static style = css`
        
    `;

    @property({type:String})
    formConfiguration:string = '---';

    protected async firstUpdated(_changedProperties: PropertyValues) {
        super.firstUpdated(_changedProperties);
    }

    handleChange(evt:any) {
        evt.stopPropagation();
        if (!!evt.detail.value) {
            const ref = yaml.load(evt.detail.value);
            if(ref) {
                console.log(JSON.stringify(ref));
                this.dispatchEvent(new CustomEvent("change", {bubbles: true, composed: true, detail: {value: ref}}));
            }
        }
    }

    render(){
        return html`<code-editor @change=${this.handleChange} code=${this.formConfiguration || '---'} language="yaml"></code-editor>`;
    }
}