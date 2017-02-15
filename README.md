# Smart Api Js

**Create api object**

```
var smart_api = require('./index.js');

var SmartApi = new smart_api({
    host: 'http://192.168.1.125:8180'
});
```

**Create new wallet:**

```
SmartApi.Wallet.create({
    username: 'login12356789',
    password: 'password1235',
    accountId: 'GDF5UDMVNZLITU3BUTMWK4QKGVD2HI7GIBECQXU57DWY4OLXMPTRXCWL',
    publicKey: 'y9oNlW5WidNhpNllcgo1R6Oj5kBIKF6d+O2OOXdj5xs=',
    keychainData: 'SBT2LO37LHU5X45F3FH4O4SNDFJDYYVZTLCNUUIS5RPSZUNGBVPMHD7T',
    mainData: 'mainData',
    // Kdfp params can be optionally passed
    // kdfParams: {
    //     algorithm: 'scrypt',
    //     bits: 256,
    //     n: Math.pow(2, 3),
    //     r: 8,
    //     p: 1
    // }
})
.then(wallet => {
    console.log(wallet);
})
.catch(err => {
    console.log(err);
})
```

**Get wallet from api server:**

```
SmartApi.Wallet.get({
    username: 'login1235678',
    password: 'passx'
}).then(function (wallet) {
    // Here is your wallet object
})
.catch(err => {
    console.log(err);
})
```

**Check if waller username is free:**

```
SmartApi.Wallet.notExist({
    username: 'login1235678'
})
.then(resp => {
    console.log(resp)
})
.catch(err => {
    console.log(err);
})
```

**Update wallet data:**

```
wallet.update({
    update: {email: '1xxxxxx@xxx.com'},
    secretKey: key._secretKey.toString('base64')
});
```

**Update wallet password:**

```
wallet.updatePassword({
    newPassword: '123123',
    secretKey: key._secretKey.toString('base64')
});
```