import { html, css, LitElement} from "lit";
import {customElement, state} from "lit/decorators.js";
import './code-editor';
import './config-form';
import './reg-form';
import './button-tabs';
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
      .link {
        color:blue;
        cursor:pointer;
      }
      .link:hover {
        text-decoration: underline;
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
    currentFormConfiguration: string = '#TODO';

    @state()
    registrationConfig: any = { sections: []};

    @state()
    contextType: string = 'service';


    @state()
    currentRegState: any = {};

    @state()
    currentRouteName: string | null = null;

    private getService():any {
        if(this.currentRegState && this.currentRegState.services && this.currentRegState.services.length > 0) {
            return this.currentRegState.services[0];
        } else {
            return { routes: []};
        }
    }

    private getRoutes():any[] {
        return this.getService().routes || [];
    }

    private setServiceContext(){
        this.contextType = 'service';
        this.currentRegistrationSection = 'ServiceSettings';
    }

    private setActiveRoute(routeName:string){
        console.log(routeName);
        this.contextType = 'route';
        this.currentRegistrationSection = 'RouteSettings';
       // this.currentRouteName = routeName;
    }


    @state()
    @observer(function(this: MainApp) {
        const ref:any  = yaml.load(this.currentDeckRegistration);
        this.currentRegState = ref;
    })
    currentDeckRegistration: string = '_format_version: "3.0"\n';


    @state()
    currentRegistrationSection: string = 'ServiceSettings';

    private navigateSection(evt:any){
        this.currentRegistrationSection = evt.detail.value;
    }

    render(){
        return html`
            <div class="main-layout">
                <config-form id="configForm" style="width:500px;flex:1;position: relative" @change="${this._handleConfigChange}" formConfiguration=${this.currentFormConfiguration} ></config-form>
                <div class="pageLayout">
                    <div class="leftNav">
                        <div class="link" @click=${this.setServiceContext}>Service</div>
                        <div>Routes</div>
                        ${this.getRoutes().map((ref:any) => {
                            return html`<div class="link" @click=${() => this.setActiveRoute(ref.name)}>${ref.name}</div>`;
                        })}
                    </div>
                    <div class="mainBody">
                        <button-tabs contextType=${this.contextType}  @change=${this.navigateSection} currentTab=${this.currentRegistrationSection} .tabList=${this.registrationConfig.sections}></button-tabs>
                        <reg-form id="regForm" .savedSettings=${this.currentRegState} .registrationConfig=${this.registrationConfig} section=${this.currentRegistrationSection} @change="${this._handleFormInput}"></reg-form>
                    </div>
                </div>
                <code-editor id="codeEditor" style="flex:1"   code=${this.currentDeckRegistration} language="yaml">
                </code-editor>
            </div>
        `;
    }



    protected async firstUpdated() {
        // const resp = await fetch('http://localhost:3000/api/formDefinition');
        // const definition = await resp.text();
        // const ref  = yaml.load(data);
        // this.updateRegForm(ref);

        const exampleResp = await fetch('http://localhost:3000/api/loadRegistration');
        const currentReg = await exampleResp.text();
        this.currentDeckRegistration = currentReg;

        // this.updateConfigForm(definition); //

        const resp = await fetch('http://localhost:3000/api/formDefinition');
        const definition = await resp.text();
        this.currentFormConfiguration = definition;
        const ref:any  = yaml.load(definition);
        this.registrationConfig = ref.registrationConfig || [];

    }

    // updateConfigForm(sConfig:string){
    //     this.registrationConfig = sConfig;
    //     console.log(sConfig);
    //
    // }

    private _handleFormInput(ref:any){
        const updateRoot:any = ref.detail.value;
        console.log(JSON.stringify(updateRoot));

        const currentService: any = this.getService();
        console.log(JSON.stringify(currentService));

        const svcConfig = updateRoot.service;
        for(const prop in svcConfig){
            if(prop !== 'plugins') {
                currentService[prop] = svcConfig[prop];
            }
        }

        // Update demo plugin {"service":{"plugins":[{"name":"cors","config.methods":["DELETE"]}]},"routes":[]}
        const updatePlugins = updateRoot.services![0]!.plugins || [];
        updatePlugins.forEach((updatePlugin:any)=> {
            let svcPlugin: any = currentService.plugins.find((p:any) => p.name === updatePlugin.name);
            if(!svcPlugin){
                currentService.plugins.push(updatePlugin);
            } else {
                const config: any = svcPlugin.config;
                for (const prop in updatePlugin.config) {
                    config[prop] = updatePlugin.config[prop];
                }
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
       // this.updateRegForm(e.detail.value);
        const reg = e.detail.value;
        this.registrationConfig = !!reg.registrationConfig && !!reg.registrationConfig.sections ? reg.registrationConfig : { sections:[]};
    }

    // updateConfigForm(sUpdate:string){
    //     const configForm:ConfigForm = this.renderRoot.querySelector('config-form') as ConfigForm;
    //     if(configForm) {
    //         configForm.updateTemplate(sUpdate);
    //     }
    // }

    // updateRegForm(ref:any){
    //     const regForm:RegForm = this.renderRoot.querySelector('reg-form') as RegForm;
    //     if(regForm) {
    //         regForm.formDefinition = ref.registrationConfig;
    //     }
    // }
}