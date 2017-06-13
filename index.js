/* * Copyright 2017 Atticlab LLC.
 * Licensed under the Apache License, Version 2.0
 * See the LICENSE or LICENSE_UA file at the root of this repository
 * Contact us at http://atticlab.net
 */
const errors = require('./lib/helpers/errors.js');
const axios = require('axios');
const admins = require('./lib/api/admins.js');
const agents = require('./lib/api/agents.js');
const bans = require('./lib/api/bans.js');
const cards = require('./lib/api/cards.js');
const companies = require('./lib/api/companies.js');
const enrollments = require('./lib/api/enrollments.js');
const invoices = require('./lib/api/invoices.js');
const merchants = require('./lib/api/merchants.js');
const regusers = require('./lib/api/regusers.js');
const sms = require('./lib/api/sms.js');
const wallets = require('./lib/api/wallets.js');
const qs = require('qs');
const nacl = require('tweetnacl');
const EventEmitter = require('events').EventEmitter;

class SmartApi extends EventEmitter {
    constructor(options) {
        super();

        var self = this;

        this.options = Object.assign({}, {
            // Ttl for api requests
            request_ttl: 30,

            // Enable debug mode
            debug: false,

            // Set this to false to send requests via formdata and not raw json
            sendRaw: true,
        }, options);

        this.axios;
        this.nonce;
        this.ttlExpiration = 0;
        this.keypair;

        this.initAxios();

        setInterval(function () {
            var expires = self.ttlExpiration - Math.floor(Date.now() / 1000);

            if (self.nonce && expires <= 0 ) {
                self.nonce = null;
            }

            self.emit('tick', expires < 0 ? 0 : expires);
        }, 1000);
    }

    initAxios() {
        var self = this;

        self.axios = axios.create();
        self.axios.defaults.baseURL = this.options.host.replace(/\/+$/g, '');
        self.axios.defaults.timeout = this.options.request_ttl * 1000;

        // Update nonce on return
        self.axios.interceptors.response.use(function (response) {
            if (response.data.nonce) {
                self.nonce = response.data.nonce;
                self.ttlExpiration = Math.floor(Date.now() / 1000) + response.data.ttl;
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
            if (!self.options.sendRaw) {
                config.data = qs.stringify(config.data)
            }

            if (self.nonce && self.keypair) {
                let route = config.url.replace(/^(https?:)?(\/{2})?.*?(?=\/)/, '');

                // For get parameter we need to add data to query
                if (typeof config.params == 'object' && Object.keys(config.params).length) {
                    route += (route.indexOf('?') === -1 ? '?' : '&') + qs.stringify(config.params, {
                            encode: false,
                            arrayFormat: 'brackets'
                        });
                }

                var request_data = typeof config.data == 'object' ? JSON.stringify(config.data) : '';
                var data = route + request_data + self.nonce;

                config.headers['Signature'] = [
                    self.nonce,
                    nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(data), self.keypair.rawSecretKey())),
                    self.keypair.rawPublicKey().toString('base64')
                ].join(':');
            }

            if (self.options.debug) {
                config.headers['Debug'] = true;
            }

            return config;
        });
    }

    /**
     * Set account keypair for signing requests
     * @param account_id
     */
    setKeypair(keypair) {
        if (typeof keypair == 'undefined' || typeof keypair.accountId != 'function' || typeof keypair.seed != 'function') {
            throw new errors.InvalidField('keypair');
        }

        this.keypair = keypair;
    }

    refreshNonce() {
        return this.axios.get('/nonce', {
            params: {
                accountId: this.keypair.accountId()
            }
        })
    }

    getNonce(params) {
        if (this.nonce) {
            return Promise.resolve(params)
        }

        if (!this.keypair) {
            return Promise.reject(new errors.InvalidField('keypair', 'Please use setKeypair(YOUR_KEYPAIR) to work with api'));
        }

        return this.axios.get('/nonce', {
                params: {
                    accountId: this.keypair.accountId()
                }
            })
            .then(function () {
                return params;
            });
    }
}

/**
 * Api object factory
 */
module.exports = class {
    constructor(options) {
        this.Api = new SmartApi(options);

        this.Admins = new admins(this.Api);
        this.Agents = new agents(this.Api);
        this.Bans = new bans(this.Api);
        this.Cards = new cards(this.Api);
        this.Companies = new companies(this.Api);
        this.Enrollments = new enrollments(this.Api);
        this.Invoices = new invoices(this.Api);
        this.Merchants = new merchants(this.Api);
        this.Regusers = new regusers(this.Api);
        this.Sms = new sms(this.Api);
        this.Wallets = new wallets(this.Api);
    }

    setKeypair(key) {
        this.Api.setKeypair(key);
    }
}