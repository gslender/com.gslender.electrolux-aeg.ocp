# Electrolux AEG Connect

connected appliances and services - for an effortlessly smarter home

## What is this?
This Homey App will connect to 
* the Gigya Identity Platfrom (owned by SAP) via the NPM @gslender/gigya API
* the Electrolux OCP (OneConnectedPlatform) API at https://api.ocp.electrolux.one/appliance/api/v2
* and support both Electrolux and AEG 

After successful login, the Homey App will interogate the OCP API and determine what devices you have configured.

## Setup Guide

This Homey App will require that you have your Electrolux or AEG appliances configured with the EU datacentre, as the API services / range of products are not functioning outside of that region. This app has been tested with the United Kingdom set as the location.

1. You must have a password and email setup in your Electrolux or AEG mobile app (ensure you logout and login using the password and not OTP)
2. Install the Homey App and Configure the Settings using your email and password. These credentials are not persisted, but are used to generate a JWT Claim that is us O
3. Add a Device using the App and choose the relevant type Laundy / Air / Other

