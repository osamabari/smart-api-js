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

    getStores(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/merchant/stores', {
                    params: _.pick(params, [
                        'limit',
                        'offset'
                    ])
                });
            });
    }

    createStore(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('url'))
            .then(validate.string('name'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/merchant/stores', _.pick(params, [
                    'url',
                    'name'
                ]));
            });
    }

    getOrder(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('order_id'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/merchant/orders/' + params.order_id);
            });
    }

    getStoreOrders(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('store_id'))
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/merchant/orders', {
                    params: _.pick(params, [
                        'store_id',
                        'limit',
                        'offset'
                    ])
                });
            });
    }

    createOrder(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('store_id'))
            .then(validate.number('amount'))
            .then(validate.string('currency'))
            .then(validate.string('order_id'))
            .then(validate.string('server_url'))
            .then(validate.string('success_url'))
            .then(validate.string('fail_url'))
            .then(validate.string('signature'))
            .then(validate.string('details'))
            .then(function (params) {
                return self.parent.axios.post('/merchant/orders', _.pick(params, [
                    'store_id',
                    'amount',
                    'currency',
                    'order_id',
                    'server_url',
                    'success_url',
                    'fail_url',
                    'signature',
                    'details'
                ]));
            });
    }

    // getOrderRefunds(params) {
    //     var self = this;
    //
    //     return Promise.resolve(params)
    //         .then(validate.string('order_id'))
    //         .then(this.parent.getNonce.bind(this.parent))
    //         .then(function (params) {
    //             return self.parent.axios.get('/merchant/refunds/' + params.order_id);
    //         });
    // }
}