'use strict';

const AWS      = require('aws-sdk');
const Scather  = require('aws-scatter-gather');
const sns      = new AWS.SNS({ apiVersion: '2010-12-01' });
const retrieve = require('./retrieve');
const store    = require('./store');
const remove   = require('./remove');

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

const publishToCacheUpdateTopic = function(parameters, data) {
  const {applicant_id, college, start_month, end_month} = parameters.key;
  const {netId: userId} = parameters.user;

  const key = [applicant_id, college, start_month, end_month].filter(i=>!!i).join(',');

  const accessKey = [key, userId].join('/');

  const params = {
    Message: JSON.stringify({
      request: "toCacher",
      parameters: {
        AccessKey: accessKey,
        RequestDate: new Date().toString(),
        Response: JSON.stringify(data)
      }
    }),
    TargetArn: process.env.CACHER_TOPIC_ARN
  };

  sns.publish(params, function(err, message) {
    if(err) {
      raiseAlert(err);
    } else {
      console.log("Published to SNS topic: " + JSON.stringify(message));
    }
  });
};

exports.response = Scather.response(
function TableResponder(data, done) {
  
  //This logs the entire event received from the SNS topic to the console
  console.log('Received event:', JSON.stringify(data, null, 2));
  //TODO: Check retrieve / store / delete event

  const eventType = data.request;

  const cbFn = (err, res) => {
    if(err) {
      raiseAlert(err);
      return done(err);
    }
    this.publish(res);
    done(null, res);
  };

  if(eventType === 'retrieve') {
    retrieve(data.parameters, cbFn.bind({
      publish: (res) => publishToCacheUpdateTopic(data.parameters, res)
    }));
  } else if(eventType === 'store') {
    store(data.parameters, cbFn.bind({
      publish: (res) => publishToCacheUpdateTopic(data.parameters, data.parameters.payload)
    }));
  } else if(eventType === 'remove') {
    remove(data.parameters, cbFn.bind({
      publish: (res) => publishToCacheUpdateTopic(data.parameters, {})
    }));
  }

});

exports.lambda = Scather.lambda(exports.response);

