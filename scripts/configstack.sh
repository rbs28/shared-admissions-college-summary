#!/bin/bash
here=`pwd`
aws cloudformation create-stack --stack-name "SharedAdmissionsCollegeSummaryConfigStack" --template-body file://$here/config-cf.yaml
