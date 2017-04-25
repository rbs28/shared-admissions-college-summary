#!/bin/bash
script_path="`dirname \"$BASH_SOURCE\"`"
eb_path="$script_path/../aggregator/.elasticbeanstalk"
config_file_name="$eb_path/config.yml"

if [ -e $config_file_name ]; then
	if grep -q 'artifact' $config_file_name; then
		echo "artifact setting already configured!"
		exit 0
	fi
	echo "deploy:" >> $config_file_name
	echo "  artifact: /tmp/college-aggregator.zip" >> $config_file_name
else
	echo "EB config file not found! (expected at $config_file_name). Try running eb init.\n\n"
fi
