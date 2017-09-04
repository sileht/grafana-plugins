# Grafana Gnocchi datasource [![Travis CI](https://travis-ci.org/gnocchixyz/grafana-gnocchi-datasource.png?branch=master)](https://travis-ci.org/gnocchixyz/grafana-gnocchi-datasource)

Gnocchi datasource for Grafana 3 and 4

## Installation via grafana.net

    $ sudo grafana-cli plugins install gnocchixyz-gnocchi-datasource


## Installation from sources

    $ npm install
    $ ./run-tests.sh  # This also build the plugin under dist/

    $ ln -s dist /var/lib/grafana/plugins/grafana-gnocchi-datasource
    $ # or
    $ cp -a dist /var/lib/grafana/plugins/grafana-gnocchi-datasource


## Configuration Panel

![](https://raw.githubusercontent.com/gnocchixyz/grafana-gnocchi-datasource/master/docs/add_datasource_gnocchi.png)

Name | Description
------------ | -------------
Name | The data source name.
Default | Default data source means that it will be pre-selected for new panels.
Url | The http protocol, ip and port of your Keystone or Gnocchi server (default port is usually 8080)
Access | Proxy = access via Grafana backend, Direct = access directory from browser.
Token | A valid Keystone token
Project | The keystone user
User | The Keystone user
Password | The Keystone password

Note: If the Keystone server is set as URL, the Gnocchi server will be autodiscovered.
This works only if Access = Direct, and CORS is properly configured on Keystone and Gnocchi side.

## Query editor

Open a graph in edit mode by click the title.

The editor have 4 modes to retreives metrics, you can change the mode by clicking of the pencil on the right.

* Measurements of a metric:
  Create one graph with datapoint of the defined metric

  ![](https://raw.githubusercontent.com/gnocchixyz/grafana-gnocchi-datasource/master/docs/gnocchi_query_mode1.png)

  Metric ID: the id of the metric you are interrested in

* Measurements of metrics of resources:
  Create one graph per metric find with the query.

  ![](https://raw.githubusercontent.com/gnocchixyz/grafana-gnocchi-datasource/master/docs/gnocchi_query_mode3.png)

  Query: the query to search resources
  Resource type: the type of the resource (generic, instance, disk, ...)
  Metric name: the name of the metric
  Label attribute: the label or the resource attribute to use as label.

* Aggregated measurements of a metric across resources:
  Create one graph with an aggregation of all datapoints of metrics that match the query.

  ![](https://raw.githubusercontent.com/gnocchixyz/grafana-gnocchi-datasource/master/docs/gnocchi_query_mode4.png)

  Query: the query to search resources
  Resource type: the type of the resource (generic, instance, disk, ...)
  Metric name: the name of the metric
  Label attribute: the label or the resource attribute to use as label.

Each mode also have the aggregator method to use to get datapoints of the metrics.

For details of `Query` format, please refer to the Gnocchi and Gnocchi client documentations.

- [Search for resource - Gnocchi client Documentation](http://gnocchi.xyz/gnocchiclient/shell.html#gnocchi-resource-search) for expression format
- [Search for resource - Gnocchi Documentation](http://gnocchi.xyz/rest.html#searching-for-resources) for the raw json format.

## Labels

Labels can be expressed with resources attributes and metric name. To do so attribute must be surrounded by ${} or prefixed by $.

For example, takes the metric regex "cpu_*", the label
"$display_name-${host}.foo-$type $metric" and a query that returns these
resources::

    [
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
        "host": "compute3",
        "id": "f898ba55-bbea-460f-985c-3d1243348304",
        "image_ref": "http://image",
        "type": "instance",
        "server_group": "autoscalig_group",
        "metrics": {"cpu_util": "58b233f4-65ba-4aeb-97ba-b8bc0feec97e",
                    "cpu_time": "6ff95458-97b4-4b08-af03-7d18b05d277e"}
      }
    ]

The resulting labels are::

  myfirstvm-compute1.foo-instance cpu_util
  mysecondvm-compute3.foo-instance cpu_util
  mysecondvm-compute3.foo-instance cpu_time

## Templated queries

Gnocchi Datasource Plugin provides following functions in `Variables values query` field in Templating Editor.

Name | Description
| ------- | --------|
`metrics(resource_id)`  | Returns a list of metrics available for the resource identified by ‘resource_id’
`resources(resource_type, `attribute`, query)` | Returns a list of resource `attribute` matching `query`.

  ![](https://raw.githubusercontent.com/gnocchixyz/grafana-gnocchi-datasource/master/docs/gnocchi_templating.png)

For details of `Query` format, please refer to the Gnocchi and Gnocchi client documentations.

- [Search for resource - Gnocchi client Documentation](http://gnocchi.xyz/gnocchiclient/shell.html#gnocchi-resource-search) for expression format
- [Search for resource - Gnocchi Documentation](http://gnocchi.xyz/rest.html#searching-for-resources) for the raw json format.

## Current Limitation

Grafana doesn’t allow to query two different servers when using the proxy mode,
so we are not able to query Keystone for a token and then query gnocchi.

In proxymode, we need to set a token and the Gnocchi URL on the datasource.

In direct mode, we can use login/password and the Keystone URL.
Note that CORS MUST be enabled on Keystone and Gnocchi servers.

## License

APACHE LICENSE Version 2.0, January 2004
