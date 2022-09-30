import { html, css, LitElement} from "lit";
import {customElement, state} from "lit/decorators.js";
import './code-editor';
import './config-form';
import './reg-form';
import {RegForm} from "./reg-form";
import * as yaml from 'js-yaml'
import {observer} from "./@material/web/compat/base/observer";
import {dump} from "js-yaml";
import './@material/web/button/tonal-button.ts';
import './@material/web/navigationtab/navigation-tab';

@customElement('main-app')
export class MainApp extends LitElement {
    static styles = css`
      :host {
        width:100%;
        height: 100%;
      }
      .main-layout {
        display: flex;
        flex:1;
      }
      .pageLayout {
        display:flex;
        width:1000px;
        padding:0px;
      }
      .leftNav {
        width:150px;
        background-color:#CCC;
      }
      .mainBody {
        width: 850px;
        padding:20px;
      }
      .tabBar {
        // max-width: calc(100% - 2 * 40px);
        width:800px;
        margin: 0 auto;
        padding: 16px 40px;
        border-bottom: 1px solid grey;
        text-align: center;
        white-space: nowrap;
        overflow-x: auto;
        --md-tonal-button-container-color: aliceblue;
        --md-tonal-button-hover-container-elevation-shadow: none;
      
      }
    `;

    @state()
    currentKongConfig: string = '#TODO';

    @state()
    currentRegState: any = {};

    private getService():any {
        return this.currentRegState.services![0];
    }


    @state()
    @observer(function(this: MainApp) {
        const ref:any  = yaml.load(this.currentDeckRegistration);
        this.currentRegState = ref;
    })
    currentDeckRegistration: string = '_format_version: "3.0"\n' +
        'services:\n' +
        '- connect_timeout: 60000\n' +
        '  host: \n' +
        '  name: \n' +
        '  port: 443\n' +
        '  protocol: https\n' +
        '  read_timeout: 60000\n' +
        '  retries: 5\n' +
        '  write_timeout: 60000\n' +
        '  routes:\n' +
        '  - name: root\n' +
        '    paths:\n' +
        '    - /\n' +
        '    preserve_host: false\n' +
        '    protocols:\n' +
        '    - http\n' +
        '    - https\n' +
        '    regex_priority: 0\n' +
        '    strip_path: true\n' +
        '  plugins:\n' +
        '  - name: cors\n' +
        '    config:\n' +
        '      origins:\n' +
        '      - http://mockbin.com\n' +
        '      methods:\n' +
        '      - GET\n' +
        '      - POST\n' +
        '      headers:\n' +
        '      - Accept\n' +
        '      - Accept-Version\n' +
        '      - Content-Length\n' +
        '      - Content-MD5\n' +
        '      - Content-Type\n' +
        '      - Date\n' +
        '      - X-Auth-Token\n' +
        '      exposed_headers:\n' +
        '      - X-Auth-Token\n' +
        '      credentials: true\n' +
        '      max_age: 3600\n' +
        '\n';


    render(){
        return html`
            <div class="main-layout">
                <config-form id="configForm" style="width:500px;flex:1;position: relative" @change="${this._handleConfigChange}" currentKongConfig=${this.currentKongConfig} ></config-form>
                <div class="pageLayout">
                    <div class="leftNav">
                        <div>Service</div>
                        <div>Routes</div>
                        <div>Default</div>
                    </div>
                    <div class="mainBody">
                        <div class="tabBar">
                            <md-tonal-button label="General"></md-tonal-button>
                            <md-tonal-button label="Authentication"></md-tonal-button>
                            <md-tonal-button label="Security"></md-tonal-button>
                            <md-tonal-button label="Traffic Control"></md-tonal-button>
                            <md-tonal-button label="Transformations"></md-tonal-button>
                            <md-tonal-button label="Validation"></md-tonal-button>
                        </div>
                        <reg-form id="regForm" @change="${this._handleFormInput}"></reg-form>
                    </div>
                </div>
                <code-editor id="codeEditor" style="flex:1"   code=${this.currentDeckRegistration} language="yaml">
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
        const updateRoot:any = ref.detail.value;
        console.log(JSON.stringify(updateRoot));

        const currentService: any = this.getService();
        console.log(JSON.stringify(currentService));

        const svcConfig = updateRoot.service.config
        for(const prop in svcConfig){
            currentService[prop] = svcConfig[prop];
        }

        // Update demo plugin {"service":{"plugins":[{"name":"cors","config.methods":["DELETE"]}]},"routes":[]}
        const updatePlugins = updateRoot.service!.plugins || [];
        updatePlugins.forEach((updatePlugin:any)=> {
            const svcPlugin: any = currentService.plugins.find((p:any) => p.name === updatePlugin.name);
            const config: any = svcPlugin.config;
            for(const prop in updatePlugin.config){
                config[prop] = updatePlugin.config[prop];
            }
        });

        const updateState = dump(this.currentRegState, {
            'styles': {
                '!!null': 'canonical' // dump null as ~
            },
            'sortKeys': true        // sort object keys
        });

        this.currentDeckRegistration = updateState;

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