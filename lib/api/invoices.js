const validate = require('../helpers/validate.js');
const _ = require('lodash');

module.exports = class {
    constructor(parent) {
        this.parent = parent;
    }

    get(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present('id'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.axios.get('/invoices/' + params.id);
            });
    }

    getList(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('account_id', true))
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/invoices', {
                    params: _.pick(params, [
                        'account_id',
                        'limit',
                        'offset'
                    ])
                });
            });
    }

    getStatistics(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.axios.get('/invoices/statistics', {
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
            .then(validate.string('asset'))
            .then(validate.present('amount'))
            .then(validate.memolength('memo'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/invoices', _.pick(params, [
                    'asset',
                    'amount',
                    'memo',
                ]));
            });
    }
}