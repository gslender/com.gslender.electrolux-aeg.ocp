'use strict';

const { Driver } = require('homey');

class AirPurifierDriver extends Driver {

  async onPairListDevices() {

    var devices = [];
    const appliances = await this.homey.app.getAppliancesByTypes(['AP']); // don't yet know what this would be??

    this.log('********* appliances[...] ********');
    this.log(JSON.stringify(appliances,null,2));
    this.log('********* appliances[...] ********');
    
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

module.exports = AirPurifierDriver;
