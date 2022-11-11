import { html, css, LitElement} from "lit";
import {customElement, query, state} from "lit/decorators.js";
import './code-editor';
import './config-form';
import './reg-form';
import './button-tabs';
import * as yaml from 'js-yaml'
import {dump} from "js-yaml";
import './@material/web/button/tonal-button.ts';
import './@material/web/navigationtab/navigation-tab';
import './@material/web/list/list';
import './@material/web/list/list-item';
import './@material/web/textfield/outlined-text-field';
import './@material/web/checkbox/checkbox';
import './@material/web/icon/icon';
import './@material/web/segmentedbuttonset/outlined-segmented-button-set';
import './@material/web/segmentedbutton/outlined-segmented-button';
import './@material/web/switch/switch';
import {classMap} from "lit/directives/class-map.js";
import {RegForm} from "./reg-form";
import {CodeEditor} from "./code-editor";

@customElement('main-app')
export class MainApp extends LitElement {
    static styles = css`
      :host {
        width:100%;
        height: 100%;
        --md-list-list-item-one-line-container-height: 30px;
        --md-outlined-field-container-height: 20px;
        font-family: Roboto;
      }
      .link {
        color:blue;
        cursor:pointer;
      }
      #favDialog {
        height:200px;
        width:300px;
        z-index: 1000;
      }
      #txtOpenAPI{
          height: 128px;
          width: 290px; 
      }
      .link:hover {
        // text-decoration: underline;
      }
      .tab-row {
        display: flex;
        align-items: center;
      }
      .linkButton {
        text-decoration: underline;
        border:none;
        background-color: transparent;
        color:blue;
      }
      .saveDeckBtn {
        margin-left:30px;
      }
      .main-layout {
        display: flex;
        flex:1;
      }
      .rightPane {
        display: flex;
        width: 900px;
        padding: 0px;
        flex-direction: column;
      }
      .rightPane.flex {
        flex:1;
        width:unset;
      }

      .deckPreviewLabel {
        padding-top:10px;
        height:30px;
        border-bottom: 1px outset white;
        border-right: 1px outset white;
        text-indent:10px;
        margin-right:20px;
        background-color: rgba(156, 179, 179, 0.18);
      }
      .previewPane {
        flex:1;
        display:flex;
        overflow:scroll;
      }
      .deckViewerPane {
        height:300px;
        overflow:scroll;;
      }
      
      
      .leftNav {
        width:170px;
        padding-top:100px;
      }
      .mainBody {
        width: 850px;
        padding:20px;
        background-color: white;
        z-index: 100;
        --md-outlined-text-field-container-height:30px;
      }
      .routePrefix {
        margin-left:20px;
      }
      .selectedNav {
        // --md-list-list-item-container-color:blue;
        text-decoration: underline;
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
      .hidden {
        display:none;
      }
      
      
      md-outlined-segmented-button {
        background-color:white;
      }
      .configForm {
       flex:1;position: relative;
        min-width: 600px;
        flex-direction: column;
        display:flex;
      }
      .configForm.setWidth {
        width:800px;
        flex:unset;
      }
      .deckOutput {
        flex:1;
        min-width: 500px;
      }
      #serverOutput {
        display:none;
        flex:1;
        background-color: black;
        color:limegreen;
        height:100%;
        padding:20px;
        overflow: scroll;
        margin-right:20px;
        
      }
      .closeServer {
        position: absolute;
        right: 30px;
      }
      
      .deckOutput.setWidth {
        width:800px;
        flex:unset;
      }
    `;

    @query('#favDialog') importOpenAPIModal!: HTMLElement;
    @query('#txtOpenAPI') txtOpenAPISpec!: HTMLTextAreaElement;
    @query('#serverOutput') serverOutput!: HTMLElement;
    @query('#deckOutput') deckOutput!: HTMLElement;

    @state()
    currentFormConfiguration: string = '#TODO';

    @state()
    registrationConfig: any = { sections: []};

    @state()
    contextType: string = 'service';


    currentRegState: any = {};

    @state()
    currentRouteName: string | null = null;

    @state()
    visibleSection: string = 'both';

    private get configHidden():boolean {
        return this.visibleSection === 'left';
    }

    private get deckOutputHidden():boolean{
        return this.visibleSection === 'right';
    }

