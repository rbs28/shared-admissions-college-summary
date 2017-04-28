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

exports.response = Scather.response(
function TableResponder(data, done) {
  
  //This logs the entire event received from the SNS topic to the console
  console.log('Received event:', JSON.stringify(data, null, 2));
  //TODO: Check retrieve / store / delete event

  const eventType = data.request;

  const cbFn = function(err, res) {
    if(err) {
      raiseAlert(err);
      return done(err);
    }
    done(null, res);
  };

  if(eventType === 'retrieve') {
    console.log('Calling retrieve action');
    retrieve(data.parameters, cbFn);
  } else if(eventType === 'store') {
    console.log('Calling store action with payload=\n', data.parameters.payload);
    store(data.parameters, cbFn);
  } else if(eventType === 'remove') {
    console.log('Calling remove action');
    remove(data.parameters, cbFn);
  }

});

exports.handler = Scather.lambda(exports.response);

