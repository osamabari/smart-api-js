/* * Copyright 2017 Atticlab LLC.
 * Licensed under the Apache License, Version 2.0
 * See the LICENSE or LICENSE_UA file at the root of this repository
 * Contact us at http://atticlab.net
 */
const validate = require('../helpers/validate.js'),
    _ = require('lodash');

module.exports = class {
    constructor(parent) {
        this.parent = parent;
    }

    get(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present('account_id'))
            .then(function (params) {
                return self.parent.axios.get('/sms/' + params.account_id)
            });
    }

    getListByPhone(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present('phone'))
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(function (params) {
                return self.parent.axios.get('/sms/listbyphone', {
                    params: _.pick(params, [
                        'phone',
                        'limit',
                        'offset'
                    ])
                });
            });
    }

    create(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('account_id'))
            .then(validate.string('phone'))
            .then(function (params) {
                return self.parent.axios.post('/sms', _.pick(params, [
                    'account_id',
                    'phone'
                ]))
            });
    }

    resend(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('account_id'))
            .then(validate.string('phone'))
            .then(function (params) {
                return self.parent.axios.post('/sms/resend', _.pick(params, [
                    'account_id',
                    'phone'
                ]))
            });
    }

    submitOTP(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('account_id'))
            .then(validate.string('phone'))
            .then(validate.number('otp'))
            .then(function (params) {
                return self.parent.axios.post('/sms/submitOTP', _.pick(params, [
                    'account_id',
                    'phone',
                    'otp'
                ]))
            });
    }

    checkIsConfirmed(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('account_id'))
            .then(validate.string('phone'))
            .then(function (params) {
                return self.parent.axios.post('/sms/check', _.pick(params, [
                    'account_id',
                    'phone'
                ]))
            });
    }
};