
import * as _ from "lodash";
import * as angular from "angular";

import { GnocchiQueryCompleter } from './completer';
import './ace-loader';

export class GnocchiDatasourceQueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  // This is a copy of QueryCtrl interface
  target: any;
  oldTarget: any;
  datasource: any;
  panelCtrl: any;
  panel: any;
  hasRawMode: boolean;
  errors: string[];
  isLastQuery: boolean;

  legacy_groupby_supported: boolean;

  // local stuffs
  aggregators: any;
  resource_types: any;
  queryModes: any;
  groupby_segments: any;

  last_valid_aggregator: string;
  last_valid_metric_name: string;

  cache: any;
  cache_promises: any;

  REMOVE_ME: string;
  SET_ME: string;

  constructor(public $scope, private $injector, private $q, private uiSegmentSrv, public templateSrv) {
    this.isLastQuery = false;
    this.$scope = $scope;
    this.panel = this.panelCtrl.panel;

    this.REMOVE_ME = "- remove me -";
    this.SET_ME = "- set me -";

    this.cache = null;
    this.cache_promises = [];
    this.errors = [];

    this.queryModes = [
        {text: 'resource search', value: 'resource_search'},
        {text: 'resource search (aggregated measurements)', value: 'resource_aggregation'},
        {text: 'resource ID and metric name (deprecated)', value: 'resource'},
        {text: 'metric ID', value: 'metric'}
    ];

    this.legacy_groupby_supported = false;

    this.datasource.requireVersion("4.1.1").then(() => {
        this.queryModes.splice(0, 0,
            {text: 'dynamic aggregates (Recommended)', value: 'dynamic_aggregates'}
        );
    });
    this.datasource.requireVersion("4.3").then(() => {
        this.legacy_groupby_supported = true;
    });

    this.datasource.getResourceTypes().then((results) => {
      this.resource_types = ["generic"];
      _.map(results, (item) => {
          if (item["name"] !== "generic") {
              this.resource_types.push(item["name"]);
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

    this.groupby_segments = _.uniq(_.remove(this.target.groupby.split(','), (item) => { return item !== ""; }));

    this.refresh_query();
  }

  getCompletionsPromise(t) {
    var deferred = this.$q.defer();
    if (this.cache) {
        deferred.resolve(this.cache[t]);
    } else {
        this.cache_promises.push([t, deferred]);
        this.refresh_query();
    }
    return deferred.promise;
  }

  getCompletions(t) {
    var p = this.getCompletionsPromise(t);
    return p.then((result) => {
        if (t === "metrics") {
            return _.map(result, (m) => {return {text: m, name: m};});
        } else {
            return result;
        }
    }).then(this.uiSegmentSrv.transformToSegments(false));
  }

  getCompleter(mode) {
      return new GnocchiQueryCompleter(this, mode);
  }

  getReaggregators() {
    var agg = ['none', 'mean', 'sum', 'min', 'max',
     'std', 'median', 'first', 'last', 'count', 'rate:last',
     '5pct', '10pct', '90pct', '95pct'];
    return _.map(agg, function(v) {
      return {text: v, value: v};
    });
  }

  setReaggregator(option) {
      if (option !== undefined) {
        this.target.reaggregator = option.value;
      }
      this.refresh();
  }

  getGroupBy(index) {
    return this.datasource.getResourceTypes().then((resource_types) => {
      var i = _.findIndex(resource_types, (rt: any) => {
          return rt.name === this.target.resource_type;
      });
      var attributes = _.difference(
          _.concat(this.datasource.GENERIC_ATTRIBUTES,
                   _.keys(resource_types[i]['attributes'])),
          _.without(this.groupby_segments, this.groupby_segments[index])
      );
      attributes.sort();
      attributes.unshift(this.REMOVE_ME);
      return _.map(attributes, (attr) => {
        return {text: attr, value: attr};
      });
    }).then(this.uiSegmentSrv.transformToSegments(false));
  }

  addGroupBy() {
    if (!_.includes(this.groupby_segments, this.SET_ME)) {
        this.groupby_segments.push(this.SET_ME);
    }
  }

  setGroupBy(index, option) {
    if (option === undefined || _.trim(option.value) === "" || option.value === this.REMOVE_ME) {
      this.groupby_segments.splice(index, 1);
    } else {
      this.groupby_segments[index] = option.value;
    }
    this.target.groupby = _.without(this.groupby_segments, this.SET_ME).join(",");
    this.refresh();
  }

  refresh_query() {
    if (_.isEqual(this.oldTarget, this.target)) {
      return ;
    }
    this.datasource.getCompletionsCache(this.target, null).then((cache) => {
        this.cache = cache;
        this.refresh();
    });
  }

  refresh_metric(option) {
    if (_.isEqual(this.oldTarget, this.target)) {
      return ;
    }
    this.target.ready_metric = false;
    this.datasource.getCompletionsCache(this.target, this.cache['resources']).then((cache) => {
        this.cache = cache;
        this.refresh();
    });
  }

  refresh(){
    _.forEach(this.cache_promises, (p) => {
        p[1].resolve(this.cache[p[0]]);
    });
    this.cache_promises = [];

    if (!_.isEqual(this.oldTarget, this.target)) {

      if (this.target.queryMode !== "dynamic_aggregates") {
          // Ensure we have a valid aggregator
          if (!_.includes(this.cache["aggregators"], this.target.aggregator)) {
            if (_.includes(this.cache["aggregators"], this.last_valid_aggregator)) {
              this.target.aggregator = this.last_valid_aggregator;
            } else {
              this.target.aggregator = this.cache["aggregators"][0];
            }
          } else {
            this.last_valid_aggregator = this.target.aggregator;
          }
      }

      this.oldTarget = angular.copy(this.target);

      this.ValidateTarget();
      if (this.errors.length === 0) {
         this.panelCtrl.refresh();
      }
    }
  }

  ValidateTarget(){
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

  }

  // QueryCTRL stuffs
  getNextQueryLetter() {
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return _.find(letters, refId => {
      return _.every(this.panel.targets, function(other: any) {
        return other.refId !== refId;
      });
    });
  }
}
