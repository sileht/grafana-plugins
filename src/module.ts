
import { GnocchiDatasource } from './datasource';
import { GnocchiDatasourceQueryCtrl } from './query_ctrl';

class GnocchiConfigCtrl {
    static templateUrl = 'partials/config.html';
}

class GnocchiQueryOptionsCtrl {
    static templateUrl = 'partials/query.options.html';
}

export {
  GnocchiDatasource as Datasource,
  GnocchiDatasourceQueryCtrl as QueryCtrl,
  GnocchiConfigCtrl as ConfigCtrl,
  GnocchiQueryOptionsCtrl as QueryOptionsCtrl,
};
