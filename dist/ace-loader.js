

if ("ace" in window){
    ace.config.setModuleUrl(
        "ace/mode/gnocchiquery",
        "public/plugins/gnocchixyz-gnocchi-datasource/mode-gnocchiquery.js"
    );

    ace.config.setModuleUrl(
        "ace/snippets/gnocchiquery",
        "public/plugins/gnocchixyz-gnocchi-datasource/snippets/gnocchiquery.js"
    );

    ace.config.setModuleUrl(
        "ace/mode/gnocchioperations",
        "public/plugins/gnocchixyz-gnocchi-datasource/mode-gnocchioperations.js"
    );

    ace.config.setModuleUrl(
        "ace/snippets/gnocchioperations",
        "public/plugins/gnocchixyz-gnocchi-datasource/snippets/gnocchioperations.js"
    );

}
