#!/bin/bash
#
# Grafana plugin plublisher here: https://grafana.com/plugins/gnocchixyz-gnocchi-datasource
# are built from github, asking are done with PR here: https://github.com/grafana/grafana-plugin-repository
# they release tools clones our git at the asked tag and create a tarball of the dist/ directory.
# So on each release the dist/ up2date


set -e

cd $(readlink -f $(dirname $0))

inc_version() { echo $1 | gawk -F"." '{$NF+=1}{print $0RT}' OFS="." ORS="" ;}
get_version() { sed -n 's/.*"version": "\([^"]*\)".*/\1/gp' $1 ; }
error() { echo $1 ; exit 1 ; }
bump_version() {
    nextversion=$1
    today=$today

    sed -i 's/"version": "[^"]*"/"version": "'$nextversion'"/' plugin.json package.json
    sed -i 's/"updated": "[^"]*"/"updated": "'$today'"/' plugin.json
    ./run-tests.sh
    status=$(git status -sz)
    if [ -n "$status" ]; then
        git commit -m "Bump version $nextversion" plugin.json package.json dist/
        git push
    fi
}

[ ! "$GITHUB_TOKEN" ] && error "GITHUB_TOKEN is missing"

today=$(date "+%Y-%m-%d")

git fetch origin --tags

if [ "$1" ] ; then
    version="$1"
    if [ "$(get_version plugin.json)" != "$version" ]; then
        bump_version "$version" "$today"
    fi
else
    version=$(git tag | tail -1)
    version=$(inc_version $version)
fi

# Sanity checks
plugin_version=$(get_version plugin.json)
package_version=$(get_version package.json)
[ "$plugin_version" != "$version" ] && error "plugin.json incorrect version ($plugin_version != $version)"
[ "$package_version" != "$version" ] && error "package.json incorrect version ($package_version != $version"

echo "Building version $version"

./run-tests.sh

status=$(git status -sz)
[ -z "$status" ] || error "Repo is not clean after dist/ generation"

echo
echo "release: ${version} ? "
echo

read

cp -a dist gnocchixyz-gnocchi-datasource
tar -czf gnocchixyz-gnocchi-datasource-${version}.tar.gz gnocchixyz-gnocchi-datasource

git tag $version -m "Release version $version"
git push --tags

github-release release -u gnocchixyz -r grafana-gnocchi-datasource --tag $version --description "Release $version for Grafana 3 and 4"
github-release upload  -u gnocchixyz -r grafana-gnocchi-datasource --tag $version --name gnocchixyz-gnocchi-datasource-${version}.tar.gz --file gnocchixyz-gnocchi-datasource-${version}.tar.gz
github-release info    -u gnocchixyz -r grafana-gnocchi-datasource --tag $version

rm -rf gnocchixyz-gnocchi-datasource*

nextversion=$(inc_version $version)
bump_version "$nextversion" "$today"

