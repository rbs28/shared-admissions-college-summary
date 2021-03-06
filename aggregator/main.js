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
const aggregator = require('./aggregator.js')
const AWS = require('aws-sdk')
const express = require('express')
const Scather = require('aws-scatter-gather')
const bodyParser = require('body-parser')
const debug = require('debug')('aggregator')
const authentication = require('./middleware/authentication.js')
const authorization = require('./authorization.js')
const {validator, validateKey, validateFullKey} = require('./validator.js')
const util = require('handel-utils')

// create an express app and add the scather sns middleware
const app = express()

const authOptions = {
  bypassAuth: !!process.env.SKIP_AUTH // set to true to allow requests without JWT for testing
}

// Enable JWT checking for WSO2 authentication
app.use(authentication.init(authOptions))

const middlewareOptions = {
  endpoint: process.env.API_URL,
  sns: new AWS.SNS({ region: 'us-west-2' }),
  topics: [util.getVariable('sns', 'ResponseTopic', 'TOPIC_ARN')]
}

debug('Scather config:' + JSON.stringify(middlewareOptions, null, 2))

// Uses the scather middleware to make requests and process results. Can find more info on npmjs.com looking for aws-scatter-gather
app.use(Scather.middleware(Object.assign({}, middlewareOptions, {server: app})))

// These will allow you to retrieve body parameters. Currently not in use.
app.use(bodyParser.json()) // support json encoded bodies

// function that will run when user makes a basic get request
const get = function (req, res) {
  if (req.params.key) {
    const parts = req.params.key.split(',')
    const [applicantId, college, startMonth, endMonth] = parts

    const {errors, valid} = validateKey({
      applicant_id: applicantId,
      college,
      start_month: startMonth,
      end_month: endMonth
    })
    if (!valid) {
      const errMessage = {
        message: 'Invalid request parameter(s)!',
        details: errors.map(e => ({recieved: e.instance, error: e.stack}))
      }
      debug('Error in validation: ' + errMessage)
      return res.status(400).json(errMessage)
    }

    const user = req.byu.user

    // creates a message to aggregate with that listening lambdas will understand
    const message = {
      request: 'retrieve',
      parameters: {
        key: {
          applicantId,
          college,
          startMonth,
          endMonth
        },
        user
      }
    }

    // runs the aggregators function with message given and will return the response to the caller
    aggregator.get(message, function (err, data) {
      if (err) {
        debug(err + err.stack)
        res.statusCode = err.statusCode || 500
        res.end(JSON.stringify({statusCode: res.statusCode, message: 'Error in service!', details: err}))
        return
      }
      debug(data)
      res.json(data)
    })
  } else {
    res.end('Sorry, incorrect URL')
  }
}

const pruneUndefined = (o) => {
  return Object.keys(o).reduce((n, k) => {
    if (typeof o[k] !== 'undefined') {
      n[k] = o[k]
    }
    return n
  }, {})
}

const put = function (req, res) {
  const key = req.params.key
  if (!key) {
    return res.end('Sorry, incorrect URL')
  }
  const user = req.byu.user

  const [applicantId, college, startMonth, endMonth] = key.split(',')
  const body = req.body
  const payload = Object.assign({}, body, pruneUndefined({
    applicant_id: applicantId,
    college,
    start_month: startMonth,
    end_month: endMonth
  }))
  const {errors, valid} = validator(payload)
  if (!valid) {
    const errMessage = {
      message: 'Invalid request parameter(s)!',
      details: errors.map(e => ({recieved: e.instance, error: e.stack}))
    }
    debug('Error in validation: ' + errMessage)
    return res.status(400).json(errMessage)
  }

  // creates a message to aggregate with that listening lambdas will understand
  const message = {
    request: 'store',
    parameters: {
      key: {
        applicantId,
        college,
        startMonth,
        endMonth
      },
      payload,
      user
    }
  }

  // runs the aggregators function with the given message and return response to caller
  aggregator.put(message, function (err, data) {
    if (err) {
      debug(err + err.stack)
      const statusCode = err.statusCode || 500
      return res.status(statusCode).json({statusCode, message: 'Error in service!', details: err})
    }
    debug(data)
    res.json(data)
  })
}

// function that will run when user makes a delete request
const del = function (req, res) {
  if (req.params.key) {
    const parts = req.params.key.split(',')
    const [applicantId, college, startMonth, endMonth] = parts

    const {errors, valid} = validateFullKey({
      applicant_id: applicantId,
      college,
      start_month: startMonth,
      end_month: endMonth
    })
    if (!valid) {
      const errMessage = {
        message: 'Invalid request parameter(s)!',
        details: errors.map(e => ({recieved: e.instance, error: e.stack}))
      }
      debug('Error in validation: ' + errMessage)
      return res.status(400).json(errMessage)
    }

    const user = req.byu.user

    // creates a message to aggregate with that listening lambdas will understand
    const message = {
      request: 'remove',
      parameters: {
        key: {
          applicantId,
          college,
          startMonth,
          endMonth
        },
        user
      }
    }

    // runs the aggregators function with the given message and return response to caller
    aggregator.del(message, function (err, data) {
      if (err) {
        debug(err + err.stack)
        const statusCode = err.statusCode || 500
        return res.status(statusCode).end(JSON.stringify({statusCode, message: 'Error in service!', details: err}))
      }
      debug(data)
      res.json(data)
    })
  } else {
    res.end('Sorry, incorrect URL')
  }
}

// will respond back with the options usable for the basic level requests
var options = function (req, res) {
  res.end('Methods: GET, PUT, DELETE, OPTIONS')
}

app.get('/', (req, res) => {
  res.json({health: '100%'})
})

// when user makes a get request to / will run aggregate function
app.get('/:key', authorization, get)
app.put('/:key', authorization, put)
app.delete('/:key', authorization, del)
app.options('/:key', options)

// start the server listening on port 3000 or the current environment's port
app.listen(process.env.PORT || 3000, function () {
  debug('The beginning')
})
