const validate = require('../helpers/validate.js');
const _ = require('lodash');

module.exports = class {
    constructor(parent) {
        this.parent = parent;
    }

    create(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.number('type'))
            .then(validate.string('asset'))
            .then(validate.string('company_code'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/agents', _.pick(params, [
                    'type',
                    'asset',
                    'company_code'
                ]))
            });
    }

    getList(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('company_code', true))
            .then(validate.number('type', true))
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/agents', _.pick(params, [
                    'company_code',
                    'type',
                    'limit',
                    'offset'
                ]));
            });
    }
}