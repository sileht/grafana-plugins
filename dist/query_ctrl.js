"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var angular = require("angular");
var completer_1 = require("./completer");
require("./ace-loader");
var GnocchiDatasourceQueryCtrl = /** @class */ (function () {
    function GnocchiDatasourceQueryCtrl($scope, $injector, $q, uiSegmentSrv, templateSrv) {
        var _this = this;
        this.$scope = $scope;
        this.$injector = $injector;
        this.$q = $q;
        this.uiSegmentSrv = uiSegmentSrv;
        this.templateSrv = templateSrv;
        this.isLastQuery = false;
        this.$scope = $scope;
        this.panel = this.panelCtrl.panel;
        this.REMOVE_ME = "- remove me -";
        this.SET_ME = "- set me -";
        this.cache = null;
        this.cache_promises = [];
        this.errors = [];
        this.queryModes = [
            { text: 'resource search', value: 'resource_search' },
            { text: 'resource search (aggregated measurements)', value: 'resource_aggregation' },
            { text: 'resource ID and metric name (deprecated)', value: 'resource' },
            { text: 'metric ID', value: 'metric' }
        ];
        this.legacy_groupby_supported = false;
        this.datasource.requireVersion("4.1.1").then(function () {
            _this.queryModes.splice(0, 0, { text: 'dynamic aggregates (Recommended)', value: 'dynamic_aggregates' });
        });
        this.datasource.requireVersion("4.3").then(function () {
            _this.legacy_groupby_supported = true;
        });
        this.datasource.getResourceTypes().then(function (results) {
            _this.resource_types = ["generic"];
            _.map(results, function (item) {
                if (item["name"] !== "generic") {
                    _this.resource_types.push(item["name"]);
                }
            });
        });
        if (!this.target.refId) {
            this.target.refId = this.getNextQueryLetter();
        }
        if (!this.target.queryMode) {
            this.target.queryMode = "resource_search";
        }
        // default
        if (!this.target.resource_type) {
            this.target.resource_type = 'generic';
        }
        if (!this.target.metric_name) {
            this.target.metric_name = this.datasource.NOT_FOUND;
        }
        if (!this.target.resource_search) {
            this.target.resource_search = '';
        }
        if (!this.target.groupby) {
            this.target.groupby = '';
        }
        if (!this.target.label) {
            this.target.label = '';
        }
        if (!this.target.operations) {
            this.target.operations = '';
        }
        if (!this.target.reaggregator) {
            this.target.reaggregator = 'none';
        }
        if (this.target.draw_missing_datapoint_as_zero === undefined) {
            this.target.draw_missing_datapoint_as_zero = true;
        }
        if (this.target.fill === undefined && this.target.draw_missing_datapoint_as_zero) {
            // backward compat.
            this.target.fill = 0;
        }
        if (!this.target.needed_overlap) {
            this.target.needed_overlap = 0;
        }
        this.groupby_segments = _.uniq(_.remove(this.target.groupby.split(','), function (item) { return item !== ""; }));
        this.refresh_query();
    }
    GnocchiDatasourceQueryCtrl.prototype.getCompletionsPromise = function (t) {
        var deferred = this.$q.defer();
        if (this.cache) {
            deferred.resolve(this.cache[t]);
        }
        else {
            this.cache_promises.push([t, deferred]);
            this.refresh_query();
        }
        return deferred.promise;
    };
    GnocchiDatasourceQueryCtrl.prototype.getCompletions = function (t) {
        var p = this.getCompletionsPromise(t);
        return p.then(function (result) {
            if (t === "metrics") {
                return _.map(result, function (m) { return { text: m, name: m }; });
            }
            else {
                return result;
            }
        }).then(this.uiSegmentSrv.transformToSegments(false));
    };
    GnocchiDatasourceQueryCtrl.prototype.getCompleter = function (mode) {
        return new completer_1.GnocchiQueryCompleter(this, mode);
    };
    GnocchiDatasourceQueryCtrl.prototype.getReaggregators = function () {
        var agg = ['none', 'mean', 'sum', 'min', 'max',
            'std', 'median', 'first', 'last', 'count', 'rate:last',
            '5pct', '10pct', '90pct', '95pct'];
        return _.map(agg, function (v) {
            return { text: v, value: v };
        });
    };
    GnocchiDatasourceQueryCtrl.prototype.setReaggregator = function (option) {
        if (option !== undefined) {
            this.target.reaggregator = option.value;
        }
        this.refresh();
    };
    GnocchiDatasourceQueryCtrl.prototype.getGroupBy = function (index) {
        var _this = this;
        return this.datasource.getResourceTypes().then(function (resource_types) {
            var i = _.findIndex(resource_types, function (rt) {
                return rt.name === _this.target.resource_type;
            });
            var attributes = _.difference(_.concat(_this.datasource.GENERIC_ATTRIBUTES, _.keys(resource_types[i]['attributes'])), _.without(_this.groupby_segments, _this.groupby_segments[index]));
            attributes.sort();
            attributes.unshift(_this.REMOVE_ME);
            return _.map(attributes, function (attr) {
                return { text: attr, value: attr };
            });
        }).then(this.uiSegmentSrv.transformToSegments(false));
    };
    GnocchiDatasourceQueryCtrl.prototype.addGroupBy = function () {
        if (!_.includes(this.groupby_segments, this.SET_ME)) {
            this.groupby_segments.push(this.SET_ME);
        }
    };
    GnocchiDatasourceQueryCtrl.prototype.setGroupBy = function (index, option) {
        if (option === undefined || _.trim(option.value) === "" || option.value === this.REMOVE_ME) {
            this.groupby_segments.splice(index, 1);
        }
        else {
            this.groupby_segments[index] = option.value;
        }
        this.target.groupby = _.without(this.groupby_segments, this.SET_ME).join(",");
        this.refresh();
    };
    GnocchiDatasourceQueryCtrl.prototype.refresh_query = function () {
        var _this = this;
        if (_.isEqual(this.oldTarget, this.target)) {
            return;
        }
        this.datasource.getCompletionsCache(this.target, null).then(function (cache) {
            _this.cache = cache;
            _this.refresh();
        });
    };
    GnocchiDatasourceQueryCtrl.prototype.refresh_metric = function (option) {
        var _this = this;
        if (_.isEqual(this.oldTarget, this.target)) {
            return;
        }
        this.target.ready_metric = false;
        this.datasource.getCompletionsCache(this.target, this.cache['resources']).then(function (cache) {
            _this.cache = cache;
            _this.refresh();
        });
    };
    GnocchiDatasourceQueryCtrl.prototype.refresh = function () {
        var _this = this;
        _.forEach(this.cache_promises, function (p) {
            p[1].resolve(_this.cache[p[0]]);
        });
        this.cache_promises = [];
        if (!_.isEqual(this.oldTarget, this.target)) {
            if (this.target.queryMode !== "dynamic_aggregates") {
                // Ensure we have a valid aggregator
                if (!_.includes(this.cache["aggregators"], this.target.aggregator)) {
                    if (_.includes(this.cache["aggregators"], this.last_valid_aggregator)) {
                        this.target.aggregator = this.last_valid_aggregator;
                    }
                    else {
                        this.target.aggregator = this.cache["aggregators"][0];
                    }
                }
                else {
                    this.last_valid_aggregator = this.target.aggregator;
                }
            }
            this.oldTarget = angular.copy(this.target);
            this.ValidateTarget();
            if (this.errors.length === 0) {
                this.panelCtrl.refresh();
            }
        }
    };
    GnocchiDatasourceQueryCtrl.prototype.ValidateTarget = function () {
        this.errors = [];
        switch (this.target.queryMode) {
            case "metric":
                if (!this.target.metric_id) {
                    this.errors.push("metric_id");
                }
                break;
            case "resource":
                if (!this.target.resource_id) {
                    this.errors.push("resource_id");
                }
                if (!this.target.metric_name) {
                    this.errors.push("metric_name");
                }
                if (!this.target.aggregator || this.target.aggregator === this.datasource.NOT_FOUND) {
                    this.errors.push("aggregator");
                }
                break;
            case "dynamic_aggregates":
                if (!this.target.resource_search || !this.cache || !this.cache.metrics) {
                    this.errors.push("query");
                }
                if (!this.target.operations) {
                    this.errors.push("operations");
                }
                break;
            case "resource_aggregation":
            case "resource_search":
                if (!this.target.resource_search || !this.cache || !this.cache.metrics) {
                    this.errors.push("query");
                }
                if (!this.target.metric_name || this.target.metric_name === this.datasource.NOT_FOUND) {
                    this.errors.push("metric_name");
                }
                if (!this.target.aggregator || this.target.aggregator === this.datasource.NOT_FOUND) {
                    this.errors.push("aggregator");
                }
                break;
            default:
                break;
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