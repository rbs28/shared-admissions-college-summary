const doc = require('dynamodb-doc')
const dynamo = new doc.DynamoDB()
const async = require('async')
const util = require('handel-utils')
const fetchFromAim = require('./fetchFromAim')

module.exports = function (parameters, done) {
  console.log('in retrieve action - ', parameters)
  const {applicantId, college, startMonth, endMonth} = parameters.key
  const {netId: callerNetId} = parameters.user
  const tableName = util.getVariable('dynamodb', 'SummaryTable', 'TABLE_NAME')

  async.autoInject({
    fetchFromTable (cb) {
      const parameters = {
        TableName: tableName,
        Key: {
          ApplicantId: applicantId
        }
      }
      console.log('Fetch info from Table', JSON.stringify(parameters, null, 2))
      dynamo.getItem(parameters, cb)
    },
    filterResults (fetchFromTable, cb) {
      const filter = result => {
        console.log('Here is the return from the retrieve function' + JSON.stringify(result, null, 2))
        try {
          if (college) {
            result = result.filter(s => s.college === college)
          }
          if (startMonth && endMonth) {
            result = result.filter(s => s.start_month === startMonth && s.end_month === endMonth)
          }
          cb(null, result)
        } catch (err) {
          console.log('Error processing data from DyanamoDB', err, err.stack)
          cb(err)
        }
      }
      const {Item} = fetchFromTable
      if (!Item) {
        // no self-entered college data, check AIM
        fetchFromAim({applicantId, college, startMonth, endMonth, callerNetId, tableName}, (err, list) => {
          if (err) {
            return cb(new Error('Error fetching AIM API!\n' + err))
          }
          filter(list)
        })
      } else {
        filter(Item.SummaryList)
      }
    }
  }, (err, results) => {
    if (err) {
      const errMessage = 'Error getting College Summary from DB.'
      console.error(errMessage, err)
      return done({'message': errMessage, 'details': err})
    }

    console.log('Return from retrieve:\n', results)
    done(null, results)
  })
}
