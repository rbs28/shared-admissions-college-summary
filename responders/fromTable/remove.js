const doc = require('dynamodb-doc')
const dynamo = new doc.DynamoDB()
const async = require('async')
const util = require('handel-utils')

const fetchFromTable = (dep, cb) => {
  const {applicantId, tableName} = dep.injectParameters
  const parameters = {
    TableName: tableName,
    Key: {
      ApplicantId: applicantId
    }
  }
  console.log('Fetch info from Table', JSON.stringify(parameters, null, 2))
  dynamo.getItem(parameters, cb)
}

const updateRecord = (dep, cb) => {
  const {college, startMonth, endMonth} = dep.injectParameters
  const {Item} = dep.fetchFromTable
  console.log('Here is the return from the retrieve function' + JSON.stringify(Item, null, 2))
  try {
    if (Item && Item.SummaryList) {
      const result = Item.SummaryList
      const indexToRemove = result.findIndex(s => s.college === college && s.startMonth === startMonth && s.endMonth === endMonth)
      if (indexToRemove < 0) {
        // record not found
        return cb(new Error('Record not found'))
      }
      const updatedList = result.slice(0, indexToRemove).concat(result.slice(indexToRemove + 1))
      console.log('updated list to store:\n', updatedList)
      return cb(null, updatedList)
    } else {
      return cb(new Error('Record not found'))
    }
  } catch (err) {
    console.log('Error processing data from DyanamoDB', err, err.stack)
    cb(err)
  }
}

const writeUpdatedRecord = (dep, cb) => {
  const data = dep.updateRecord
  console.log('writing/deleting data in dynamodb\n', data)
  const {applicantId, tableName} = dep.injectParameters
  if (data.length > 0) {
    const params = {
      Item: {
        ApplicantId: applicantId,
        SummaryList: data
      },
      TableName: process.env.TABLE_NAME
    }
    return dynamo.putItem(params, cb)
  } else {
    const params = {
      TableName: tableName,
      Key: {
        Id: applicantId
      }
    }
    return dynamo.deleteItem(params, cb)
  }
}

module.exports = function (parameters, done) {
  const {applicantId, college, startMonth, endMonth} = parameters.key
  const tableName = util.getVariable('dynamodb', 'SummaryTable', 'TABLE_NAME')

  const injectParameters = cb => cb(null, {applicantId, college, startMonth, endMonth, tableName})

  async.auto({
    injectParameters,
    fetchFromTable: ['injectParameters', fetchFromTable],
    updateRecord: ['injectParameters', 'fetchFromTable', updateRecord],
    writeUpdatedRecord: ['injectParameters', 'updateRecord', writeUpdatedRecord]
  }, (err, data) => {
    if (err) {
      const errMessage = 'Error removing College Summary from DB.'
      console.error(errMessage, err)
      return done({'message': errMessage, 'details': err})
    }

    done(null, data)
  })
}
