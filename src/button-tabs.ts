import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import './@material/web/button/filled-button';
import {classMap} from "lit/directives/class-map.js";
import {RegForm} from "./reg-form";

@customElement('button-tabs')
export class ButtonTabs extends LitElement {
    static styles = css`
      .tabBar {
        // max-width: calc(100% - 2 * 40px);
        width:800px;
        margin: 0 auto;
        padding: 16px 40px;
        border-bottom: 1px solid grey;
        text-align: center;
        white-space: nowrap;
        overflow-x: auto;
        --md-tonal-button-container-color: #cee7ef;
        --md-tonal-button-hover-container-elevation-shadow: none;
      }
      md-filled-button {
        --md-filled-button-container-color: #cee7ef;
        --md-filled-button-label-text-color: black;
        --md-filled-button-hover-label-text-color: black;
        --md-filled-button-pressed-label-text-color: black;
        --md-sys-color-on-primary:black;
        margin-right:5px;
      }
      md-filled-button.selected {
        --md-filled-button-container-color: lightgrey;
      }
    `;
    @property()
    public currentTab: string = '';

    @property({type:Object})
    tabList: Object[] = [];

    @property()
    contextType: string = 'service';

    private _handleClick(tab:string){
        this.currentTab = tab;
        this.dispatchEvent(new CustomEvent("change", {bubbles: true, composed:true, detail: { value: tab} }));
    }

    render(){
        return html`
            <div class="tabBar">
                ${this.tabList.map((ref:any) => {
                        if(!ref.restrictTo || ref.restrictTo === this.contextType) {
                            return html`
                                <md-filled-button @click=${() => this._handleClick(ref.name)}
                                                  class="${classMap({'selected': this.currentTab === ref.name})}"
                                                  label=${ref.label}></md-filled-button>`;
                        } else {
                            return null;
                        }
                    })}
            </div>`;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        "button-tabs": RegForm;
    }
}