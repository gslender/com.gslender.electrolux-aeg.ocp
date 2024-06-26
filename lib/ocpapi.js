
/**
 * OCPAPI 
 * 
 * This module provides an interface to interact with ocp.electrolux.one via 
 * their public API. Requires a specialised version of Gigya to function.
 * 
 * Author: Grant Slender (gslender@gmail.com)
 * 
 * 
 * License: GNU General Public License v3.0
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

module.exports = function (getAccessToken, setAccessToken, getRefreshToken, setRefreshToken, getTokenExpirationDate, setTokenExpirationDate) {
    const { Gigya } = require('@gslender/gigya');
    const axios = require('axios');

    const EU1_ACCOUNTS_API_KEY = '4_JZvZObbVWc1YROHF9e6y8A';
    const API_KEY = '2AMqwEV5MqVhTKrRCyYfVF8gmKrd2rAmp7cUsfky';
    const AUTH_API_URL = 'https://api.ocp.electrolux.one/one-account-authorization/api/v1';
    const APPLIANCE_API_URL = 'https://api.ocp.electrolux.one/appliance/api/v2';

    const ocpAccountAuth = axios.create({
        baseURL: AUTH_API_URL,
        headers: {
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8',
            'Authorization': 'Bearer',
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
            'User-Agent': 'Ktor client'
        }
    });

    let giga_accounts_api_key = EU1_ACCOUNTS_API_KEY;
    let giga_dc_region = 'eu1';
    const gigya = new Gigya(giga_accounts_api_key, giga_dc_region);

    let loginResponseVToken = null;
    let jwtResponse;

    async function refreshAccessToken() {
        try {
            const response = await ocpAccountAuth.post('/token', {
                grantType: 'refresh_token',
                clientId: 'ElxOneApp',
                refreshToken: getRefreshToken(),
                scope: ''
            });

            setAccessToken(response.data.accessToken);
            setRefreshToken(response.data.refreshToken);
            setTokenExpirationDate(Date.now() + response.data.expiresIn * 1000);
        } catch (error) {
            setAccessToken('');
            setRefreshToken('');
            setTokenExpirationDate(Date.now());
            throw new Error(`${error.stack}`);
        }
    }

    function isExpired() {
        return getTokenExpirationDate() <= Date.now()
    }

    return {
        getVToken: function () {
            return loginResponseVToken;
        },
        login: async function (username, password) {

            try {
                const loginResponse = await gigya.accounts.login({
                    loginID: username,
                    password: password,
                    targetEnv: 'mobile',
                    sessionExpiration: -2
                });

                jwtResponse = await gigya.accounts.getJWT({
                    targetUID: loginResponse.UID,
                    fields: 'country',
                    oauth_token: loginResponse.sessionInfo?.sessionToken,
                    secret: loginResponse.sessionInfo?.sessionSecret
                });
                const response = await ocpAccountAuth.post(
                    '/token',
                    {
                        grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
                        clientId: 'ElxOneApp',
                        idToken: jwtResponse.id_token,
                        scope: ''
                    },
                    {
                        headers: {
                            'Origin-Country-Code': 'PL'
                        }
                    }
                );

                setAccessToken(response.data.accessToken);
                setRefreshToken(response.data.refreshToken);
                setTokenExpirationDate(Date.now() + response.data.expiresIn * 1000);

            } catch (error) {
                setAccessToken('');
                setRefreshToken('');
                setTokenExpirationDate(Date.now());
                throw new Error(`${error.stack}`);
            }
        },
        sendOTP: async function (username) {
            try {
                const loginResponse = await gigya.accounts.otp.sendCode({
                    email: username,
                    targetEnv: 'mobile',
                    sessionExpiration: -2
                });
                loginResponseVToken = loginResponse.vToken;
            } catch (error) {
                throw new Error(`${error.stack}`);
            }
        },
        loginOTP: async function (vToken, code) {
            try {
                const loginResponse = await gigya.accounts.otp.login({
                    vToken: vToken,
                    code: code,
                    targetEnv: 'mobile',
                    sessionExpiration: -2
                });

                jwtResponse = await gigya.accounts.getJWT({
                    targetUID: loginResponse.UID,
                    fields: 'country',
                    oauth_token: loginResponse.sessionInfo?.sessionToken,
                    secret: loginResponse.sessionInfo?.sessionSecret
                });
                const response = await ocpAccountAuth.post(
                    '/token',
                    {
                        grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
                        clientId: 'ElxOneApp',
                        idToken: jwtResponse.id_token,
                        scope: ''
                    },
                    {
                        headers: {
                            'Origin-Country-Code': 'PL'
                        }
                    }
                );

                setAccessToken(response.data.accessToken);
                setRefreshToken(response.data.refreshToken);
                setTokenExpirationDate(Date.now() + response.data.expiresIn * 1000);

            } catch (error) {
                setAccessToken('');
                setRefreshToken('');
                setTokenExpirationDate(Date.now());
                throw new Error(`${error.stack}`);
            }
        },
        getTokens: function () {
            return { 'accessToken': accessToken, 'refreshToken': refreshToken };
        },
        refreshAccessToken: async function () {
            try {
                await refreshAccessToken();
            } catch (error) {
                throw new Error(`${error.stack}`);
            }
        },
        createHttp: async function () {
            if (isExpired()) {
                await refreshAccessToken();
            }
            try {
                return axios.create({
                    baseURL: APPLIANCE_API_URL,
                    headers: {
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept-Charset': 'utf-8',
                        'x-api-key': API_KEY,
                        'Accept': 'application/json',
                        'User-Agent': 'Ktor client',
                        'Authorization': `Bearer ${getAccessToken()}`
                    }
                });
            } catch (error) {
                throw new Error(`${error.stack}`);
            }
        }
    }
}