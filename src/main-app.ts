import { html, css, LitElement} from "lit";
import {customElement, state} from "lit/decorators.js";
import './code-editor';
import './config-form';
import './reg-form';
import {RegForm} from "./reg-form";
import * as yaml from 'js-yaml'
import {ConfigForm} from "./config-form";

@customElement('main-app')
export class MainApp extends LitElement {
    static styles = css`
      :host {
        width:100%;
        height: 100%;
      }
      .main-layout {
        display: flex;
      }
    `;

    @state()
    currentKongConfig: string = '#TODO';

    @state()
    currentOpenAPISpec: string = '_format_version: "3.0"\n' +
        'services:\n' +
        '- connect_timeout: 60000\n' +
        '  host: example.com\n' +
        '  name: foo\n' +
        '  port: 443\n' +
        '  protocol: https\n' +
        '  read_timeout: 60000\n' +
        '  retries: 5\n' +
        '  write_timeout: 60000\n' +
        '  routes:\n' +
        '  - name: bar\n' +
        '    paths:\n' +
        '    - /bar\n' +
        '    - /baz\n' +
        '    preserve_host: false\n' +
        '    protocols:\n' +
        '    - http\n' +
        '    - https\n' +
        '    regex_priority: 0\n' +
        '    strip_path: true\n' +
        '    https_redirect_status_code: 426\n' +
        'plugins:\n' +
        '- name: cors\n' +
        '  service: SERVICE_NAME|SERVICE_ID\n' +
        '  config:\n' +
        '    origins:\n' +
        '    - http://mockbin.com\n' +
        '    methods:\n' +
        '    - GET\n' +
        '    - POST\n' +
        '    headers:\n' +
        '    - Accept\n' +
        '    - Accept-Version\n' +
        '    - Content-Length\n' +
        '    - Content-MD5\n' +
        '    - Content-Type\n' +
        '    - Date\n' +
        '    - X-Auth-Token\n' +
        '    exposed_headers:\n' +
        '    - X-Auth-Token\n' +
        '    credentials: true\n' +
        '    max_age: 3600\n' +
        '\n';

    render(){
        return html`
            <div class="main-layout">
                <config-form id="configForm" style="flex:1" @change="${this._handleConfigChange}" currentKongConfig=${this.currentKongConfig} ></config-form>
                <reg-form id="regForm" @change="${this._handleFormInput}" style="width:600px;"></reg-form>
                <code-editor id="codeEditor" style="flex:1"   code=${this.currentOpenAPISpec} language="yaml">
                </code-editor>
            </div>
        `;
    }



    protected async firstUpdated() {
        const resp = await fetch('http://localhost:3000/api/formDefinition');
        let data = await resp.text();
        // const ref  = yaml.load(data);
        // this.updateRegForm(ref);
        this.updateConfigForm(data); //
    }

    updateConfigForm(sConfig:string){
        this.currentKongConfig = sConfig;
        console.log(sConfig);
    }

    private _handleFormInput(ref:any){
        debugger;
        console.log(JSON.stringify(ref.detail.value));
    }

    _handleConfigChange(e:any){
       this.updateRegForm(e.detail.value);
    }

    // updateConfigForm(sUpdate:string){
    //     const configForm:ConfigForm = this.renderRoot.querySelector('config-form') as ConfigForm;
    //     if(configForm) {
    //         configForm.updateTemplate(sUpdate);
    //     }
    // }

    updateRegForm(ref:any){
        const regForm:RegForm = this.renderRoot.querySelector('reg-form') as RegForm;
        if(regForm) {
            regForm.definition = ref.serviceConfig;
        }
    }
}