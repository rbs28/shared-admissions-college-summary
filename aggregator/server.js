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

'use strict';
const aggregator = require('./aggregator.js');
const AWS = require('aws-sdk');
const express = require('express');
const Scather = require('aws-scatter-gather');
const bodyParser = require('body-parser');
const config = require('./config.json');
const authentication = require('./middleware/authentication.js');
const {validator, validateKey} = require('./validator.js');

// create an express app and add the scather sns middleware
const app = express();

const authOptions = {
  bypassAuth: !!process.env.SKIP_AUTH //set to true to allow requests without JWT for testing
};

// Enable JWT checking for WSO2 authentication
app.use(authentication.init(authOptions));

const middlewareOptions = {
    endpoint: process.env.API_URL,
    sns: new AWS.SNS({ region: 'us-west-2' }),
    topics: [ config.ResponseTopic.arn ]
};

console.log('Scather config:', JSON.stringify(middlewareOptions, null, 2));

//Uses the scather middleware to make requests and process results. Can find more info on npmjs.com looking for aws-scatter-gather
app.use(Scather.middleware(Object.assign({}, middlewareOptions, {server: app})));

//These will allow you to retrieve body parameters. Currently not in use.
app.use(bodyParser.json()); //support json encoded bodies

//function that will run when user makes a basic get request
const get = function(req, res) {
    if (req.params.key) {
        const parts = req.params.key.split(',');
        const [applicant_id, college, start_month, end_month] = parts;

        const v = validateKey({applicant_id, college, start_month, end_month});

        //creates a message to aggregate with that listening lambdas will understand
        const message = {
            request: 'retrieve',
            parameters: {
                key: {
                    applicant_id,
                    college,
                    start_month,
                    end_month
                },
                user
            }
        };

        //runs the aggregators function with message given and will display response to the browser window
        aggregator.get(message, function(err, data) {
            if(err) {
                console.error(err, err.stack);
                res.statusCode = err.statusCode || 500;
                res.end(JSON.stringify({statusCode: res.statusCode, message: 'Error in service!', details: err}));
                return;
            }
                console.log(data);
                res.json(data);
            });
    } else {
        res.end('Sorry, incorrect URL');
    }

};

const put = function(req, res) {
    const key = req.params.key;
    if (!key) {
        res.end('Sorry, incorrect URL');
    }
    const user = req.byu.user;

    const [applicant_id, college, start_month, end_month] = key.split(',');
    const body = req.body;
    const payload = Object.assign({}, body, {applicant_id, college, start_month, end_month});
    {errors, valid} = validator(payload);
    if(!valid) {
        errMessage = {
            message: 'Invalid request parameter(s)!',
            details: errors.map(e => ({recieved: e.instance, error: e.stack}))
        };
        console.error('Error in validation: ', errMessage);
        return res.status(400).json(errMessage);
    }

    //creates a message to aggregate with that listening lambdas will understand
    const message = {
        request: 'store',
        parameters: {
            key: {
                applicant_id,
                college,
                start_month,
                end_month
            },
            payload,
            user
        }
    };

    //runs the aggregators function with message given and will display response to the browser window
    aggregator.put(message, function(err, data) {
        if(err) {
            console.error(err, err.stack);
            res.statusCode = err.statusCode || 500;
            res.json({statusCode: res.statusCode, message: 'Error in service!', details: err});
            return;
        }
        console.log(data);
        res.json(data);
    });
};

//function that will run when user makes a basic get request
const del = function(req, res) {
    if (req.params.key) {
        const parts = req.params.key.split(',');
        const [applicant_id, college, start_month, end_month] = parts;

        const v = validateKey({applicant_id, college, start_month, end_month});

        const user = req.byu.user;

        //creates a message to aggregate with that listening lambdas will understand
        const message = {
            request: 'remove',
            parameters: {
                key: {
                    applicant_id,
                    college,
                    start_month,
                    end_month
                },
                user
            },
        };

        //runs the aggregators function with message given and will display response to the browser window
        aggregator.del(message, function(err, data) {
            if(err) {
                console.error(err, err.stack);
                res.statusCode = err.statusCode || 500;
                res.end(JSON.stringify({statusCode: res.statusCode, message: 'Error in service!', details: err}));
                return;
            }
                console.log(data);
                res.json(data);
            });
    } else {
        res.end('Sorry, incorrect URL');
    }

};

//will respond back with the options usable for the basic level requests
var options = function(req,res) {
    res.end('Methods: GET, PUT, DELETE, OPTIONS');
};

//when user makes a get request to / will run aggregate function
app.get('/:key', get);
app.put('/:key', put);
app.delete('/:key', del);
app.options('/:key', options);

// start the server listening on port 3000 or the current environment's port
app.listen(process.env.PORT || 3000, function() {
    console.log('The beginning');
});

