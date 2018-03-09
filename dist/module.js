"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var datasource_1 = require("./datasource");
exports.Datasource = datasource_1.GnocchiDatasource;
var query_ctrl_1 = require("./query_ctrl");
exports.QueryCtrl = query_ctrl_1.GnocchiDatasourceQueryCtrl;
var GnocchiConfigCtrl = /** @class */ (function () {
    function GnocchiConfigCtrl() {
    }
    GnocchiConfigCtrl.templateUrl = 'partials/config.html';
    return GnocchiConfigCtrl;
}());
exports.ConfigCtrl = GnocchiConfigCtrl;
var GnocchiQueryOptionsCtrl = /** @class */ (function () {
    function GnocchiQueryOptionsCtrl() {
    }
    GnocchiQueryOptionsCtrl.templateUrl = 'partials/query.options.html';
    return GnocchiQueryOptionsCtrl;
}());
exports.QueryOptionsCtrl = GnocchiQueryOptionsCtrl;
//# sourceMappingURL=module.js.map