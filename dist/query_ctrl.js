"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var angular = require("angular");
var GnocchiDatasourceQueryCtrl = (function () {
    function GnocchiDatasourceQueryCtrl($scope, $injector) {
        var _this = this;
        this.$scope = $scope;
        this.$injector = $injector;
        this.$scope = $scope;
        this.panel = this.panelCtrl.panel;
        this.queryModes = [
            { text: 'dynamic aggregates', value: 'dynamic_aggregates' },
            { text: 'resource search', value: 'resource_search' },
            { text: 'resource search (aggregated measurements)', value: 'resource_aggregation' },
            { text: 'resource ID and metric name (deprecated)', value: 'resource' },
            { text: 'metric ID', value: 'metric' }
        ];
        if (!this.target.refId) {
            this.target.refId = this.getNextQueryLetter();
        }
        // default
        if (!this.target.aggregator) {
            this.target.aggregator = 'mean';
        }
        if (!this.target.resource_type) {
            this.target.resource_type = 'generic';
        }
        if (this.target.draw_missing_datapoint_as_zero === undefined) {
            this.target.draw_missing_datapoint_as_zero = true;
        }
        if (this.target.fill === undefined && this.target.draw_missing_datapoint_as_zero) {
            // backward compat.
            this.target.fill = 0;
        }
        if (!this.target.queryMode) {
            this.target.queryMode = "resource_search";
        }
        if (!this.target.needed_overlap) {
            this.target.needed_overlap = 0;
        }
        this.suggestResourceIDs = function (query, callback) {
            _this.datasource.performSuggestQuery(query, 'resources', _this.target).then(callback);
        };
        this.suggestMetricIDs = function (query, callback) {
            _this.datasource.performSuggestQuery(query, 'metrics', _this.target).then(callback);
        };
        this.suggestMetricNames = function (query, callback) {
            _this.datasource.performSuggestQuery(query, 'metric_names', _this.target).then(callback);
        };
        this.refresh();
    }
    GnocchiDatasourceQueryCtrl.prototype.getAggregators = function () {
        return _.map(['mean', 'sum', 'min', 'max',
            'std', 'median', 'first', 'last', 'count', 'rate:last',
            '5pct', '10pct', '90pct', '95pct'], function (v) {
            return { text: v, value: v };
        });
    };
    GnocchiDatasourceQueryCtrl.prototype.setAggregator = function (option) {
        if (option !== undefined) {
            this.target.aggregator = option.value;
        }
        this.refresh();
    };
    GnocchiDatasourceQueryCtrl.prototype.setReaggregator = function (option) {
        if (option !== undefined) {
            this.target.reaggregator = option.value;
        }
        this.refresh();
    };
    GnocchiDatasourceQueryCtrl.prototype.refresh = function () {
        if (!_.isEqual(this.oldTarget, this.target)) {
            this.oldTarget = angular.copy(this.target);
            this.panelCtrl.refresh();
        }
    };
    // QueryCTRL stuffs
    GnocchiDatasourceQueryCtrl.prototype.getNextQueryLetter = function () {
        var _this = this;
        var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return _.find(letters, function (refId) {
            return _.every(_this.panel.targets, function (other) {
                return other.refId !== refId;
            });
        });
    };
    GnocchiDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
    return GnocchiDatasourceQueryCtrl;
}());
exports.GnocchiDatasourceQueryCtrl = GnocchiDatasourceQueryCtrl;
//# sourceMappingURL=query_ctrl.js.map