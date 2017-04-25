'use strict';

const AWS     = require('aws-sdk');
const Scather = require('aws-scatter-gather');
const sns     = new AWS.SNS({ apiVersion: '2010-12-01' });
const s3      = new AWS.S3({ apiVersion: '2006-03-01' });
const doc     = require('dynamodb-doc');
const dynamo  = new doc.DynamoDB();
const async   = require('async');

var raiseAlert = function(error) {
  const params = {
    Message: JSON.stringify({error: error, stack: new Error().stack}),
    TargetArn: process.env.ALERT_TOPIC_ARN
  };

  sns.publish(params,function(err,data){
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  });
};

const fetchFromCache = function(next) {
  const parameters = {
    'TableName': process.env.TABLE_NAME,
    'Key': {
      'AccessKey': [this.netId, this.callerNetId].join('/'),
    }
  };
  console.log("Fetch info from cache", JSON.stringify(parameters, null, 2));
  dynamo.getItem(parameters, next);
};

const fetchResults = function(data, next) {
  console.log("Here is the return from the retrieve function" + JSON.stringify(data, null, 2));
  try {
    const cachedOn = data.Item.RequestDate;
    const FIFTEEN_MINUTES = 1000 * 60 * 15;
    const cacheDate = new Date(cachedOn);
    const fifteenMinutesAgo = new Date(new Date().getTime() - FIFTEEN_MINUTES);
    //Don't return data from cache if it's older than fifteen minutes
    if(cacheDate < fifteenMinutesAgo) {
      return next(null, {});
    }
    const result = JSON.parse(data.Item.Response);
    next(null, result);
  } catch (err) {
    console.log("Error processing data from DyanamoDB", err, err.stack);
    next(err);
  }
};

exports.response = Scather.response(
function CacheResponder(data, done) {
  
  //This logs the entire event received from the SNS topic to the console
  console.log('Received event:', JSON.stringify(data, null, 2));

  const netId = data.parameters.Key.net_id;
  const callerNetId = data.parameters.User.netId;

  async.waterfall([
    fetchFromCache.bind({netId: netId, callerNetId: callerNetId}),
    fetchResults
  ], function(err, data) {
    if(err) {
      raiseAlert(err);
      done(err);
    }

    done(null, data);
  });
});

exports.lambda = Scather.lambda(exports.response);

const writeToCache = function(next) {
  console.log("writing to cache");
  console.log(this.parameters);
  var params = {
    TableName: process.env.TABLE_NAME,
    Item: this.parameters
  };
  dynamo.putItem(params, next);
};

const writeCacheResults = function(data, next) {
  console.log('cache updated');
};

exports.handler = function(event, context, callback) {
  var info = JSON.parse(event.Records[0].Sns.Message);
  console.log("Event recieved in CacheResponder", JSON.stringify(info));
  if (info.data) {
    exports.lambda(event, context, callback);
  }
  //This will take data from the Worker and update the Cache.
  else if (info.request == 'toCacher') {
    async.waterfall([
      writeToCache.bind({parameters: info.parameters}),
      writeCacheResults
    ], function(err, data) {
      if(err) {
        raiseAlert(err);
        callback(err);
      }

      callback(null, data);
    });

  }
};

