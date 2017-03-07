/* * Copyright 2017 Atticlab LLC.
 * Licensed under the Apache License, Version 2.0
 * See the LICENSE or LICENSE_UA file at the root of this repository
 * Contact us at http://atticlab.net
 */
const wallet = require('../classes/wallet.js');
const validate = require('../helpers/validate.js');
const _ = require('lodash');
const nacl = require('tweetnacl');
const sjcl = require('sjcl');
const crypto = require('../helpers/crypto.js');
const EventEmitter = require('events').EventEmitter;

const EVENT_PROCESS = 'process';

var cachedKdfParams = null;

module.exports = class extends EventEmitter {
    constructor(parent) {
        super();

        this.parent = parent;
    }

    create(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present("username"))
            .then(validate.present("password"))
            .then(validate.present("accountId"))
            .then(validate.string("publicKey"))
            .then(validate.string("mainData"))
            .then(validate.string("keychainData"))
            .then(this.getKdfParams.bind(this))
            .then(params => {
                self.emit(EVENT_PROCESS, {
                    func: 'calculatePassword',
                    type: 'procedure',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                // Create salt
                params.salt = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0

                return crypto.calculatePassword(params, (roundsDone) => {
                    self.emit(EVENT_PROCESS, {
                        func: 'calculatePasswordProgress',
                        type: 'progress',
                        progress: roundsDone,
                    });
                });
            })
            .then(params => {
                self.emit(EVENT_PROCESS, {
                    func: 'calculateMasterKey',
                    type: 'procedure',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                // Calculate master key
                return crypto.calculateMasterKey(params); //S0
            })
            .then(params => {
                let walletId = crypto.deriveWalletId(params.rawMasterKey); // W
                let walletKey = crypto.deriveWalletKey(params.rawMasterKey); // Kw

                params.kdfParams = JSON.stringify(params.kdfParams);
                params.rawWalletId = walletId;
                params.walletId = sjcl.codec.base64.fromBits(walletId);
                params.rawWalletKey = walletKey;

                params.rawMainData = params.mainData;
                params.mainData = crypto.encryptData(params.mainData, walletKey);
                params.mainDataHash = crypto.sha1(params.mainData);

                params.rawKeychainData = params.keychainData;
                params.keychainData = crypto.encryptData(params.keychainData, walletKey);
                params.keychainDataHash = crypto.sha1(params.keychainData);

                self.emit(EVENT_PROCESS, {
                    func: 'walletsCreate',
                    type: 'request',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                let route = params.phoneAsLogin ? '/wallets/createphone' : '/wallets/create';

                return self.parent.axios.post(route, _.pick(params, [
                        'username',
                        'walletId',
                        'accountId',
                        'salt',
                        'publicKey',
                        'mainData',
                        'mainDataHash',
                        'keychainData',
                        'keychainDataHash',
                        'kdfParams',
                    ]))
                    .then(() => {
                        return Promise.resolve(new wallet(self, _.pick(params, [
                            'username',
                            'accountId',
                            'rawMasterKey',
                            'rawWalletId',
                            'rawWalletKey',
                            'rawMainData',
                            'rawKeychainData',
                            'passwordHash'
                        ])));
                    });
            });
    }

    get(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present("username"))
            .then(validate.string("password", true))
            .then(this.getLoginParams.bind(this))
            .then(params => {
                self.emit(EVENT_PROCESS, {
                    func: 'calculatePassword',
                    type: 'procedure',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                return crypto.calculatePassword(params, (roundsDone) => {
                    self.emit(EVENT_PROCESS, {
                        func: 'calculatePasswordProgress',
                        type: 'progress',
                        progress: roundsDone,
                    });
                });
            })
            .then(params => {
                self.emit(EVENT_PROCESS, {
                    func: 'calculateMasterKey',
                    type: 'procedure',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                // TODO: allow to get wallet using password or by providing recovery data: masterKey
                return crypto.calculateMasterKey(params);
            })
            .then(params => {
                // Calculate walletId
                params.rawWalletId = crypto.deriveWalletId(params.rawMasterKey); // W
                params.rawWalletKey = crypto.deriveWalletKey(params.rawMasterKey); // Kw
                params.walletId = sjcl.codec.base64.fromBits(params.rawWalletId);

                self.emit(EVENT_PROCESS, {
                    func: 'walletsGet',
                    type: 'request',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                // Send request
                return self.parent.axios.post('/wallets/get', _.pick(params, [
                        'username',
                        'walletId',
                    ]))
                    .then(function (resp) {
                        return Promise.resolve(_.extend(params, _.pick(resp.data, [
                            'mainData',
                            'keychainData',
                            'email',
                            'phone',
                            'HDW',
                        ])));
                    });
            })
            .then(params => {
                self.emit(EVENT_PROCESS, {
                    func: 'decryptWallet',
                    type: 'procedure',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                // Decrypt wallet
                var p = _.pick(params, [
                    'username',
                    'rawMasterKey',
                    'rawWalletId',
                    'rawWalletKey',
                    'rawMainData',
                    'rawKeychainData',
                    'email',
                    'phone',
                    'HDW',
                    'passwordHash'
                ]);

                p.rawMainData = crypto.decryptData(params.mainData, params.rawWalletKey);
                p.rawKeychainData = crypto.decryptData(params.keychainData, params.rawWalletKey);

                return Promise.resolve(new wallet(self, p));
            })
    }

    /**
     * Checks whether wallet with this username doesn't exist in keyserver
     * @param params
     */
    notExist(params) {
        return Promise.resolve(params)
            .then(validate.present("username"))
            .then(params => {
                return this.parent.axios.post('/wallets/notexist', _.pick(params, [
                    'username',
                ]));
            })
    }

    update(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present("update"))
            .then(validate.present("walletId"))
            .then(validate.present("username"))
            .then(validate.present("rawWalletKey"))
            .then(validate.string("secretKey"))
            .then(this.parent.getNonce.bind(this.parent))
            .then(params => {
                return self.parent.axios.post('/wallets/update', params.update);
            });
    }

    updatePassword(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present("walletId"))
            .then(validate.present("rawMainData"))
            .then(validate.present("rawKeychainData"))
            .then(validate.string("newPassword"))
            .then(validate.string("secretKey"))
            .then(this.getKdfParams.bind(this))
            .then(params => {
                self.emit(EVENT_PROCESS, {
                    func: 'calculatePassword',
                    type: 'procedure',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                params.salt = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0
                params.password = params.newPassword;

                return crypto.calculatePassword(params, (roundsDone) => {
                    self.emit(EVENT_PROCESS, {
                        func: 'calculatePasswordProgress',
                        type: 'progress',
                        progress: roundsDone,
                    });
                });
            })
            .then(this.parent.getNonce.bind(this.parent))
            .then(params => {
                self.emit(EVENT_PROCESS, {
                    func: 'calculateMasterKey',
                    type: 'procedure',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                params.oldWalletId = params.walletId;
                // params.password = params.newPassword;

                // Calculate master key
                return crypto.calculateMasterKey(params); //S0
            })
            .then(params => {
                let walletId = crypto.deriveWalletId(params.rawMasterKey); // W
                let walletKey = crypto.deriveWalletKey(params.rawMasterKey); // Kw

                params.kdfParams = JSON.stringify(params.kdfParams);

                params.rawWalletId = walletId;
                params.walletId = sjcl.codec.base64.fromBits(walletId);
                params.rawWalletKey = walletKey;

                params.mainData = crypto.encryptData(params.rawMainData, walletKey);
                params.mainDataHash = crypto.sha1(params.mainData);

                params.keychainData = crypto.encryptData(params.rawKeychainData, walletKey);
                params.keychainDataHash = crypto.sha1(params.keychainData);

                let data = _.pick(params, [
                    'walletId',
                    'salt',
                    'kdfParams',
                    'mainData',
                    'mainDataHash',
                    'keychainData',
                    'keychainDataHash',
                ]);

                self.emit(EVENT_PROCESS, {
                    func: 'walletsUpdatepassword',
                    type: 'request',
                    prevTime: Math.floor(Date.now() / 1000)
                });

                return self.parent.axios.post('/wallets/updatepassword', data)
                    .then(() => {
                        var updateData = {
                            rawWalletId: params.rawWalletId,
                            rawWalletKey: params.rawWalletKey,
                            rawMasterKey: params.rawMasterKey,
                        };

                        return Promise.resolve(updateData);
                    });
            })
    }

    getKdfParams(params) {
        var self = this;

        // User provided kdfParams
        if (_.isObject(params.kdfParams)) {
            return Promise.resolve(params);
        }

        // kdfParams has been cached
        if (cachedKdfParams) {
            params.kdfParams = cachedKdfParams;
            return Promise.resolve(params);
        }

        self.emit(EVENT_PROCESS, {
            func: 'getKdfParams',
            type: 'request',
            prevTime: Math.floor(Date.now() / 1000)
        });

        return this.parent.axios.get('/wallets/getkdf')
            .then(function (resp) {
                cachedKdfParams = resp.data;
                params.kdfParams = resp.data;
                return Promise.resolve(params);
            })
    }

    getLoginParams(params) {
        var self = this;

        self.emit(EVENT_PROCESS, {
            func: 'getLoginParams',
            type: 'request',
            prevTime: Math.floor(Date.now() / 1000)
        });

        return this.parent.axios.post('/wallets/getparams', _.pick(params, ['username']))
            .then(function (resp) {
                params.salt = resp.data.salt;
                params.kdfParams = JSON.parse(resp.data.kdfParams);

                return Promise.resolve(params);
            })
    }

    getWalletData(params) {
        var self = this;

        self.emit(EVENT_PROCESS, {
            func: 'getWalletData',
            type: 'request',
            prevTime: Math.floor(Date.now() / 1000)
        });

        return Promise.resolve(params)
            .then(validate.string("email", true))
            .then(validate.string("phone", true))
            .then(validate.string("accountId", true))
            .then(validate.string("username", true))
            .then(function (params) {
                return self.parent.axios.post('/wallets/getdata', _.pick(params, [
                    'email',
                    'phone',
                    'accountId',
                    'username'
                ]));
            });
    }

    encryptAuthData(params) {
        var self = this;

        self.emit(EVENT_PROCESS, {
            func: 'encryptAuthData',
            type: 'procedure',
            prevTime: Math.floor(Date.now() / 1000)
        });

        return Promise.resolve(params)
            .then(validate.present("passwordHash"))
            .then(validate.present("pin"))
            .then((params) => {
                let key = sjcl.hash.sha256.hash(params.pin);
                params.encryptedPasswordHash = crypto.encryptData(params.passwordHash, key);

                return Promise.resolve(_.pick(params, [
                    'encryptedPasswordHash'
                ]));
            })
    }

    decryptAuthData(params) {
        var self = this;

        self.emit(EVENT_PROCESS, {
            func: 'decryptAuthData',
            type: 'procedure',
            prevTime: Math.floor(Date.now() / 1000)
        });

        return Promise.resolve(params)
            .then(validate.present("encryptedPasswordHash"))
            .then(validate.present("pin"))
            .then((params) => {
                let key = sjcl.hash.sha256.hash(params.pin);
                params.decryptedPasswordHash = crypto.decryptData(params.encryptedPasswordHash, key);

                return Promise.resolve(_.pick(params, [
                    'decryptedPasswordHash'
                ]));
            })
    }

};