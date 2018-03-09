// jshint ignore: start
// jscs: disable
ace.define("ace/mode/gnocchiquery_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var GnocchiQueryHighlightRules = function() {
    this.$rules = {
        "start" : [
            {token : "keyword.operator.binary", regex: ">=|<=|!=|>|<|=|==|eq|ne|lt|gt|ge|le|like|in|≠|≥|≤"},
            {token : "keyword.operator.link", regex: "and|or|∧|∨"},
            {token : "string", regex : "`", next: "string0"},
            {token : "string", regex : "'", next: "string1"},
            {token : "string", regex : '"', next: "string2"},
            {token : "constant.language", regex : "(?:null|none|None)\\b"},
            {token : "constant.language.boolean", regex: "(?:true|True|false|False)\\b"},
            {token : "constant.numeric", regex : "0[xX][0-9a-fA-F]+\\b" },
            {token : "constant.numeric", regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"},
            {token : "identifier", regex: "\\b[\\[\\]\\$\\{\\}\\w]+\\b"},
            {token : "text", regex : "\\s+"},
        ],
        "string0" : [
            {token : "constant.language.escape",   regex : "``"},
            {token : "string", regex : "`",     next  : "start"},
            {defaultToken : "string"}
        ],
        "string1" : [
            {token : "constant.language.escape",   regex : "''"},
            {token : "string", regex : "'",     next  : "start"},
            {defaultToken : "string"}
        ],
        "string2" : [
            {token : "constant.language.escape",   regex : '""'},
            {token : "string", regex : '"',     next  : "start"},
            {defaultToken : "string"}
        ],

    };
    this.normalizeRules();
};

oop.inherits(GnocchiQueryHighlightRules, TextHighlightRules);

exports.GnocchiQueryHighlightRules = GnocchiQueryHighlightRules;
});

ace.define("ace/mode/gnocchiquery_completions",["require","exports","module","ace/token_iterator", "ace/lib/lang"], function(require, exports, module) {
"use strict";

var lang = require("../lib/lang");
var GnocchiQueryCompletions = function() {};

(function() {
  this.getCompletions = function(state, session, pos, prefix, callback) {
    // dummy completer to avoid unwanted keyword/local completion
    return callback(null, []);
  };

}).call(GnocchiQueryCompletions.prototype);

exports.GnocchiQueryCompletions = GnocchiQueryCompletions;
});

ace.define("ace/mode/gnocchiquery",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/gnocchiquery_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var GnocchiQueryHighlightRules = require("./gnocchiquery_highlight_rules").GnocchiQueryHighlightRules;
var GnocchiQueryCompletions = require("./gnocchiquery_completions").GnocchiQueryCompletions;

var Mode = function() {
  this.HighlightRules = GnocchiQueryHighlightRules;
  this.$behaviour = this.$defaultBehaviour;
  this.$completer = new GnocchiQueryCompletions();
  this.completer = this.$completer;
};
oop.inherits(Mode, TextMode);

(function() {

  this.$id = "ace/mode/gnocchiquery";
}).call(Mode.prototype);

exports.Mode = Mode;

});
