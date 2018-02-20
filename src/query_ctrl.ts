
import * as _ from "lodash";
import * as angular from "angular";

export class GnocchiDatasourceQueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  // This is a copy of QueryCtrl interface
  target: any;
  oldTarget: any;
  datasource: any;
  panelCtrl: any;
  panel: any;
  hasRawMode: boolean;
  error: string;

  // local stuffs
  aggregators: any;
  resource_types: any;
  queryModes: any;
  suggestResourceIDs: any;
  suggestMetricIDs: any;
  suggestMetricNames: any;
  suggestGroupBy: any;

  constructor(public $scope, private $injector) {
    this.$scope = $scope;
    this.panel = this.panelCtrl.panel;

    this.queryModes = [
        {text: 'resource search', value: 'resource_search'},
        // Not release yet
        // {text: 'resource search (group by)', value: 'resource_groupby'},
        {text: 'resource search (aggregated measurements)', value: 'resource_aggregation'},
        {text: 'resource ID and metric name (deprecated)', value: 'resource'},
        {text: 'metric ID', value: 'metric'}
    ];

    this.datasource.requireVersion("4.1.1").then(() => {
        this.queryModes.splice(0, 0,
            {text: 'dynamic aggregates (Recommended)', value: 'dynamic_aggregates'}
        );
    });

    this.datasource.getResourceTypes().then((resource_types) => {
      this.resource_types = resource_types;
    });

    if (!this.target.refId) {
        this.target.refId = this.getNextQueryLetter();
    }

    // default
    if (!this.target.aggregator) {
        this.target.aggregator = 'mean';
    }
    if (!this.target.reaggregator) {
        this.target.reaggregator = 'none';
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

    this.suggestResourceIDs = (query, callback) => {
      this.datasource.performSuggestQuery(query, 'resources', this.target).then(callback);
    };

    this.suggestGroupBy = (query, callback) => {
      this.datasource.performSuggestQuery(query, 'groupby', this.target).then(callback);
    };

    this.suggestMetricIDs = (query, callback)  => {
      this.datasource.performSuggestQuery(query, 'metrics', this.target).then(callback);
    };

    this.suggestMetricNames = (query, callback) => {
      this.datasource.performSuggestQuery(query, 'metric_names', this.target).then(callback);
    };

    this.refresh();
  }


  getAggregators(none) {
    var agg = ['mean', 'sum', 'min', 'max',
     'std', 'median', 'first', 'last', 'count', 'rate:last',
     '5pct', '10pct', '90pct', '95pct'];
    if (none){
        agg.splice(0, 0, "none");
    }
    return _.map(agg, function(v) {
      return {text: v, value: v};
    });
  }

  setAggregator(option) {
      if (option !== undefined) {
        this.target.aggregator = option.value;
      }
      this.refresh();
  }

  setReaggregator(option) {
      if (option !== undefined) {
        this.target.reaggregator = option.value;
      }
      this.refresh();
  }

  refresh(){
    if (!_.isEqual(this.oldTarget, this.target)) {
      this.oldTarget = angular.copy(this.target);
      this.panelCtrl.refresh();
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
