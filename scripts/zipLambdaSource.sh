#!/bin/bash
script_path="`dirname \"$BASH_SOURCE\"`"
cd $script_path/..
here=`pwd`
cd responders/fromTable
lambda_files=$(ls *.js)
if [ -f /tmp/college-SummaryResponderLambda.zip ]; then
	zip -rf /tmp/college-SummaryResponderLambda.zip $lambda_files package.json node_modules
else
	zip -r /tmp/college-SummaryResponderLambda.zip $lambda_files package.json node_modules
fi
aws s3 cp /tmp/college-SummaryResponderLambda.zip s3://shared-admissions-college-transcript-config/SummaryResponderLambda.zip
