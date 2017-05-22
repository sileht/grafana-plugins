"use strict";
///<reference path="../../../typings/index.d.ts" />
//
var TemplateSrvMock = (function () {
    function TemplateSrvMock() {
    }
    TemplateSrvMock.prototype.replace = function (value) {
        return value;
    };
    return TemplateSrvMock;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TemplateSrvMock;
//# sourceMappingURL=templatesrv.js.map