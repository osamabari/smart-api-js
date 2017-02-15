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

    getStoreOrders(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('store_id'))
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/merchant/stores/' + params.store_id + '/orders', {
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

    getOrderRefunds(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('order_id'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/merchant/refunds/' + params.order_id);
            });
    }
}