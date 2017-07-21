const AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2'})
const doc = require('dynamodb-doc')
const dynamo = new doc.DynamoDB()
const request = require('request')
const async = require('async')
const ClientOAuth2 = require('client-oauth2')
const util = require('handel-utils')
const parser = require('./parser')

module.exports = (parms, cb) => {
  const {applicantId, callerNetId} = parms
  async.autoInject({
    getSecureParameters (cb) {
      // Retrieve WSO2 credentials from the AWS Parameter Store
      util.fetchParameters(AWS,
        [`AimApiUrl`, `oauth.key`, `oauth.secret`, `oauth.accessTokenUri`, `oauth.authorizationUri`]
      ).then(data => cb(null, data)).catch(err => cb(err))
    },
    oauth (getSecureParameters, cb) {
      const {oauth} = getSecureParameters
      const client = new ClientOAuth2({
        clientId: oauth.key,
        clientSecret: oauth.secret,
        accessTokenUri: oauth.accessTokenUri,
        authorizationUri: oauth.authorizationUrl,
        authorizationGrants: ['credentials']
      })
      client.credentials.getToken().then(result => cb(null, result)).catch(err => cb(new Error('Error getting Bearer Token!\n' + err)))
    },
    api (getSecureParameters, oauth, cb) {
      const {AimApiUrl} = getSecureParameters
      const {accessToken} = oauth
      const options = {
        url: AimApiUrl + '/' + applicantId,
        auth: { bearer: accessToken },
        headers: { 'Acting-For': callerNetId },
        json: true
      }
      console.log('Request to AIM service:', JSON.stringify(options))
      request.get(options, (err, response, data) => {
        const {statusCode} = response
        if (statusCode !== 200) {
          return cb(new Error(`HTTP Error calling AIM API: statusCode ${statusCode}`))
        }
        cb(err, data)
      })
    },
    parseApi (api, cb) {
      try {
        const results = parser(api)
        cb(null, results)
      } catch (err) {
        cb(new Error('Error parsing results from AIM api!' + err))
      }
    },
    storeData (parseApi, cb) {
      const tableName = util.getVariable('dynamodb', 'SummaryTable', 'TABLE_NAME')
      const params = {
        Item: {
          ApplicantId: applicantId,
          SummaryList: parseApi,
          updatedById: callerNetId,
          dateTimeUpdated: new Date().toJSON()
        },
        TableName: tableName
      }
      dynamo.putItem(params, cb)
    }
  }, (err, results) => {
    if (err) {
      console.error(err)
      cb(err)
    }
    cb(null, results.parseApi)
  })
}
