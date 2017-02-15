const wallet = require('./lib/api/wallets.js');
const errors = require('./lib/helpers/errors.js');
const axios = require('axios');

class SmartApi {
    constructor(options) {
        var self = this;

        this.options = Object.assign({}, {
            // Ttl for api requests
            request_ttl: 30,
        }, options);

        self.axios;
        this.nonce;
        this.ttl;

        this.initAxios();
    }

    initAxios() {
        var self = this;

        self.axios = axios.create();
        self.axios.defaults.baseURL = this.options.host.replace(/\/+$/g, '');
        self.axios.defaults.timeout = this.options.request_ttl * 1000;

        // self.axios.defaults.paramsSerializer = function(params) {
        //     return queryString.stringify(params);
        // };

        // Update nonce on return
        self.axios.interceptors.response.use(function (response) {
            if (response.data.nonce) {
                self.nonce = response.data.nonce;
                self.ttl = response.data.ttl;
            } else {
                // If nonce didn't arrive - let's clear it
                self.nonce = false;
            }

            return response.data;
        }, function (error) {
            self.nonce = null;
            if (error.response && error.response.data) {
                return Promise.reject(errors.getProtocolError(error.response.data.error, error.response.data.message || ''));
            }

            return Promise.reject(new errors.ConnectionError());
        });

        // Sign request before send
        self.axios.interceptors.request.use(function (config) {
            if (self.nonce) {
                var route = config.url.substr(config.baseURL.length);

                // For get parameter we need to add data to query
                if (typeof config.params == 'object' && Object.keys(config.params).length) {
                    route += (route.indexOf('?') === -1 ? '?' : '&') + queryString.stringify(config.params);
                }

                config.headers['Signature'] = crypto.addAuthHeader(route, config.data, self.nonce, self.keypair);
            }

            return config;
        });
    }
}

/**
 * Api object factory
 */
module.exports = class {
    constructor(options) {
        var Api = new SmartApi(options);
        this.Wallet = new wallet(Api);
    }
}