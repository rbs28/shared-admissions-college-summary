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
  const {college, start_month, end_month} = this;
  console.log("Here is the return from the retrieve function" + JSON.stringify(data, null, 2));
  try {
    if(data.Item && data.Item.SummaryList) {
      const result = data.Item.SummaryList;
      const indexToRemove = result.findIndex(s => s.college === college && s.start_month === start_month && s.end_month === end_month);
      if(indexToRemove < 0) {
        // record not found
        return next({message: 'Record not found'});
      }
      const updatedList = result.slice(0, indexToRemove).concat(result.slice(indexToRemove+1));
      console.log('updated list to store:\n', updatedList);
      return next(null, updatedList);
    } else {
      return next({message: 'Record not found'});
    }
  } catch (err) {
    console.log("Error processing data from DyanamoDB", err, err.stack);
    next(err);
  }
};

const writeUpdatedRecord = function(data, next) {
  console.log('writing/deleting data in dynamodb\n', data);
  const {applicant_id} = this;
  if(data.length > 0) {
    const params = {
      Item: {
        Id: applicant_id,
        SummaryList: data
      },
      TableName: process.env.TABLE_NAME
    };
    return dynamo.putItem(params, next);
  }

  const parameters = {
    TableName: process.env.TABLE_NAME,
    Key: {
      Id: applicant_id
    }
  };
  return dynamo.deleteItem(parameters, next);
};

module.exports = function(parameters, done) {
  const {applicant_id, college, start_month, end_month} = parameters.key;
  const {byuId: userId} = parameters.user;

  async.waterfall([
    fetchFromTable.bind({applicant_id}),
    updateRecord.bind({college, start_month, end_month}),
    writeUpdatedRecord.bind({applicant_id})
  ], function(err, data) {
    if(err) {
      const errMessage = 'Error removing College Summary from DB.';
      console.error(errMessage, err);
      return done({'message': errMessage, 'details': err});
    }

    done(null, data);
  });
};

