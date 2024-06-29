'use strict';

const Homey = require('homey');
const ocpapi = require("./lib/ocpapi");
const stringify = require('json-stringify-safe');

class ElectroluxAEGApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('ElectroluxAEGApp has been initialized');
    // this.homey.settings.unset('ocp.username');
    // this.homey.settings.unset('ocp.password');

    this.pollTimer = {};

    this.ocpApiFactory = ocpapi(
      () => { return this.homey.settings.get('aToken'); },
      (token) => { this.homey.settings.set('aToken', token); },
      () => { return this.homey.settings.get('rToken'); },
      (token) => { this.homey.settings.set('rToken', token); },
      () => { return this.homey.settings.get('tokenexp'); },
      (exp) => { this.homey.settings.set('tokenexp', exp); }
    );

    this.homey.settings.on('set', this.onSettingsChanged.bind(this));

    this.homey.setTimeout(async () => {
      const appliances = await this.getAppliances();
      this.log('********* appliances[...] ********');
      this.log(stringify(appliances));
      this.log('**********************************');
      this.startPolling();
    }, 1000);
  }

  async getAppliancesByTypes(typesArray = []) {
    const appliances = await this.getAppliances();
    this.log('********* appliances[...] ********');
    this.log(stringify(appliances));
    this.log('**********************************');
    const filteredAppliances = appliances.filter(appliance =>
      typesArray.includes(appliance.applianceData.modelName)
    );
    return filteredAppliances;
  }

  async getAppliances() {
    try {
      const http = await this.ocpApiFactory.createHttp();
      const response = await http.get(`/appliances?includeMetadata=true`);
      if (response && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      } else {
        return [];
      }
    } catch (e) {
      throw new Error(`Connection Error!?`);
    }
  }


  async getApplianceState(id) {
    try {
      const http = await this.ocpApiFactory.createHttp();
      const response = await http.get(`/appliances/${id}`);
      return response.data ?? {};
    } catch (e) {
      throw new Error(`Connection Error!?`);
    }
  }

  async onSettingsChanged(key) {
    if (key === 'ocp.username' || key === 'ocp.password') {
      this.log(`onSettingsChanged() ${this.homey.settings.get('ocp.username')} ${this.homey.settings.get('ocp.password')} `);
      try {
        await this.ocpApiFactory.login(this.homey.settings.get('ocp.username'), this.homey.settings.get('ocp.password'));
        await this.homey.api.realtime("settingsChanged", "loginSuccess");
        this.homey.clearInterval(this.pollTimer);
        this.startPolling();
      } catch (e) {
        await this.homey.api.realtime("settingsChanged", "Login/Password Incorrect!!");
      }
    }
  }

  async startPolling() {
    this.log(`${this.id} polling started...`);

    this.pollStatus(true);
    this.pollTimer = this.homey.setInterval(() => {
      this.pollStatus();
      //TODO include as possible setting
    }, 10000); // every 10 seconds     
  }

  async pollStatus(doLog = false) {
    const drivers = this.homey.drivers.getDrivers();
    for (const driver in drivers) {
      const devices = this.homey.drivers.getDriver(driver).getDevices();
      for (const device of devices) {
        const applianceId = device.getData().id;
        const state = await this.getApplianceState(applianceId);

        if (doLog) {
          this.log('*********** applianceId **********');
          this.log(stringify(applianceId));
          this.log('********* appliance state ********');
          this.log(stringify(state));
          this.log('**********************************');
        }
        device.updateCapabilityValues(state);
      }
    }
  }
}

module.exports = ElectroluxAEGApp;
