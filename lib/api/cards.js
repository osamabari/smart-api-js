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

    get(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present('account_id'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/cards/' + params.account_id);
            });
    }

    getList(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/cards', {
                    params: _.pick(params, [
                        'limit',
                        'offset'
                    ])
                });
            });
    }

    create(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('tx'))
            .then(validate.string('data'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/cards', _.pick(params, [
                    'tx',
                    'data'
                ]))
            });
    }
}