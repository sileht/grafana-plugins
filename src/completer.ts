import { GnocchiDatasource } from './datasource';
import { GnocchiDatasourceQueryCtrl } from './query_ctrl';
import * as _ from "lodash";

export class GnocchiQueryCompleter {
    target: any;
    datasource: GnocchiDatasource;

    constructor(private ctrl: GnocchiDatasourceQueryCtrl, private mode: string) {
        this.target = ctrl.target;
        this.datasource = ctrl.datasource;
    }

    getCompletions(editor, session, pos, prefix, callback){
        var completions = [];
        var previous_tokens;
        let token = session.getTokenAt(pos.row, pos.column);

        // console.log(token);
        // console.log(_.join(_.map(session.getTokens(0), (t: any) => {return t.type + "[" + t.value + "]";})));

        var variables = _.map(this.ctrl.templateSrv.variables, (v: any) => {
            return ["[[" + v.name + "]]", "$" + v.name ]; // "${" + v.name + "}"]; not yet supported
        });
        var operators = this.transformToCompletions(
              [">=", "<=", "!=", ">", "<", "=", "==", "eq", "ne", "lt", "gt", "ge", "le",
                  "in", "like", "≠", "≥", "≤", "and", "or", "∧", "∨"], "operator");
        var templates = this.transformToCompletions(_.flattenDeep(variables), "template variable");

        if (this.mode === "operations") {

            var compl_type = token.type;
            previous_tokens = _.reverse(_.filter(session.getTokens(0), (t: any) => { return t.type !== "text"; }));
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
                this.ctrl.getCompletionsPromise("metrics").then((metrics) => {
                    callback(null, this.transformToCompletions(metrics, "metrics"));
                });
            } else if (compl_type === "metric.aggregator") {
                if (this.ctrl.cache) {
                    var metric = session.getTokens(0)[token.index - 2].value;
                    this.datasource.getCompletionsCacheForResource(this.ctrl.cache.resources, "^" + metric + "$").then((result) => {
                        callback(null, this.transformToCompletions(result["aggregators"], "aggregator"));
                    });
                }
            } else if (compl_type === "invalid.illegal.granularity") {
                callback(null, this.transformToCompletions(["1m", "1h", "1d"], "granularity"));
            } else if (compl_type === "invalid.illegal.rollingwindow") {
                callback(null, this.transformToCompletions(["1", "2", "3", "5", "10", "100"], "window"));
            } else if (compl_type === "invalid.illegal.aggregator") {
                callback(null, this.transformToCompletions(["mean", "median", "std", "min", "max", "sum", "var", "count"], "aggregator"));
            } else if (compl_type === "invalid.illegal.operation") {
                var maths = _.concat(operators, this.transformToCompletions(
                  ["+", "add", "%", "mod", "-", "sub", "\\*", "×", "mul", "/", "÷", "div", "**", "pow", "^",
                   "cos", "sin", "abs", "cos", "sin", "tan", "floor", "ceil", "neg", "rateofchange"],
                  "operation"));
                var aggregation = this.transformToCompletions(["aggregate", "resample", "rolling"], "aggregation");
                var metrics = this.transformToCompletions(["metric"], "metric");
                callback(null, _.concat(aggregation, maths, metrics));
            }

        } else if (this.mode === "query") {

          var constants = this.transformToCompletions(
              ["None", "null", "none", "true", "false", "True", "False"], "constant");

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
                  } else if (t.type === "keyword.operator.binary") {
                      operator_found = true;
                  } else if (t.type === "identifier" && operator_found) {
                      this.datasource.getResourceTypes().then((resource_types) => {
                          var i = _.findIndex(resource_types, (rt: any) => { return rt.name === this.target.resource_type; });
                          var valid_attrs = _.concat(this.datasource.GENERIC_ATTRIBUTES, _.keys(resource_types[i]['attributes']));
                          if (_.includes(valid_attrs, t.value)) {
                            this.datasource.getCompletionsCacheForResourceAttributeValue(
                                this.target.resource_type, t.value).then((values) => {
                                    var desc = this.target.resource_type + " " + t.value + " value";
                                    callback(null, this.transformToCompletions(values, desc));
                                });
                          }
                      });
                      return;
                  }
              }
          }

          this.datasource.getResourceTypes().then((resource_types) => {
              var idx = _.findIndex(resource_types, (rt: any) => { return rt.name === this.target.resource_type; });
              var generic_attributes = this.transformToCompletions(this.datasource.GENERIC_ATTRIBUTES, "generic attribute");
              var rt_attributes = this.transformToCompletions(_.keys(resource_types[idx]['attributes']),
                                                              this.target.resource_type + " attribute");
              var completions = _.concat(generic_attributes, rt_attributes, operators, constants, templates);
              callback(null, completions);
          });

        } else if (this.mode === "label") {

          this.datasource.getResourceTypes().then((resource_types) => {
              var i = _.findIndex(resource_types, (rt: any) => { return rt.name === this.target.resource_type; });
              var special_attributes = this.transformToCompletions(
                  _.map(["metric", "aggregator"], this.to_label_template),
                  "special attribute");
              var generic_attributes = this.transformToCompletions(
                  _.map(this.datasource.GENERIC_ATTRIBUTES, this.to_label_template),
                  "generic attribute");
              var rt_attributes = this.transformToCompletions(
                  _.map(_.keys(resource_types[i]['attributes']), this.to_label_template),
                  this.target.resource_type + " attribute");
              var completions = _.concat(templates, generic_attributes, rt_attributes, special_attributes);
              callback(null, completions);
          });

        }
        return;
    }

    to_label_template(v: any) {
        return "${" + v + "}";
    }

    transformToCompletions(words, meta) {
        return words.map(name => {
            return {
                caption: name,
                value: name,
                meta: meta,
                score: Number.MAX_VALUE,
            };
        });
    }
}
