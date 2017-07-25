/**
 *  @license
 *    Copyright 2016 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict'
const AWS = require('aws-sdk')
const Scather = require('aws-scatter-gather')
const util = require('handel-utils')

AWS.config.update({region: 'us-west-2'})

const SNS = new AWS.SNS()

// function that will create an aggregator that will make a request and listen for a response on the responseARN
exports.get = Scather.aggregator({
  composer: function (responses) {
    if (responses.TableResponder) {
      return responses.TableResponder
    }
    return []
  },
  error: 'it broke!',
  expects: ['TableResponder'],
  maxWait: 5000,
  minWait: 0,
  responseArn: util.getVariable('sns', 'ResponseTopic', 'topic_arn'),
  topicArn: util.getVariable('sns', 'RequestTopic', 'topic_arn'),
  sns: SNS
})

exports.put = Scather.aggregator({
  composer: function (responses) {
    if (responses.TableResponder) {
      return responses.TableResponder
    }
    return []
  },
  error: 'it broke!',
  expects: ['TableResponder'],
  maxWait: 10000,
  minWait: 0,
  responseArn: util.getVariable('sns', 'ResponseTopic', 'topic_arn'),
  topicArn: util.getVariable('sns', 'RequestTopic', 'topic_arn'),
  sns: SNS
})

exports.del = Scather.aggregator({
  composer: function (responses) {
    if (responses.TableResponder) {
      return responses.TableResponder
    }
    return []
  },
  error: 'it broke!',
  expects: ['TableResponder'],
  maxWait: 10000,
  minWait: 0,
  responseArn: util.getVariable('sns', 'ResponseTopic', 'topic_arn'),
  topicArn: util.getVariable('sns', 'RequestTopic', 'topic_arn'),
  sns: SNS
})