    private getService():any {
        if(this.currentRegState && this.currentRegState.services && this.currentRegState.services.length > 0) {
            return this.currentRegState.services[0];
        } else {
            return { routes: []};
        }
    }

    private toggleNav(section:string){
        this.visibleSection = section;
    }

    private async syncToKong() {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: this.getService().name, deck: this.currentDeckRegistration})
        };
        const resp = await fetch('http://localhost:3000/api/runKongSync/svc-abc', requestOptions);

        const data = await resp.json();
        this.deckOutput.style.display = 'none';
        this.serverOutput.style.display = 'block';
        this.serverOutput.querySelector('pre')!.innerHTML = data.result;

        // .then(response => response.json())
        // .then(data => element.innerHTML = data.id );
    }

    closeServerOutput(){
        this.deckOutput.style.display = 'block';
        this.serverOutput.style.display = 'none';
    }

    private getRoutes():any[] {
        return this.getService().routes || [];
    }

    private setServiceContext(){
        this.contextType = 'service';
        this.currentRouteName = null;
        this.currentRegistrationSection = 'ServiceSettings';
    }

    private setActiveRoute(routeName:string){
        console.log(routeName);
        const nextSection = this.contextType === 'service' ? 'RouteSettings' : this.currentRegistrationSection;
        this.contextType = 'route';
        this.currentRegistrationSection = nextSection;
        this.currentRouteName = routeName;
    }

    private async importOpenAPISpec(){
        const spec = this.txtOpenAPISpec.value;
        // todo: add validation
        this.isImportModalVisible = false;
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({"spec":spec})
        };
        const resp = await fetch('http://localhost:3000/api/translateOpenAPI', requestOptions);
        const specTxt = await resp.json();
        const updateState = dump(specTxt, {
            // 'styles': {
            //     '!!null': 'canonical' // dump null as ~
            // },
            // 'sortKeys': true        // sort object keys
        });

        this.setCurrentDeckRegistration(updateState);
        this.updateRegForm();
    }


    private currentDeckRegistration: string = '_format_version: "3.0"\n';
    //
    private setCurrentDeckRegistration(sDeck:string){
        this.currentDeckRegistration = sDeck;
        this.currentRegState = yaml.load(sDeck);
        this.updateDeckOutput();
    }


    @state()
    currentRegistrationSection: string = 'ServiceSettings';

    @state()
    isImportModalVisible: boolean = false;

    // @query('#regForm')
    // regForm: RegForm;


    private navigateSection(evt:any){
        this.currentRegistrationSection = evt.detail.value;
    }

    private showImport(){
        this.isImportModalVisible = true;
    }

    render(){
        return html`
            <md-outlined-segmented-button-set style="display:none;z-index:1000;width:100px;position:absolute;bottom:10px;left:20px;background-color: white;">
                <md-outlined-segmented-button @click=${()=>this.toggleNav('right')} label="Left"></md-outlined-segmented-button>
                <md-outlined-segmented-button selected @click=${()=>this.toggleNav('both')}  label="Both"></md-outlined-segmented-button>
                <md-outlined-segmented-button @click=${()=>this.toggleNav('left')}  label="Right"></md-outlined-segmented-button>
            </md-outlined-segmented-button-set>
            <dialog id="favDialog" @close=${this.importOpenAPISpec} ?open=${this.isImportModalVisible}>
                <form method="dialog">
                    <div>
                        <label>Import Open API Spec</label>
                        <textarea id="txtOpenAPI">openapi: "3.0.0"
info:
version: 1.0.0
title: Swagger Petstore
servers:
- url: http://petstore.swagger.io/v1
paths:
  /pets:
    get:
      summary: Get all pets</textarea>
                    </div>
                    <div>
                        <button value="cancel">Cancel</button>
                        <button id="confirmBtn" value="default">Confirm</button>
                    </div>
                </form>
            </dialog>
            <div class="main-layout">
                <div class="${classMap({configForm:true, hidden:this.configHidden, setWidth:(this.visibleSection !== 'both')})}">
                    <label class="deckPreviewLabel">Form Configuration</label>
                    <config-form id="configForm"   @change="${this._handleConfigChange}" formConfiguration=${this.currentFormConfiguration} ></config-form>
                </div>
                <div class="${classMap({rightPane:true, flex:(this.visibleSection !== 'both')})}"  >
                    <label class="deckPreviewLabel">Registration Preview</label>
                    <div class="previewPane">
                        <div class="leftNav">
                        <md-list>
                        <md-list-item class="${classMap({'link':true, 'selectedNav': this.contextType === 'service'})}" @click=${this.setServiceContext} headline="Service"></md-list-item>
                        <md-list-item headline="Routes" style="--md-ripple-hover-state-layer-color:transparent;">
                            
                        </md-list-item>
                        
                        ${this.getRoutes().map((ref:any) => {
            return html`<md-list-item class="${classMap({'link':true, 'selectedNav': this.currentRouteName === ref.name})}" headline=${ref.name} @click=${() => this.setActiveRoute(ref.name)}>
                                  <span class="routePrefix" slot="start">
                            <md-icon class="mdc-button__icon" style="font-size: 16px;">
                                  settings
                                </md-icon>
                            </span></md-list-item>`;
        })}
                        </md-list>
                    </div>
                        <div class="mainBody">
                            <div class="tab-row"><button-tabs style="width:800px" contextType=${this.contextType}  @change=${this.navigateSection} currentTab=${this.currentRegistrationSection} .tabList=${this.registrationConfig.sections}></button-tabs>
                                
                               
                            </div>
                            <reg-form id="regForm" routeName=${this.currentRouteName}  contextType=${this.contextType} section=${this.currentRegistrationSection} @change="${this._handleFormInput}"></reg-form>
                        </div>
                    </div>
                    <div class="deckPreviewLabel"><label>Deck Output</label><button @click=${this.syncToKong} class="saveDeckBtn linkButton">Save</button> <button @click=${this.showImport} class="linkButton">Import OpenAPI Spec</button></div>
                    <div class="deckViewerPane">
                        <code-editor id="deckOutput" class="${classMap({deckOutput:true, hidden:this.deckOutputHidden, setWidth:(this.visibleSection !== 'both')})}" language="yaml">
                        </code-editor>
                        <div id="serverOutput">
                            <span class="closeServer" @click=${this.closeServerOutput}>X</span>
                            <pre></pre>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }



    protected async firstUpdated() {
        const exampleResp = await fetch('http://localhost:3000/api/loadRegistration/svc-abc');
        const currentReg = await exampleResp.text();
        this.setCurrentDeckRegistration(currentReg);

        const resp = await fetch('http://localhost:3000/api/formDefinition');
        const definition = await resp.text();
        this.currentFormConfiguration = definition;
        const ref:any  = yaml.load(definition);
        this.registrationConfig = ref.registrationConfig || [];
        this.updateRegForm();
    }


    private _handleFormInput(ref:any){
        const updateRoot:any = ref.detail.value;
        console.log(JSON.stringify(updateRoot));

        const currentService: any = this.getService();
        console.log(JSON.stringify(currentService));

        const svcConfig = updateRoot.services[0];
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
                for (const prop in updatePlugin) {
                    if(prop !== 'plugins') {
                        svcPlugin[prop] = updatePlugin[prop];
                    }
                }
                for (const prop in updatePlugin.config) {
                    config[prop] = updatePlugin.config[prop];
                }
            }
        });

        const updateState = dump(this.currentRegState, {
            // 'styles': {
            //     '!!null': 'canonical' // dump null as ~
            // },
            // 'sortKeys': true        // sort object keys
        });

        this.setCurrentDeckRegistration(updateState);
    }

    _handleConfigChange(e:any){
       // this.updateRegForm(e.detail.value);
        const reg = e.detail.value;
        this.registrationConfig = !!reg.registrationConfig && !!reg.registrationConfig.sections ? reg.registrationConfig : { sections:[]};
        this.updateRegForm();
    }

    // updateConfigForm(sUpdate:string){
    //     const configForm:ConfigForm = this.renderRoot.querySelector('config-form') as ConfigForm;
    //     if(configForm) {
    //         configForm.updateTemplate(sUpdate);
    //     }
    // }

    updateRegForm(){
        const regForm:RegForm = this.renderRoot.querySelector('reg-form') as RegForm;
        regForm.registrationConfig = this.registrationConfig;
        regForm.savedSettings = this.currentRegState;
    }

    updateDeckOutput(){
        const codeEditor:CodeEditor = this.renderRoot.querySelector('#deckOutput') as CodeEditor;
        codeEditor.code = this.currentDeckRegistration;
    }
}