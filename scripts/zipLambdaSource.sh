#!/bin/bash
script_path="`dirname \"$BASH_SOURCE\"`"
cd $script_path/..
here=`pwd`
cd responders/fromTable
if [ -f /tmp/college-TableResponderLambda.zip ]; then
	zip -rf /tmp/college-TableResponderLambda.zip package.json index.js node_modules
else
	zip -r /tmp/college-TableResponderLambda.zip package.json index.js node_modules
fi
aws s3 cp /tmp/college-TableResponderLambda.zip s3://shared-admissions-college-transcript-config/TableResponderLambda.zip
cd $here
cd responders/fromCache
if [ -f /tmp/college-CacheResponderLambda.zip ]; then
	zip -rf /tmp/college-CacheResponderLambda.zip package.json index.js node_modules
else
	zip -r /tmp/college-CacheResponderLambda.zip package.json index.js node_modules
fi
aws s3 cp /tmp/college-CacheResponderLambda.zip s3://shared-admissions-college-transcript-config/CacheResponderLambda.zip
