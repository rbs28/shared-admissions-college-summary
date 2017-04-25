#!/bin/bash
script_name=$0
script_path=`dirname $script_name`
stack_name=$1
tmp_file=/tmp/$$.json
if [[ -n $stack_name ]]; then
	aws cloudformation describe-stack-resources --stack-name $stack_name > $tmp_file
	cat $tmp_file | node $script_path/transformResources.js
else
	echo "Usage: $script_name stack_name"
fi
