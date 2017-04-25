#!/bin/bash
stack_name="SharedAdmissionsCollegeSummaryApplicationStack"
aws cloudformation delete-stack --stack-name $stack_name
