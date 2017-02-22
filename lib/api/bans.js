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

    create(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('ip'))
            .then(validate.number('ttl'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/bans', _.pick(params, [
                    'ip',
                    'ttl'
                ]))
            });
    }

    getList(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/bans', {
                    params: _.pick(params, [
                        'limit',
                        'offset'
                    ])
                })
            });
    }

    delete(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('ip'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/bans/delete', _.pick(params, [
                    'ip',
                ]))
            });
    }
}