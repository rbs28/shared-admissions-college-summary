#!/bin/bash

stack_name=SharedAdmissionsCollegeSummaryApplicationStack
bucket_name=shared-admissions-college-transcript-config
table_key=TableResponderLambda.zip
cache_key=CacheResponderLambda.zip

echo "Updating TableResponder function"
function_name=$(aws cloudformation describe-stack-resource --stack-name $stack_name --logical-resource-id TableResponder | \
	jq ".StackResourceDetail | .PhysicalResourceId" | sed 's/"//g')
echo $function_name

aws lambda update-function-code --function-name $function_name --s3-bucket $bucket_name --s3-key $table_key

echo "Updating CacheResponder function"
function_name=$(aws cloudformation describe-stack-resource --stack-name $stack_name --logical-resource-id CacheResponder | \
	jq ".StackResourceDetail | .PhysicalResourceId" | sed 's/"//g')
echo $function_name

aws lambda update-function-code --function-name $function_name --s3-bucket $bucket_name --s3-key $cache_key
