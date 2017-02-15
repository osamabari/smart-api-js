var smart_api = require('./index.js');
var StellarSdk = require('/home/eugene/Desktop/stellar-sdk');

var SmartApi = new smart_api({
    host: 'http://192.168.1.125:8180',
    request_timout: 30,
});

SmartApi.Wallet.get({
    username: 'login1235678',
    password: 'passx'
}).then(function (wallet) {
        var key = StellarSdk.Keypair.fromSeed(wallet.getKeychainData());

        return wallet.updatePassword({
            newPassword: '123123',
            secretKey: key._secretKey.toString('base64')
        });
    })
    .then(resp => {
        console.log(resp);
    })
    .catch(err => {
        console.log(err);
    })

