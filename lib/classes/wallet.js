/* * Copyright 2017 Atticlab LLC.
 * Licensed under the Apache License, Version 2.0
 * See the LICENSE or LICENSE_UA file at the root of this repository
 * Contact us at http://atticlab.net
 */
const _ = require('lodash');
const sjcl = require('sjcl');
const validate = require('../helpers/validate.js');

class Wallet {
    constructor(api, params) {
        var self = this;
        var params = _.cloneDeep(params);
        var properties = [
            'username',
            'rawMasterKey',
            'rawWalletId',
            'rawWalletKey',
            'rawMainData',
            'rawKeychainData',
            'phone',
            'email',
            'HDW',
            'passwordHash'
            // 'userId',
            // 'updatedAt',
            // 'endTime'
        ];

        _.each(properties, function (param) {
            self[param] = params[param];
        });

        this.api = api;
        this.updateEncodedValues();
    }

    updateEncodedValues() {
        this.masterKey = sjcl.codec.base64.fromBits(this.rawMasterKey);
        this.walletId = sjcl.codec.base64.fromBits(this.rawWalletId);
        this.walletKey = sjcl.codec.base64.fromBits(this.rawWalletKey);
    }

    getUsername() {
        return this.username;
    };

    getWalletId() {
        return this.walletId;
    };

    getWalletKey() {
        return this.walletKey;
    };

    getMainData() {
        return this.rawMainData;
    };

    getUpdatedAt() {
        return this.updatedAt;
    };

    getKeychainData() {
        return this.rawKeychainData;
    };

    update(p) {
        var self = this;

        var params = _.cloneDeep(p);
        params = _.extend(params, _.pick(this, [
            'walletId',
            'username',
            'rawWalletKey'
        ]));

        return this.api.update(params)
            .then(resp => {
                for (var field in resp.data) {
                    if (self.hasOwnProperty(field)){
                        self[field] = resp.data[field];
                    }
                }

                return Promise.resolve(self);
            });
    };

    updatePassword(p) {
        var self = this;

        var params = _.cloneDeep(p);
        params = _.extend(params, _.pick(this, [
            'username',
            'walletId',
            'rawMainData',
            'rawKeychainData',
        ]));

        return this.api.updatePassword(params)
            .then(function (updateData) {
                self.rawWalletId = updateData.rawWalletId;
                self.rawWalletKey = updateData.rawWalletKey;
                self.rawMasterKey = updateData.rawMasterKey;

                self.updateEncodedValues();

                return Promise.resolve(self);
            });
    }
}

module.exports = Wallet;