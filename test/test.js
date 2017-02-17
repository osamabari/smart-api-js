const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const wallet = require('../lib/classes/wallet.js');
const stellar = require('stellar-sdk');

chai.use(chaiAsPromised);
chai.should();

var smart_api = require('../index.js');

var SmartApi = new smart_api({
    host: 'http://192.168.1.125:8180',
    debug: true,
});

var testParams = {
    user: '__debug-' + Date.now(),
    pwd: '__debug__',
    distributionType: 3,
    ipAddr: '25.55.191.171',
};

// Set keypair for signed requests
SmartApi.setKeypair(stellar.Keypair.random());

describe('Wallets', function () {
    it('Check if username is free', function () {
        return SmartApi.Wallets.notExist({
            username: testParams.user
        });
    });

    it('Create and get wallet object', () => {
        return SmartApi.Wallets.create({
                username: testParams.user,
                password: testParams.pwd,
                accountId: 'GDF5UDMVNZLITU3BUTMWK4QKGVD2HI7GIBECQXU57DWY4OLXMPTRXCWL',
                publicKey: 'y9oNlW5WidNhpNllcgo1R6Oj5kBIKF6d+O2OOXdj5xs=',
                keychainData: 'SBT2LO37LHU5X45F3FH4O4SNDFJDYYVZTLCNUUIS5RPSZUNGBVPMHD7T',
                mainData: 'mainData',
            })
            .should.eventually.be.instanceof(wallet)
            .then(() => {
                return SmartApi.Wallets.get({
                    username: testParams.user,
                    password: testParams.pwd,
                });
            })
            .should.eventually.be.instanceof(wallet);
    });


    it('Update wallet email', function () {
        return SmartApi.Wallets.get({
                username: testParams.user,
                password: testParams.pwd,
            })
            .then(wallet => {
                return wallet.update({
                    update: {email: 'debug@' + Date.now() + '.com'},
                    secretKey: 'Z6W7f1np2/Ol2U/Hck0ZUjxiuZrE2lES7F8s0aYNXsPL2g2VblaJ02Gk2WVyCjVHo6PmQEgoXp347Y45d2PnGw=='
                });
            });
    });

    it('Update wallet password', function () {
        return SmartApi.Wallets.get({
                username: testParams.user,
                password: testParams.pwd,
            })
            .then(wallet => {
                return wallet.updatePassword({
                    newPassword: '__debug__changed__',
                    secretKey: 'Z6W7f1np2/Ol2U/Hck0ZUjxiuZrE2lES7F8s0aYNXsPL2g2VblaJ02Gk2WVyCjVHo6PmQEgoXp347Y45d2PnGw=='
                });
            });
    });
});

describe('Admins', function () {
    let adminKey = stellar.Keypair.random();

    it('create', function () {
        return SmartApi.Admins.create({
            account_id: adminKey.accountId(),
            name: 'Name',
            position: 'Position',
            comment: 'Comment'
        }).should.eventually.have.property('status', 'success');
    });

    it('get', function () {
        return SmartApi.Admins.get({
            account_id: adminKey.accountId(),
        }).should.eventually.have.property('status', 'success');
    });

    it('getList', function () {
        return SmartApi.Admins.getList({
            account_ids: [adminKey.accountId()],
        }).should.eventually.have.property('status', 'success');
    });

    it('delete', function () {
        return SmartApi.Admins.delete({
            account_id: adminKey.accountId(),
        }).should.eventually.have.property('status', 'success');
    });
});

describe('Companies', function () {
    let company_code = Date.now().toString();

    it('create', function () {
        return SmartApi.Companies.create({
            code: company_code,
            title: 'Test company',
            address: 'Address',
            phone: '123123',
            email: Date.now() + '-debug@debug.com',
        }).should.eventually.have.property('status', 'success');
    });

    it('get', function () {
        return SmartApi.Companies.get({
            code: company_code,
        }).should.eventually.have.property('status', 'success');
    });

    it('getList', function () {
        return SmartApi.Companies.getList()
            .should.eventually.have.property('status', 'success');
    });
});

