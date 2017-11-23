"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var BackendSrvMock = /** @class */ (function () {
    function BackendSrvMock($http) {
        this.$http = $http;
    }
    BackendSrvMock.prototype.datasourceRequest = function (options) {
        var self = this;
        options.retry = options.retry || 0;
        return self.$http(options).then(function (data) {
            return data;
        }, function (err) {
            //populate error obj on Internal Error
            if (_.isString(err.data) && err.status === 500) {
                err.data = {
                    error: err.statusText
                };
            }
            if (err.data && !err.data.message && _.isString(err.data.error)) {
                err.data.message = err.data.error;
            }
            throw err;
        });
    };
    return BackendSrvMock;
}());
exports.default = BackendSrvMock;
//# sourceMappingURL=backendsrv.js.map