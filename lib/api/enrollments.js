/* * Copyright 2017 Atticlab LLC.
 * Licensed under the Apache License, Version 2.0
 * See the LICENSE or LICENSE_UA file at the root of this repository
 * Contact us at http://atticlab.net
 */
const validate = require('../helpers/validate.js');
const _ = require('lodash');

module.exports = class {
    constructor(parent) {
        this.parent = parent;
    }

    accept(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('id'))
            .then(validate.string('token'))
            .then(validate.string('account_id'))
            .then(validate.string('tx_trust'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/enrollments/accept/' + params.id, _.pick(params, [
                    'token',
                    'account_id',
                    'tx_trust',
                    'login'
                ]));
            });
    }

    approve(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('id'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/enrollments/approve/' + params.id);
            });
    }

    decline(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('id'))
            .then(validate.string('token'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/enrollments/decline/' + params.id, _.pick(params, [
                    'token'
                ]));
            });
    }

    getList(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('type', true))
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/enrollments', {
                    params: _.pick(params, [
                        'type',
                        'limit',
                        'offset'
                    ])
                });
            });
    }

    getForUser(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('token'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/enrollment/user/get/' + params.token);
            });
    }

    getForAgent(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('token'))
            .then(validate.string('company_code'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/enrollment/agent/get/' + params.token, {
                    params: _.pick(params, [
                        'company_code'
                    ])
                });
            });
    }
}