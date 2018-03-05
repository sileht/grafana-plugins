// jshint ignore: start
// jscs: disable
ace.define("ace/mode/gnocchioperations_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var GnocchiOperationsHighlightRules = function() {
    var aggregators = this.createKeywordMapper({
        "aggregator": "mean|median|std|min|max|sum|var|count",
    }, "invalid.illegal.aggregator", true);

    var math = this.createKeywordMapper({
        "math": "+|add|%|mod|-|sub|\\*|×|mul|/|÷|div|\\*\\*|pow|^|cos|sin|abs|cos|sin|tan|floor|ceil|neg|rateofchange",
    }, "invalid.illegal.operation", true);

    // TODO(sileht): prefix token by ace known name for better color
    this.$rules = {
        "start": [
            {token: "metric.start", regex: "metric", next: "metric"},
            {token: "constant.numeric", regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"},
            {token: "aggregate", regex: "aggregate", next: "aggregate"},
            {token: "rolling", regex: "rolling", next: "rolling"},
            {token: "resample", regex: "resample", next: "resample"},
            {token: "text", regex: "\\s+"},
            {token: math, regex: "\\b\\w+\\b"},
        ],
        "metric": [
            {token : "metric.name", regex: "\\b[^\\s]+\\b", next: "aggregator"},
            // TODO(sileht): allow quoted metric
        ],
        "aggregator": [
            {token : "metric.aggregator", regex: "\\b[^\\s]+\\b", next: "start"},
        ],
        "aggregate": [
            {token : aggregators, regex: "\\b\\w+\\b", next: "start"},
        ],
        "rolling": [
            {token : aggregators, regex: "\\b\\w+\\b", next: "rollingwindow"},
        ],
        "rollingwindow": [
            {token : "rolling.window", regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b", next: "start"},
            {token : "invalid.illegal.rollingwindow", regex: "\\b\\w+\\b"},
        ],
        "resample": [
            {token : aggregators, regex: "\\b\\w+\\b", next: "resamplegranularity"},
        ],
        "resamplegranularity": [
            {token : "resample.granularity", regex: "\\d+\\w?\\b", next: "start"},
            {token : "invalid.illegal.granularity", regex: "\\b\\w+\\b"},
        ],

    };
    this.normalizeRules();
};

oop.inherits(GnocchiOperationsHighlightRules, TextHighlightRules);

exports.GnocchiOperationsHighlightRules = GnocchiOperationsHighlightRules;
});

ace.define("ace/mode/gnocchioperations_completions",["require","exports","module","ace/token_iterator", "ace/lib/lang"], function(require, exports, module) {
"use strict";

var lang = require("../lib/lang");
var GnocchiOperationsCompletions = function() {};

(function() {
  this.getCompletions = function(state, session, pos, prefix, callback) {
    // dummy completer to avoid unwanted keyword/local completion
    return callback(null, []);
  };

}).call(GnocchiOperationsCompletions.prototype);

exports.GnocchiOperationsCompletions = GnocchiOperationsCompletions;
});


ace.define("ace/mode/gnocchioperations",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/gnocchioperations_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var GnocchiOperationsHighlightRules = require("./gnocchioperations_highlight_rules").GnocchiOperationsHighlightRules;
var GnocchiOperationsCompletions = require("./gnocchioperations_completions").GnocchiOperationsCompletions;

var Mode = function() {
  this.HighlightRules = GnocchiOperationsHighlightRules;
  this.$behaviour = this.$defaultBehaviour;
  this.$completer = new GnocchiOperationsCompletions();
  this.completer = this.$completer;
};
oop.inherits(Mode, TextMode);

(function() {

  this.$id = "ace/mode/gnocchioperations";
}).call(Mode.prototype);

exports.Mode = Mode;

});
