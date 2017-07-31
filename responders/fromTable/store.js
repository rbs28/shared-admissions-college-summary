const doc = require('dynamodb-doc')
const dynamo = new doc.DynamoDB()
const async = require('async')
const util = require('handel-utils')
const _ = require('lodash')

const fetchFromTable = (dep, cb) => {
  const {applicantId, tableName} = dep.injectParameters
  const parameters = {
    'TableName': tableName,
    'Key': {
      'ApplicantId': applicantId
    }
  }
  console.log('Fetch info from Table', JSON.stringify(parameters, null, 2))
  dynamo.getItem(parameters, cb)
}

const updateRecord = (dep, cb) => {
  const {college, startMonth, endMonth, payload: newRecord} = dep.injectParameters
  const data = dep.fetchFromTable
  console.log('new record value:\n', newRecord)
  console.log('Here is the return from the retrieve function' + JSON.stringify(data, null, 2))
  try {
    const result = (data.Item && data.Item.SummaryList) ? data.Item.SummaryList : []
    const indexToReplace = result.findIndex(s => s.college === college && s.start_month === startMonth && s.end_month === endMonth)
    if (indexToReplace < 0) {
      // append to end of list
      return cb(null, result.concat([newRecord]))
    }
    const updatedList = result.slice(0, indexToReplace).concat([newRecord]).concat(result.slice(indexToReplace + 1))
    console.log('Updating summary list:\n', updatedList)
    return cb(null, updatedList)
  } catch (err) {
    console.log('Error processing data from DyanamoDB', err, err.stack)
    cb(err)
  }
}

const writeUpdatedRecord = (dep, cb) => {
  const data = dep.updateRecord
  const {userId} = dep.injectParameters
  console.log('writing data to dynamodb\n', data)
  const {applicantId, tableName} = dep.injectParameters
  const params = {
    Item: {
      ApplicantId: applicantId,
      SummaryList: data,
      UpdatedById: userId,
      DateTimeUpdated: new Date().toJSON()
    },
    TableName: tableName
  }
  dynamo.putItem(params, cb)
}

module.exports = function (parameters, done) {
  const {applicant_id: applicantId, college, start_month: startMonth, end_month: endMonth} = parameters.payload
  const payload = parameters.payload
  const {byuId: userId} = parameters.user
  const tableName = util.getVariable('dynamodb', 'SummaryTable', 'TABLE_NAME')

  console.log('parameters:\n', parameters)

  const injectParameters = cb => cb(null, {applicantId, college, startMonth, endMonth, userId, payload, tableName})

  async.auto({
    injectParameters,
    fetchFromTable: ['injectParameters', fetchFromTable],
    updateRecord: ['injectParameters', 'fetchFromTable', updateRecord],
    writeUpdatedRecord: ['injectParameters', 'updateRecord', writeUpdatedRecord]
  }, (err, data) => {
    if (err) {
      const errMessage = 'Error getting College Summary from DB.'
      console.error(errMessage, err)
      return done({'message': errMessage, 'details': err})
    }

    done(null, data.updateRecord)
  })
}
