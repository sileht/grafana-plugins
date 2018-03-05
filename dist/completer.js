"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var GnocchiQueryCompleter = /** @class */ (function () {
    function GnocchiQueryCompleter(ctrl, mode) {
        this.ctrl = ctrl;
        this.mode = mode;
        this.target = ctrl.target;
        this.datasource = ctrl.datasource;
    }
    GnocchiQueryCompleter.prototype.getCompletions = function (editor, session, pos, prefix, callback) {
        var _this = this;
        var completions = [];
        var previous_tokens;
        var token = session.getTokenAt(pos.row, pos.column);
        // console.log(token);
        // console.log(_.join(_.map(session.getTokens(0), (t: any) => {return t.type + "[" + t.value + "]";})));
        var variables = _.map(this.ctrl.templateSrv.variables, function (v) {
            return ["[[" + v.name + "]]", "$" + v.name]; // "${" + v.name + "}"]; not yet supported
        });
        var operators = this.transformToCompletions([">=", "<=", "!=", ">", "<", "=", "==", "eq", "ne", "lt", "gt", "ge", "le",
            "in", "like", "≠", "≥", "≤", "and", "or", "∧", "∨"], "operator");
        var templates = this.transformToCompletions(_.flattenDeep(variables), "template variable");
        if (this.mode === "operations") {
            var compl_type = token.type;
            previous_tokens = _.reverse(_.filter(session.getTokens(0), function (t) { return t.type !== "text"; }));
            if (previous_tokens[0] && compl_type === "text") {
                switch (previous_tokens[0].type) {
                    case 'resample':
                    case 'rolling':
                    case 'aggregate':
                        compl_type = "invalid.illegal.aggregator";
                        break;
                    case 'metric.start':
                        compl_type = "metric.name";
                        break;
                    case 'metric.name':
                        compl_type = "metric.aggregator";
                        break;
                    case 'aggregator':
                        switch (previous_tokens[1].type) {
                            case "rolling":
                                compl_type = "invalid.illegal.rollingwindow";
                                break;
                            case "resample":
                                compl_type = "invalid.illegal.granularity";
                                break;
                            default:
                                compl_type = "invalid.illegal.operation";
                        }
                        break;
                    default:
                        compl_type = "invalid.illegal.operation";
                }
            }
            if (compl_type === "metric.name") {
                this.ctrl.getCompletionsPromise("metrics").then(function (metrics) {
                    callback(null, _this.transformToCompletions(metrics, "metrics"));
                });
            }
            else if (compl_type === "metric.aggregator") {
                if (this.ctrl.cache) {
                    var metric = session.getTokens(0)[token.index - 2].value;
                    this.datasource.getCompletionsCacheForResource(this.ctrl.cache.resources, "^" + metric + "$").then(function (result) {
                        callback(null, _this.transformToCompletions(result["aggregators"], "aggregator"));
                    });
                }
            }
            else if (compl_type === "invalid.illegal.granularity") {
                callback(null, this.transformToCompletions(["1m", "1h", "1d"], "granularity"));
            }
            else if (compl_type === "invalid.illegal.rollingwindow") {
                callback(null, this.transformToCompletions(["1", "2", "3", "5", "10", "100"], "window"));
            }
            else if (compl_type === "invalid.illegal.aggregator") {
                callback(null, this.transformToCompletions(["mean", "median", "std", "min", "max", "sum", "var", "count"], "aggregator"));
            }
            else if (compl_type === "invalid.illegal.operation") {
                var maths = _.concat(operators, this.transformToCompletions(["+", "add", "%", "mod", "-", "sub", "\\*", "×", "mul", "/", "÷", "div", "**", "pow", "^",
                    "cos", "sin", "abs", "cos", "sin", "tan", "floor", "ceil", "neg", "rateofchange"], "operation"));
                var aggregation = this.transformToCompletions(["aggregate", "resample", "rolling"], "aggregation");
                var metrics = this.transformToCompletions(["metric"], "metric");
                callback(null, _.concat(aggregation, maths, metrics));
            }
        }
        else if (this.mode === "query") {
            var constants = this.transformToCompletions(["None", "null", "none", "true", "false", "True", "False"], "constant");
            if (token.type === "string") {
                previous_tokens = session.getTokens(0);
                var operator_found = false;
                for (var i = token.index; i >= 0; i--) {
                    var t = previous_tokens[i];
                    if (t.type === "text" || token.index === t.index) {
                        continue;
                    }
                    if (t.type === "keyword.operator.link") {
                        // Don't go further, user puts a value before an identifier
                        callback(null, completions);
                        return;
                    }
                    else if (t.type === "keyword.operator.binary") {
                        operator_found = true;
                    }
                    else if (t.type === "identifier" && operator_found) {
                        this.datasource.getResourceTypes().then(function (resource_types) {
                            var i = _.findIndex(resource_types, function (rt) { return rt.name === _this.target.resource_type; });
                            var valid_attrs = _.concat(_this.datasource.GENERIC_ATTRIBUTES, _.keys(resource_types[i]['attributes']));
                            if (_.includes(valid_attrs, t.value)) {
                                _this.datasource.getCompletionsCacheForResourceAttributeValue(_this.target.resource_type, t.value).then(function (values) {
                                    var desc = _this.target.resource_type + " " + t.value + " value";
                                    callback(null, _this.transformToCompletions(values, desc));
                                });
                            }
                        });
                        return;
                    }
                }
            }
            this.datasource.getResourceTypes().then(function (resource_types) {
                var idx = _.findIndex(resource_types, function (rt) { return rt.name === _this.target.resource_type; });
                var generic_attributes = _this.transformToCompletions(_this.datasource.GENERIC_ATTRIBUTES, "generic attribute");
                var rt_attributes = _this.transformToCompletions(_.keys(resource_types[idx]['attributes']), _this.target.resource_type + " attribute");
                var completions = _.concat(generic_attributes, rt_attributes, operators, constants, templates);
                callback(null, completions);
            });
        }
        else if (this.mode === "label") {
            this.datasource.getResourceTypes().then(function (resource_types) {
                var i = _.findIndex(resource_types, function (rt) { return rt.name === _this.target.resource_type; });
                var special_attributes = _this.transformToCompletions(_.map(["metric", "aggregator"], _this.to_label_template), "special attribute");
                var generic_attributes = _this.transformToCompletions(_.map(_this.datasource.GENERIC_ATTRIBUTES, _this.to_label_template), "generic attribute");
                var rt_attributes = _this.transformToCompletions(_.map(_.keys(resource_types[i]['attributes']), _this.to_label_template), _this.target.resource_type + " attribute");
                var completions = _.concat(templates, generic_attributes, rt_attributes, special_attributes);
                callback(null, completions);
            });
        }
        return;
    };
    GnocchiQueryCompleter.prototype.to_label_template = function (v) {
        return "${" + v + "}";
    };
    GnocchiQueryCompleter.prototype.transformToCompletions = function (words, meta) {
        return words.map(function (name) {
            return {
                caption: name,
                value: name,
                meta: meta,
                score: Number.MAX_VALUE,
            };
        });
    };
    return GnocchiQueryCompleter;
}());
exports.GnocchiQueryCompleter = GnocchiQueryCompleter;
//# sourceMappingURL=completer.js.map