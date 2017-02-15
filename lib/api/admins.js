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
                return self.parent.axios.get('/admins/' + params.account_id);
            });
    }

    getList(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.present('account_ids'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/admins/list', _.pick(params, 'account_ids'));
            });
    }

    create(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('account_id'))
            .then(validate.string('name'))
            .then(validate.string('position'))
            .then(validate.string('comment'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.post('/admins', _.pick(params, [
                    'account_id',
                    'name',
                    'position',
                    'comment'
                ]))
            });
    }

    delete(params) {
        var self = this;

        return Promise.resolve(params)
            .then(validate.string('account_id'))
            .then(this.parent.getNonce.bind(this.parent))
            .then(function (params) {
                return self.parent.axios.get('/admins/delete/' + params.account_id)
            });
    }
}