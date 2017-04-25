# shared-admissions-college-summary

Retrieves and caches requests for College Summary information from AWS.

To set up the AWS infrastrucure for this application, follow these steps from the project root
folder (verify with cloudformation that each step has finished before continuing):

1. Create a file in your home directory named '.college-summary-config.json' with this format:
```javascript
{
  "summaryTableName": "name of DynamoDB table to use (for example CollegeSummary)",
  "cacheTableName": "name of DynamoDB table to use (for example CollegeSummaryCache)",
  "sslCertificatePath": "path of uploaded SSL certificate (for example /cloudfront/dev/)",
  "sslCertificateName": "name of uploaded SSL certificate (for example wc.stage.sim.appdev)"
}
```

2. Run `scripts/configstack.sh`. This will create an s3 bucket to store source bundles.

3. Run `npm install` in all the node project directories.

4. Run `scripts/zipLambdaSource.sh`. This will upload source bundles for the Lambda Functions to s3.

5. Run `node scripts/applicationstack.js`

6. Run `scripts/zipAggregator.sh`. This will upload the source bundle for the Elastic Beanstalk app
to s3.

7. Run `node scripts/aggregatorstack.js`.

8. Run `node scripts/routhing.js`. 


Once the application is set up, updating it is easier. To update any part of the application stack,
make the needed changes to application-cf.yaml, then run `node scripts/applicationstack.js
update-stack`. Similarly, to update any part of the aggregator stack, update
aggregator-cf.yaml, then run `node scripts/aggregatorstack.js update-stack`.

