#!/bin/bash
script_path="`dirname \"$BASH_SOURCE\"`"
file_list="package.json main.js aggregator.js validator.js middleware"
cd $script_path/..
here=`pwd`
mkdir tmp
cd aggregator
for FILENAME in $file_list; do
	if [ -d $FILENAME ]; then
		cp -R $FILENAME $here/tmp
	else
		cp $FILENAME $here/tmp
	fi
done

$here/scripts/extractResources.sh SharedAdmissionsCollegeSummaryApplicationStack > $here/tmp/config.json

cd $here/tmp
if [ -f /tmp/college-aggregator.zip ]; then
	zip -rf /tmp/college-aggregator.zip $file_list config.json
else
	zip -r /tmp/college-aggregator.zip $file_list config.json
fi
cd $here
rm -rf $here/tmp
aws s3 cp /tmp/college-aggregator.zip s3://shared-admissions-college-transcript-config
