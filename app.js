'use strict';

const Homey = require('homey');
const ocpapi = require("./lib/ocpapi");

class ElectroluxAEGApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('ElectroluxAEGApp has been initialized');
    // this.homey.settings.unset('ocp.username');
    // this.homey.settings.unset('ocp.password');
    this.ocpApiFactory = ocpapi(
      () => { return this.homey.settings.get('aToken'); },
      (token) => { this.homey.settings.set('aToken', token); },
      () => { return this.homey.settings.get('rToken'); },
      (token) => { this.homey.settings.set('rToken', token); },
      () => { return this.homey.settings.get('tokenexp'); },
      (exp) => { this.homey.settings.set('tokenexp', exp); }
    );

    this.homey.settings.on('set', this.onSettingsChanged.bind(this));
  }

  async getAppliancesByTypes(typesArray) {
    try {
      const http = await this.ocpApiFactory.createHttp();
      const response = await http.get(`/appliances`);
      if (response) {
        this.log('********* appliances[...] ********');
        this.log(JSON.stringify(response.data));
        this.log('********* appliances[...] ********');
        //TODO only return the array of appliances that have applianceData.modelName found in typesArray
        return response.data;
      }
    } catch (e) {
      throw new Error(`Connection Error!?`);
    }
    return [];
  }

  async onSettingsChanged(key) {
    if (key === 'ocp.username' || key === 'ocp.password') {
      this.log(`onSettingsChanged() ${this.homey.settings.get('ocp.username')} ${this.homey.settings.get('ocp.password')} `);
      try {
        await this.ocpApiFactory.login(this.homey.settings.get('ocp.username'), this.homey.settings.get('ocp.password'));
        await this.homey.api.realtime("settingsChanged", "loginSuccess");
      } catch (e) {
        await this.homey.api.realtime("settingsChanged", "Login/Password Incorrect!!");
      }
    }
  }
}

module.exports = ElectroluxAEGApp;
