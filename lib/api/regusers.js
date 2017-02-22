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

    getList(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('ipn_code', true))
            .then(validate.string('passport', true))
            .then(validate.string('phone', true))
            .then(validate.email('email', true))
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/regusers', {
                    params: _.pick(params, [
                        'passport',
                        'ipn_code',
                        'email',
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
            .then(validate.string('ipn_code'))
            .then(validate.string('asset'))
            .then(validate.string('surname'))
            .then(validate.string('name'))
            .then(validate.string('middle_name'))
            .then(validate.email('email'))
            .then(validate.string('phone'))
            .then(validate.string('address'))
            .then(validate.string('passport'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/regusers', _.pick(params, [
                    'ipn_code',
                    'asset',
                    'surname',
                    'name',
                    'middle_name',
                    'email',
                    'phone',
                    'address',
                    'passport'
                ]));
            });
    }
}