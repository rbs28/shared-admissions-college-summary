#!/bin/bash
script_path="`dirname \"$BASH_SOURCE\"`"
cd $script_path/..
here=`pwd`
mkdir tmp
cd aggregator
cp package.json $here/tmp
cp server.js $here/tmp
cp aggregator.js $here/tmp
cp -R middleware $here/tmp
$here/scripts/extractResources.sh SharedAdmissionsCollegeSummaryApplicationStack > $here/tmp/config.json
cd $here/tmp
if [ -f /tmp/college-aggregator.zip ]; then
	zip -rf /tmp/college-aggregator.zip package.json server.js aggregator.js config.json middleware
else
	zip -r /tmp/college-aggregator.zip package.json server.js aggregator.js config.json middleware
fi
cd $here
rm -rf $here/tmp
aws s3 cp /tmp/college-aggregator.zip s3://shared-admissions-college-transcript-config
