const doc     = require('dynamodb-doc');
const dynamo  = new doc.DynamoDB();
const async   = require('async');

const fetchFromTable = function(next) {
  const {applicant_id} = this;
  const parameters = {
    'TableName': process.env.TABLE_NAME,
    'Key': {
      'Id': applicant_id
    }
  };
  console.log("Fetch info from Table", JSON.stringify(parameters, null, 2));
  dynamo.getItem(parameters, next);
};

const updateRecord = function(data, next) {
  const {college, start_month, end_month, payload, userId} = this;
  const newRecord = Object.assign({}, payload, {
    updated_by_id: userId,
    date_time_updated: new Date().toJSON()
  });
  console.log('new record value:\n', newRecord);
  console.log('Here is the return from the retrieve function' + JSON.stringify(data, null, 2));
  try {
    const result = (data.Item && data.Item.SummaryList) ? data.Item.SummaryList : [];
    const indexToReplace = result.findIndex(s => s.college === college && s.start_month === start_month && s.end_month === end_month);
    if(indexToReplace < 0) {
      // append to end of list
      return next(null, result.concat([newRecord]));
    }
    const updatedList = result.slice(0, indexToReplace).concat([newRecord]).concat(result.slice(indexToReplace+1));
    console.log('Updating summary list:\n', updatedList);
    return next(null, updatedList);
  } catch (err) {
    console.log('Error processing data from DyanamoDB', err, err.stack);
    next(err);
  }
};

const writeUpdatedRecord = function(data, next) {
  console.log('writing data to dynamodb\n', data);
  const {applicant_id} = this;
  const params = {
    Item: {
      Id: applicant_id,
      SummaryList: data
    },
    TableName: process.env.TABLE_NAME
  };
  dynamo.putItem(params, next);
};

module.exports = function(parameters, done) {
  const {applicant_id, college, start_month, end_month} = parameters.key;
  const payload = parameters.payload;
  const {byuId: userId} = parameters.user;

  console.log('parameters:\n', parameters);

  async.waterfall([
    fetchFromTable.bind({applicant_id}),
    updateRecord.bind({college, start_month, end_month, payload, userId}),
    writeUpdatedRecord.bind({applicant_id})
  ], function(err, data) {
    if(err) {
      const errMessage = 'Error getting College Summary from DB.';
      console.error(errMessage, err);
      return done({'message': errMessage, 'details': err});
    }

    done(null, data);
  });
};

