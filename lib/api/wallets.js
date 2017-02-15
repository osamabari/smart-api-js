const wallet = require('../classes/wallet.js');
const validate = require('../helpers/validate.js');
const _ = require('lodash');
const nacl = require('tweetnacl');
const sjcl = require('sjcl');
const crypto = require('../helpers/crypto.js');

var cachedKdfParams = null;

function getKdfParams(params) {
    // User provided kdfParams
    if (_.isObject(params.kdfParams)) {
        return Promise.resolve(params);
    }

    // kdfParams has been cached
    if (cachedKdfParams) {
        params.kdfParams = cachedKdfParams;
        return Promise.resolve(params);
    }

    return this.parent.axios.get('/wallets/getkdf')
        .then(function (resp) {
            cachedKdfParams = resp;
            params.kdfParams = resp;
            return Promise.resolve(params);
        })
}

function getLoginParams(params) {
    return this.parent.axios.post('/wallets/getparams', _.pick(params, ['username']))
        .then(function (resp) {
            params.salt = resp.salt;
            params.kdfParams = JSON.parse(resp.kdfParams);

            return Promise.resolve(params);
        })
}

function makeSignature(data, username, walletId, secretKey) {
    var rawSecretKey = nacl.util.decodeBase64(secretKey);
    var serializedData = nacl.util.decodeUTF8(JSON.stringify(data));
    var signature = nacl.sign.detached(serializedData, rawSecretKey);
    signature = nacl.util.encodeBase64(signature);

    return JSON.stringify({
        username: username,
        walletId: walletId,
        signature: signature
    });
}

module.exports = class {
    constructor(parent) {
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
            .then(getKdfParams.bind(this))
            .then(params => {
                // Create salt
                params.salt = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0

                // Calculate master key
                return crypto.calculateMasterKey(params) //S0
            })
            .then(params => {
                var walletId = crypto.deriveWalletId(params.rawMasterKey); // W
                var walletKey = crypto.deriveWalletKey(params.rawMasterKey); // Kw

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

                return self.parent.axios.post('/wallets/create', _.pick(params, [
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
                    .then(resp => {
                        return Promise.resolve(new wallet(self, _.pick(params, [
                            'username',
                            'accountId',
                            'rawMasterKey',
                            'rawWalletId',
                            'rawWalletKey',
                            'rawMainData',
                            'rawKeychainData'
                        ])));
                    });
            });
    }

    get(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present("username"))
            .then(validate.present("password"))
            .then(getLoginParams.bind(this))
            .then(params => {
                // TODO: allow to get wallet using password or by providing recovery data: masterKey
                return crypto.calculateMasterKey(params);
            })
            .then(params => {
                // Calculate walletId
                params.rawWalletId = crypto.deriveWalletId(params.rawMasterKey); // W
                params.rawWalletKey = crypto.deriveWalletKey(params.rawMasterKey); // Kw
                params.walletId = sjcl.codec.base64.fromBits(params.rawWalletId);

                // Send request
                return self.parent.axios.post('/wallets/get', _.pick(params, [
                        'username',
                        'walletId',
                    ]))
                    .then(function (resp) {
                        return Promise.resolve(_.extend(params, _.pick(resp, [
                            'mainData',
                            'keychainData',
                            'email',
                            'phone',
                            'HDW'
                        ])));
                    });
            })
            .then(params => {
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
            .then(validate.present("walletId"))
            .then(validate.present("username"))
            .then(validate.present("rawWalletKey"))
            .then(validate.string("secretKey"))
            .then(params => {
                var signature = makeSignature(params.update, params.username, params.walletId, params.secretKey);

                return self.parent.axios.post('/wallets/update', params.update, {
                    headers: {'Signature': signature}
                });
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
            .then(getKdfParams.bind(this))
            .then(params => {
                params.oldWalletId = params.walletId;
                params.salt = nacl.util.encodeBase64(nacl.randomBytes(16)); // S0
                params.password = params.newPassword;

                // Calculate master key
                return crypto.calculateMasterKey(params) //S0
            })
            .then(params => {
                var walletId = crypto.deriveWalletId(params.rawMasterKey); // W
                var walletKey = crypto.deriveWalletKey(params.rawMasterKey); // Kw

                params.kdfParams = JSON.stringify(params.kdfParams);

                params.rawWalletId = walletId;
                params.walletId = sjcl.codec.base64.fromBits(walletId);
                params.rawWalletKey = walletKey;

                params.mainData = crypto.encryptData(params.rawMainData, walletKey);
                params.mainDataHash = crypto.sha1(params.mainData);

                params.keychainData = crypto.encryptData(params.rawKeychainData, walletKey);
                params.keychainDataHash = crypto.sha1(params.keychainData);

                var data = _.pick(params, [
                    'walletId',
                    'salt',
                    'kdfParams',
                    'mainData',
                    'mainDataHash',
                    'keychainData',
                    'keychainDataHash',
                ]);

                var signature = makeSignature(data, params.username, params.oldWalletId, params.secretKey);
                return self.parent.axios.post('/wallets/updatepassword', data, {
                        headers: {'Signature': signature}
                    })
                    .then(resp => {
                        var updateData = {
                            rawWalletId: params.rawWalletId,
                            rawWalletKey: params.rawWalletKey,
                            rawMasterKey: params.rawMasterKey,
                        }

                        return Promise.resolve(updateData);
                    });
            })
    }
}