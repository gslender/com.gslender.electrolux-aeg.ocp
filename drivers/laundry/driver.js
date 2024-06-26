'use strict';

const { Driver } = require('homey');

class LaundryDriver extends Driver {

  async onPairListDevices() {

    var devices = [];
    const appliances = await this.homey.app.getAppliancesByTypes(['WM','TD']); 
    
    for (let i = 0; i < appliances.length; i++) {
      const appliance = appliances[i];
      const device = { 
        name: appliance.applianceData.applianceName,
        data: { id: appliance.applianceId } 
      };
      devices.push(device);
    }

    return devices;
  }

}

module.exports = LaundryDriver;
