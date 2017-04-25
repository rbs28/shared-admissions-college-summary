#!/bin/bash
stack_name="SharedAdmissionsCollegeSummaryAggregatorStack"

eb_env=$(aws cloudformation describe-stack-resource \
	--stack-name $stack_name --logical-resource-id "AggregatorEnvironment" | \
	jq '.StackResourceDetail.PhysicalResourceId' | \
	sed 's/"//g')

eb_url=$(aws elasticbeanstalk describe-environments --environment-names $eb_env | \
	jq '.Environments | .[] | .CNAME' | \
	sed 's/"//g')

if [ $# -ge 1 ] && [ $1 == "-?" ]; then
	echo "http://$eb_url"
	exit
fi

aws elasticbeanstalk update-environment --environment-name $eb_env \
	--option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=API_URL,Value="http://$eb_url"

