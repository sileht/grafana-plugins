///<reference path="../../../typings/index.d.ts" />
"use strict";
var BackendSrvMock = (function () {
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
            // for Prometheus
            if (!err.data.message && _.isString(err.data.error)) {
                err.data.message = err.data.error;
            }
            throw err;
        });
    };
    return BackendSrvMock;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BackendSrvMock;
//# sourceMappingURL=backendsrv.js.map