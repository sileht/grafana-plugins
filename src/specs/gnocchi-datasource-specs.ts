///<reference path="../../typings/index.d.ts" />

import {Datasource} from "../module";
import BackendSrvMock from "./mocks/backendsrv";
import TemplateSrvMock from "./mocks/templatesrv";
import * as moment from "moment";
import * as angular from "angular";

describe('GnocchiDatasource', function() {
  var ds = null;
  var $q = null;
  var $httpBackend = null;
  var backendSrv = null;
  var templateSrv = null;
  var results = null;

  beforeEach(angular.mock.inject(function($injector) {
    $q = $injector.get("$q");
    $httpBackend = $injector.get('$httpBackend');
    backendSrv = new BackendSrvMock($injector.get('$http'));
    templateSrv = new TemplateSrvMock();
    ds = new Datasource({url: [''], jsonData: {token: 'XXXXXXXXXXXXX', 'mode': 'token'} },
                         $q, backendSrv, templateSrv);
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  function assert_simple_test(targets, method, url, data, label, pre_assert, post_assert) {
    var query = {
      range: { from: moment.utc([2014, 3, 10, 3, 20, 10]), to: moment.utc([2014, 3, 20, 3, 20, 10]) },
      targets: targets,
      interval: '1s'
    };
    var headers = {"X-Auth-Token": "XXXXXXXXXXXXX", "Accept": "application/json, text/plain, */*",
                   "Content-Type": "application/json"};

    it('should return series list', angular.mock.inject(function() {
      if (pre_assert) {
          pre_assert();
      }
      $httpBackend.expect(method, url, data, headers).respond([
        ["2014-10-06T14:00:00+00:00", "600.0", "7"],
        ["2014-10-06T14:20:00+00:00", "600.0", "5"],
        ["2014-10-06T14:33:00+00:00", "60.0", "43.1"],
        ["2014-10-06T14:34:00+00:00", "60.0", "12"],
        ["2014-10-06T14:36:00+00:00", "60.0", "2"]
      ]);
      if (post_assert) {
          post_assert();
      }
      ds.query(query).then(function(data) {
          results = data;
      });

      $httpBackend.flush();

      expect(results.data.length).to.be(1);
      expect(results.data[0].target).to.be(label);
      expect(results.data[0].datapoints).to.eql([
        [ '7', 1412604000000 ],
        [ 0, 1412604600000 ],
        [ '5', 1412605200000 ],
        [ 0, 1412605260000 ],
        [ 0, 1412605320000 ],
        [ 0, 1412605380000 ],
        [ 0, 1412605440000 ],
        [ 0, 1412605500000 ],
        [ 0, 1412605560000 ],
        [ 0, 1412605620000 ],
        [ 0, 1412605680000 ],
        [ 0, 1412605740000 ],
        [ 0, 1412605800000 ],
        [ 0, 1412605860000 ],
        [ 0, 1412605920000 ],
        [ '43.1', 1412605980000 ],
        [ '12', 1412606040000 ],
        [ 0, 1412606100000 ],
        [ '2', 1412606160000 ]]
      );
    }));
  }

  describe('Resource', function() {
    assert_simple_test(
      [{ queryMode: 'resource', resource_type:   'instance', resource_id: 'my_uuid', metric_name: 'cpu_util', aggregator: 'max' }],
      'GET',
      "/v1/resource/instance/my_uuid/metric/cpu_util/measures?" +
        "aggregation=max&end=2014-04-20T03:20:10.000Z&start=2014-04-10T03:20:10.000Z&stop=2014-04-20T03:20:10.000Z",
      null,
      '6868da77-fa82-4e67-aba9-270c5ae8cbca', function() {
          $httpBackend.expect("GET", "/v1/resource/instance/my_uuid").respond({
              "display_name": "myfirstvm",
              "id": "6868da77-fa82-4e67-aba9-270c5ae8cbca",
          });
      }, null);
  });

  describe('Metric', function() {
    assert_simple_test(
      [{ queryMode: 'metric', metric_id: 'my_uuid', aggregator: 'max' }],
      'GET',
      '/v1/metric/my_uuid/measures?aggregation=max&end=2014-04-20T03:20:10.000Z&start=2014-04-10T03:20:10.000Z' +
      '&stop=2014-04-20T03:20:10.000Z',
      null,
      'my_uuid', null, null);
  });

  describe('Resource aggregation JSON', function() {
    assert_simple_test(
      [{ queryMode: 'resource_aggregation', resource_search: '{"=": {"server_group": "autoscaling_group"}}',
        resource_type: 'instance', label: 'my_aggregation', metric_name: 'cpu_util', aggregator: 'max' }],
      'POST',
      "/v1/aggregation/resource/instance/metric/cpu_util?" +
        "aggregation=max&end=2014-04-20T03:20:10.000Z&start=2014-04-10T03:20:10.000Z&stop=2014-04-20T03:20:10.000Z",
      {"=": {"server_group": "autoscaling_group"}},
      'my_aggregation', null, null);
  });

  describe('Resource aggregation expression', function() {
    assert_simple_test(
      [{ queryMode: 'resource_aggregation', resource_search: 'server_group=autoscaling_group',
        resource_type: 'instance', label: 'my_aggregation', metric_name: 'cpu_util', aggregator: 'max' }],
      'POST',
      "/v1/aggregation/resource/instance/metric/cpu_util?" +
        "aggregation=max&end=2014-04-20T03:20:10.000Z" +
        "&filter=server_group%3Dautoscaling_group" +
        "&start=2014-04-10T03:20:10.000Z&stop=2014-04-20T03:20:10.000Z",
      null,
      'my_aggregation', null, null);
  });

  describe('MetricFindQuery resources() query', function(){
    var url_expected_search_resources = "/v1/search/resource/instance?filter=server_group%3D'autoscaling_group'";
    var response_search_resources = [
      {
        "display_name": "myfirstvm",
        "host": "compute1",
        "id": "6868da77-fa82-4e67-aba9-270c5ae8cbca",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscaling_group",
        "metrics": {"cpu_util": "1634173a-e3b8-4119-9eba-fa9a4d971c3b"}
      },
      {
        "display_name": "mysecondvm",
        "host": "compute1",
        "id": "f898ba55-bbea-460f-985c-3d1243348304",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscaling_group",
        "metrics": {"cpu_util": "1634173a-e3b8-4119-9eba-fa9a4d971c3b"}
      }
    ];

    var results;

    beforeEach(function() {
      $httpBackend.expect('POST', url_expected_search_resources).respond(response_search_resources);
      ds.metricFindQuery("resources(instance, display_name, server_group='autoscaling_group')").then(function(data) { results = data; });
      $httpBackend.flush();
    });

    it("nothing more", function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should return series list', function() {
      expect(results.length).to.be(2);
      expect(results[0].text).to.be('myfirstvm');
      expect(results[1].text).to.be('mysecondvm');
    });

  });

  describe('Resource search JSON', function() {
    var query = {
      range: { from: moment.utc([2014, 3, 10, 3, 20, 10]), to: moment.utc([2014, 3, 20, 3, 20, 10]) },
      targets: [{ hide: false, queryMode: 'resource_search', resource_search: '{"=": {"server_group": "autoscalig_group"}}',
        resource_type: 'instance', label: '$display_name', metric_name: 'cpu_.*', aggregator: 'max' }],
      interval: '1s'
    };

    var url_expected_search_resources = "/v1/search/resource/instance";
    var response_search_resources = [
      {
        "display_name": "myfirstvm",
        "host": "compute1",
        "id": "6868da77-fa82-4e67-aba9-270c5ae8cbca",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscalig_group",
        "metrics": {"cpu_util": "1634173a-e3b8-4119-9eba-fa9a4d971c3b"}
      },
      {
        "display_name": "mysecondvm",
        "host": "compute1",
        "id": "f898ba55-bbea-460f-985c-3d1243348304",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscalig_group",
        "metrics": {"cpu_util": "1634173a-e3b8-4119-9eba-fa9a4d971c3b",
                    "cpu_time": "1634173a-e3b8-4119-9eba-fa9a4d971c3b"}
      }
    ];

    var url_expected_get_measures1 = "/v1/resource/instance/6868da77-fa82-4e67-aba9-270c5ae8cbca/metric/cpu_util/measures?" +
      "aggregation=max&end=2014-04-20T03:20:10.000Z&start=2014-04-10T03:20:10.000Z&stop=2014-04-20T03:20:10.000Z";
    var response_get_measures1 = [
      ["2014-10-06T14:33:57+00:00", "60.0", "43.1"],
      ["2014-10-06T14:34:12+00:00", "60.0", "12"],
      ["2014-10-06T14:34:20+00:00", "60.0", "2"],
    ];

    var url_expected_get_measures2 = "/v1/resource/instance/f898ba55-bbea-460f-985c-3d1243348304/metric/cpu_util/measures?" +
      "aggregation=max&end=2014-04-20T03:20:10.000Z&start=2014-04-10T03:20:10.000Z&stop=2014-04-20T03:20:10.000Z";
    var response_get_measures2 = [
      ["2014-10-06T14:33:57+00:00", "60.0", "22.1"],
      ["2014-10-06T14:34:12+00:00", "60.0", "3"],
      ["2014-10-06T14:34:20+00:00", "60.0", "30"],
    ];

    var url_expected_get_measures3 = "/v1/resource/instance/f898ba55-bbea-460f-985c-3d1243348304/metric/cpu_time/measures?" +
      "aggregation=max&end=2014-04-20T03:20:10.000Z&start=2014-04-10T03:20:10.000Z&stop=2014-04-20T03:20:10.000Z";
    var response_get_measures3 = [
      ["2014-10-06T14:33:57+00:00", "60.0", "2"],
      ["2014-10-06T14:34:12+00:00", "60.0", "1"],
      ["2014-10-06T14:34:20+00:00", "60.0", "1"],
    ];

    var results;
    beforeEach(function() {
      $httpBackend.expect('POST', url_expected_search_resources).respond(response_search_resources);
      $httpBackend.expect('GET', url_expected_get_measures1).respond(response_get_measures1);
      $httpBackend.expect('GET', url_expected_get_measures2).respond(response_get_measures2);
      $httpBackend.expect('GET', url_expected_get_measures3).respond(response_get_measures3);
      ds.query(query).then(function(data) { results = data; });
      $httpBackend.flush();
    });

    it("nothing more", function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should return series list', function() {
      expect(results.data.length).to.be(3);
      expect(results.data[0].target).to.be('myfirstvm - cpu_util');
      expect(results.data[1].target).to.be('mysecondvm - cpu_util');
      expect(results.data[2].target).to.be('mysecondvm - cpu_time');
      expect(results.data[0].datapoints[0][0]).to.be('43.1');
      expect(results.data[0].datapoints[0][1]).to.be(1412606037000);
      expect(results.data[0].datapoints[1][0]).to.be('12');
      expect(results.data[0].datapoints[1][1]).to.be(1412606052000);
      expect(results.data[0].datapoints[2][0]).to.be('2');
      expect(results.data[0].datapoints[2][1]).to.be(1412606060000);
    });
  });


  describe('Resource search filter expression', function() {
    var query = {
      range: { from: moment.utc([2014, 3, 10, 3, 20, 10]), to: moment.utc([2014, 3, 20, 3, 20, 10]) },
      targets: [{ hide: false, queryMode: 'resource_search', resource_search: 'server_group="autoscaling_group"',
        resource_type: 'instance', label: '$display_name', metric_name: 'cpu_util', aggregator: 'max' }],
      interval: '1s'
    };

    var url_expected_search_resources = "/v1/search/resource/instance?filter=server_group%3D%22autoscaling_group%22";
    var response_search_resources = [
      {
        "display_name": "myfirstvm",
        "host": "compute1",
        "id": "6868da77-fa82-4e67-aba9-270c5ae8cbca",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscalig_group",
        "metrics": {"cpu_util": "1634173a-e3b8-4119-9eba-fa9a4d971c3b"}
      },
      {
        "display_name": "mysecondvm",
        "host": "compute1",
        "id": "f898ba55-bbea-460f-985c-3d1243348304",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscalig_group",
        "metrics": {"cpu_util": "1634173a-e3b8-4119-9eba-fa9a4d971c3b"}
      }
    ];

    var url_expected_get_measures1 = "/v1/resource/instance/6868da77-fa82-4e67-aba9-270c5ae8cbca/metric/cpu_util/measures?" +
      "aggregation=max&end=2014-04-20T03:20:10.000Z&start=2014-04-10T03:20:10.000Z&stop=2014-04-20T03:20:10.000Z";
    var response_get_measures1 = [
      ["2014-10-06T14:33:57+00:00", "60.0", "43.1"],
      ["2014-10-06T14:34:12+00:00", "60.0", "12"],
      ["2014-10-06T14:34:20+00:00", "60.0", "2"],
    ];

    var url_expected_get_measures2 = "/v1/resource/instance/f898ba55-bbea-460f-985c-3d1243348304/metric/cpu_util/measures?" +
      "aggregation=max&end=2014-04-20T03:20:10.000Z&start=2014-04-10T03:20:10.000Z&stop=2014-04-20T03:20:10.000Z";
    var response_get_measures2 = [
      ["2014-10-06T14:33:57+00:00", "60.0", "22.1"],
      ["2014-10-06T14:34:12+00:00", "60.0", "3"],
      ["2014-10-06T14:34:20+00:00", "60.0", "30"],
    ];

    var results;
    beforeEach(function() {
      $httpBackend.expect('POST', url_expected_search_resources).respond(response_search_resources);
      $httpBackend.expect('GET', url_expected_get_measures1).respond(response_get_measures1);
      $httpBackend.expect('GET', url_expected_get_measures2).respond(response_get_measures2);
      ds.query(query).then(function(data) { results = data; });
      $httpBackend.flush();
    });

    it("nothing more", function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should return series list', function() {
      expect(results.data.length).to.be(2);
      expect(results.data[0].target).to.be('myfirstvm');
      expect(results.data[1].target).to.be('mysecondvm');
      expect(results.data[0].datapoints[0][0]).to.be('43.1');
      expect(results.data[0].datapoints[0][1]).to.be(1412606037000);
      expect(results.data[0].datapoints[1][0]).to.be('12');
      expect(results.data[0].datapoints[1][1]).to.be(1412606052000);
      expect(results.data[0].datapoints[2][0]).to.be('2');
      expect(results.data[0].datapoints[2][1]).to.be(1412606060000);
    });
  });

  describe("TestDatasource success", function() {
    var results;
    beforeEach(function() {
      $httpBackend.expect('GET', "").respond(200);
      ds.testDatasource().then(function(data) { results = data; });
      $httpBackend.flush();
    });

    it("nothing more", function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should success', function() {
      expect(results.status).to.be('success');
      expect(results.message).to.be('Data source is working');
    });
  });

  describe("TestDatasource keystone success", function() {
    var results;
    beforeEach(function() {
      ds = new Datasource({
        'url': 'http://localhost:5000',
        'jsonData': {'mode': 'keystone', 'username': 'user', 'project': 'proj', 'password': 'pass', 'domain': 'foo'}
      }, $q, backendSrv, templateSrv);

      $httpBackend.expect(
        'POST', "http://localhost:5000/v3/auth/tokens",
        {"auth": { "identity": { "methods": ["password"],
          "password": { "user": { "name": "user", "password": "pass", "domain": { "id": "foo"}}}},
          "scope": { "project": { "domain": { "id": "foo" }, "name": "proj"}}}},
          {'Content-Type': 'application/json', "Accept": "application/json, text/plain, */*"}
      ).respond({'token': {'catalog': [{'type': 'metric', 'endpoints':
        [{'url': 'http://localhost:8041/', 'interface': 'public'}]}]}}, {'X-Subject-Token': 'foobar'});
      $httpBackend.expect('GET', "http://localhost:8041/v1/resource", null,
                             {"Accept": "application/json, text/plain, */*",
                              "X-Auth-Token": "foobar"}).respond(200);

      ds.testDatasource().then(function(data) { results = data; });
      $httpBackend.flush();
    });

    it("nothing more", function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should success', function() {
      expect(results.status).to.be('success');
      expect(results.message).to.be('Data source is working');
    });
  });

  describe("metricFindQuery resource", function() {
    var url_expected_search_resources = "/v1/search/resource/instance";
    var response_search_resources = [
      {
        "display_name": "myfirstvm",
        "host": "compute1",
        "id": "6868da77-fa82-4e67-aba9-270c5ae8cbca",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscalig_group",
        "metrics": {"cpu_util": "1634173a-e3b8-4119-9eba-fa9a4d971c3b"}
      },
      {
        "display_name": "mysecondvm",
        "host": "compute1",
        "id": "f898ba55-bbea-460f-985c-3d1243348304",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscalig_group",
        "metrics": {"cpu_util": "1634173a-e3b8-4119-9eba-fa9a4d971c3b"}
      }
    ];

    var results;
    beforeEach(function() {
      $httpBackend.expect('POST', url_expected_search_resources).respond(response_search_resources);
      ds.metricFindQuery('resources(instance, id, {"=": {"id": "foobar"}})').then(function(data) { results = data; });
      $httpBackend.flush();
    });

    it("nothing more", function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should success', function() {
      expect(results.length).to.be(2);
      expect(results[0].text).to.be("6868da77-fa82-4e67-aba9-270c5ae8cbca");
      expect(results[1].text).to.be("f898ba55-bbea-460f-985c-3d1243348304");
    });
  });

  describe("metricFindQuery metric", function() {
    var url_expected = "/v1/resource/generic/6868da77-fa82-4e67-aba9-270c5ae8cbca";
    var response_resource = {
      "created_by_project_id": "8a722a26-e0a0-4993-b283-76925b7b02de",
      "created_by_user_id": "5587ebf3-58a5-42eb-8024-ef756e09a552",
      "ended_at": null,
      "id": "cba8d3d5-d5e1-4692-bcfe-d77feaf01d7e",
      "metrics": {
        "temperature": "86adbe6c-22d7-4a86-9ab7-e8d112f6cb79",
        "cpu_util": "ccdd3d2c-7f83-42a0-9280-49e0791349dd"
      },
      "project_id": "bd3a1e52-1c62-44cb-bf04-660bd88cd74d",
      "revision_end": null,
      "revision_start": "2015-09-10T08:00:25.690667+00:00",
      "started_at": "2015-09-10T08:00:25.690654+00:00",
      "type": "generic",
      "user_id": "bd3a1e52-1c62-44cb-bf04-660bd88cd74d"
    };

    var results;
    beforeEach(function() {
      $httpBackend.expect('GET', url_expected).respond(response_resource);
      ds.metricFindQuery('metrics(6868da77-fa82-4e67-aba9-270c5ae8cbca)').then(function(data) { results = data; });
      $httpBackend.flush();
    });

    it("nothing more", function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should success', function() {
      expect(results.length).to.be(2);
      expect(results[0].text).to.be("temperature");
      expect(results[1].text).to.be("cpu_util");
    });
  });

  describe("metricFindQuery unknown", function() {
    var results;
    beforeEach(function() {
      ds.metricFindQuery('not_existing(instance, id, {"=": {"id": "foobar"}})').then(function(data) { results = data; });
    });

    it("nothing more", function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should success', function() {
      expect(results.length).to.be(0);
    });
  });


  // QueryCtrl tests
  var resources = [
    {
      "created_by_project_id": "8a722a26-e0a0-4993-b283-76925b7b02de",
      "created_by_user_id": "5587ebf3-58a5-42eb-8024-ef756e09a552",
      "ended_at": null,
      "id": "cba8d3d5-d5e1-4692-bcfe-d77feaf01d7e",
      "metrics": {
        "temperature": "86adbe6c-22d7-4a86-9ab7-e8d112f6cb79",
        "cpu_util": "ccdd3d2c-7f83-42a0-9280-49e0791349dd"
      },
      "project_id": "bd3a1e52-1c62-44cb-bf04-660bd88cd74d",
      "revision_end": null,
      "revision_start": "2015-09-10T08:00:25.690667+00:00",
      "started_at": "2015-09-10T08:00:25.690654+00:00",
      "type": "generic",
      "user_id": "bd3a1e52-1c62-44cb-bf04-660bd88cd74d"
    },
    {
      "created_by_project_id": "8a722a26-e0a0-4993-b283-76925b7b02de",
      "created_by_user_id": "5587ebf3-58a5-42eb-8024-ef756e09a552",
      "ended_at": null,
      "id": "9b4f6da9-4e67-4cfd-83bd-fb4b8bcc8dd8",
      "metrics": {},
      "project_id": "bd3a1e52-1c62-44cb-bf04-660bd88cd74d",
      "revision_end": null,
      "revision_start": "2015-09-10T08:00:25.690667+00:00",
      "started_at": "2015-09-10T08:00:25.690654+00:00",
      "type": "generic",
      "user_id": "bd3a1e52-1c62-44cb-bf04-660bd88cd74d"
    },
  ];

  var metrics = [
    {
      "id": "b8c73d22-d944-47d9-9d84-1e7f618c25e1",
      "archive_policy": {},  // shouldn't be empty be too big and useless for test
      "created_by_project_id": "8a722a26-e0a0-4993-b283-76925b7b02de",
      "created_by_user_id": "5587ebf3-58a5-42eb-8024-ef756e09a552",
      "name": "temperature",
      "resource_id": "cba8d3d5-d5e1-4692-bcfe-d77feaf01d7e"
    },
    {
      "id": "86adbe6c-22d7-4a86-9ab7-e8d112f6cb79",
      "archive_policy": {},  // shouldn't be empty be too big and useless for test
      "created_by_project_id": "8a722a26-e0a0-4993-b283-76925b7b02de",
      "created_by_user_id": "5587ebf3-58a5-42eb-8024-ef756e09a552",
      "name": "cpu_util",
      "resource_id": "cba8d3d5-d5e1-4692-bcfe-d77feaf01d7e"
    }
  ];


  describe('suggestMetricIDs', function() {
    var results;
    it('should return metric ids', function() {
      $httpBackend.expect('GET', "/v1/metric").respond(metrics);
      ds.performSuggestQuery("foobar", "metrics", {}).then(function(data) { results = data ; });
      $httpBackend.flush();
      expect(results.length).to.be(2);
      expect(results[0]).to.be('b8c73d22-d944-47d9-9d84-1e7f618c25e1');
      expect(results[1]).to.be('86adbe6c-22d7-4a86-9ab7-e8d112f6cb79');
    });
  });

  describe('suggestResourceIDs', function() {
    var results;
    it('should return resource ids', function() {
      $httpBackend.expect('GET', "/v1/resource/generic").respond(resources);
      ds.performSuggestQuery("foobar", "resources", {}).then(function(data) { results = data ; });
      $httpBackend.flush();
      expect(results.length).to.be(2);
      expect(results[0]).to.be('cba8d3d5-d5e1-4692-bcfe-d77feaf01d7e');
      expect(results[1]).to.be('9b4f6da9-4e67-4cfd-83bd-fb4b8bcc8dd8');
    });
  });

  describe('suggestMetricNames', function() {
    var results;
    it('should return resource ids', function() {
      var target = {'resource_id': 'cba8d3d5-d5e1-4692-bcfe-d77feaf01d7e', 'queryMode': 'resource'};
      $httpBackend.expect('GET', "/v1/resource/generic/cba8d3d5-d5e1-4692-bcfe-d77feaf01d7e").respond(resources[0]);
      ds.performSuggestQuery("foobar", "metric_names", target).then(function(data) { results = data ; });
      $httpBackend.flush();
      expect(results.length).to.be(2);
      expect(results[0]).to.be('temperature');
      expect(results[1]).to.be('cpu_util');
    });
  });


  // FIXME(sileht): The test is bugged
  /*
  describe('validate query success', function() {
    it('no target error', function() {
      var target = {'resource_search': '{"=": {"id": "foobar"}}',
                    'queryMode': 'resource_search', 'metric_name': 'cpu_util'};
      $httpBackend.expect('POST', "/v1/search/resource/generic").respond([]);
      $httpBackend.expect('POST', "/v1/search/resource/generic").respond([]);
      var error = ds.validateTarget(target, false);
      expect(error).to.be(undefined);
      $httpBackend.flush();
    });
  });
  */

  describe('validate query missing field', function() {
    it('resource', function() {
      var target = {'resource_id': '', 'queryMode': 'resource', 'metric_name': ''};
      var error = ds.validateTarget(target, false);
      expect(error).to.be("Missing or invalid fields: Resource ID, Metric name");
    });

    it('metric', function() {
      var target = {'metric_id': '', 'queryMode': 'metric'};
      var error = ds.validateTarget(target, false);
      expect(error).to.be("Missing or invalid fields: Metric ID");
    });

    it('resource_search', function() {
      var target = {'resource_search': '', 'queryMode': 'resource_search', 'metric_name': ''};
      var error = ds.validateTarget(target, false);
      expect(error).to.be("Missing or invalid fields: Query, Metric name");
    });
  });



});
;
