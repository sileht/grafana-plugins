
import * as _ from "lodash";

export default class BackendSrvMock {
    constructor(private $http) {
    }

    datasourceRequest(options) {
      var self = this;
      options.retry = options.retry || 0;
      return self.$http(options).then(function(data){
          return data;
      }, function(err) {
        //populate error obj on Internal Error
        if (_.isString(err.data) && err.status === 500) {
          err.data = {
            error: err.statusText
          };
        }

        // for Prometheus
        if (!err.data.message && _.isString(err.data.error)) {
          err.data.message = err.data.error;
        }

        throw err;
      });
    }
}
