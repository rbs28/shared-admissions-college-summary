#!/bin/bash
stack_name="SharedAdmissionsCollegeSummaryRoutingStack"
aws cloudformation delete-stack --stack-name $stack_name
