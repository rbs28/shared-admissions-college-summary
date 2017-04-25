#!/bin/bash
stack_name="SharedAdmissionsCollegeSummaryAggregatorStack"
aws cloudformation delete-stack --stack-name $stack_name