describe('Agents', function () {
    let companyCode = Date.now().toString() + '-agent';

    it('create', function () {
        return SmartApi.Companies.create({
            code: companyCode,
            title: 'Test company',
            address: 'Address',
            phone: '123123',
            email: Date.now() + '-debug@debug.com',
        }).then(() => {
            return SmartApi.Agents.create({
                    type: testParams.distributionType,
                    asset: 'EUAH',
                    company_code: companyCode,
                })
                .should.eventually.have.property('status', 'success');
        })
    });

    it('getList', function () {
        return SmartApi.Agents.getList({
            company_code: companyCode,
            type: testParams.distributionType,
        }).should.eventually.have.property('status', 'success');
    });
});

describe('Bans', function () {
    it('create', function () {
        return SmartApi.Bans.create({
            ip: testParams.ipAddr,
            ttl: 1000
        }).should.eventually.have.property('status', 'success');
    });

    it('getList', function () {
        return SmartApi.Bans.getList().should.eventually.have.property('status', 'success');
    });

    it('delete', function () {
        return SmartApi.Bans.delete({
            ip: testParams.ipAddr,
        }).should.eventually.have.property('status', 'success');
    });
});

describe('Invoices', function () {
    let invId;

    it('create', function () {
        return SmartApi.Invoices.create({
                asset: 'EUAH',
                amount: 100,
            })
            .then(resp => {
                invId = resp.id;
                return Promise.resolve(resp);
            })
            .should.eventually.have.property('status', 'success');
    });

    it('get', function () {
        return SmartApi.Invoices.get({
            id: invId
        }).should.eventually.have.property('status', 'success');
    });

    it('getList', function () {
        return SmartApi.Invoices.getList({
            limit: 10,
            offset: 0
        }).should.eventually.have.property('status', 'success');
    });

    it('getStatistics', function () {
        return SmartApi.Invoices.getStatistics({
            limit: 10,
            offset: 0
        }).should.eventually.have.property('status', 'success');
    });
});

describe('Cards', function () {
});

describe('Regusers', function () {
    let ipnCode = Date.now().toString();
    it('create', function () {
        return SmartApi.Regusers.create({
            ipn_code: ipnCode,
            asset: 'EUAH',
            surname: 'Surname',
            name: 'Name',
            middle_name: 'Middle',
            email: Date.now() + '-debug-user@debug.com',
            phone: ipnCode,
            address: 'Address',
            passport: ipnCode,
        }).should.eventually.have.property('status', 'success');
    });

    it('getList', function () {
        return SmartApi.Regusers.getList({
            ipn_code: ipnCode,
            passport: ipnCode,
            limit: 10,
            offset: 0
        }).should.eventually.have.property('status', 'success');
    });
});

// describe('Enrollments', function () {
//     it('accept', function () {
//         return SmartApi.Enrollments.accept({
//             id: 1,
//             token: 1,
//             account_id: 1,
//             tx_trust: 1,
//         }).should.eventually.have.property('status', 'success');
//     });
//
//     it('approve', function () {
//         return SmartApi.Enrollments.approve({
//             id: 1,
//         }).should.eventually.have.property('status', 'success');
//     });
//
//     it('decline', function () {
//         return SmartApi.Enrollments.decline({
//             id: 1,
//             token: 1,
//         }).should.eventually.have.property('status', 'success');
//     });
//
//     it('getList', function () {
//         return SmartApi.Enrollments.getList({
//             type: 1,
//             limit: 1,
//             offset: 1,
//         }).should.eventually.have.property('status', 'success');
//     });
//
//     it('getForUser', function () {
//         return SmartApi.Enrollments.getForUser({
//             token: 1,
//         }).should.eventually.have.property('status', 'success');
//     });
//
//     it('getForAgent', function () {
//         return SmartApi.Enrollments.getForAgent({
//             token: 1,
//             company_code: 1,
//         }).should.eventually.have.property('status', 'success');
//     });
// });
//
// describe('Merchants', function () {
//     it('createStore', function () {
//         return SmartApi.Admins.delete({
//             url
//             name
//         }).should.eventually.have.property('status', 'success');
//     });
//
//     it('getStores', function () {
//         return SmartApi.Admins.delete({
//             limit
//             offset
//         }).should.eventually.have.property('status', 'success');
//     });
//
//     it('getOrder', function () {
//         return SmartApi.Admins.delete({
//             order_id
//         }).should.eventually.have.property('status', 'success');
//     });
//
//     it('getStoreOrders', function () {
//         return SmartApi.Admins.delete({
//             store_id
//             limit
//             offset
//         }).should.eventually.have.property('status', 'success');
//     });
// });