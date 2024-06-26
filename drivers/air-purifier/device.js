'use strict';

const { Device } = require('homey');

function hasProperties(obj, props) {
  if (!obj) return false;
  return props.every(prop => obj.hasOwnProperty(prop));
}

class AirPurifierDevice extends Device {

  async onInit() {
  }

  async updateCapabilityValues(state) {
  }
}
module.exports = AirPurifierDevice;