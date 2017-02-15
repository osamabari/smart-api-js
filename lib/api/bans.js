const validate = require('../helpers/validate.js');
const _ = require('lodash');

module.exports = class {
    constructor(parent) {
        this.parent = parent;
    }

    create() {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('ip'))
            .then(validate.number('banned_for'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/bans/manage', _.pick(params, [
                    'ip',
                    'banned_for'
                ]))
            });
    }

    getList() {
        var self = this;

        return Promise.resolve(params)
            .then(validate.number('limit', true))
            .then(validate.number('offset', true))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/bans/list', {
                    params: _.pick(params, [
                        'limit',
                        'offset'
                    ])
                })
            });
    }

    delete() {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('ip'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/bans/manage', _.pick(params, [
                    'ip',
                ]))
            });
    }
}