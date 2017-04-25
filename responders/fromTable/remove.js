const doc     = require('dynamodb-doc');
const dynamo  = new doc.DynamoDB();
const async   = require('async');

const fetchFromTable = function(next) {
  const {applicant_id, college} = this;
  const parameters = {
    'TableName': process.env.TABLE_NAME,
    'Key': {
      'Id': applicant_id,
      'College': college
    }
  };
  console.log("Fetch info from Table", JSON.stringify(parameters, null, 2));
  dynamo.getItem(parameters, next);
};

const updateRecord = function(data, next) {
  const {start_month, end_month} = this;
  console.log("Here is the return from the retrieve function" + JSON.stringify(data, null, 2));
  try {
    const result = data.Item.SummaryList;
    const indexToRemove = result.findIndex(s => s.start_month === start_month && s.end_month === end_month);
    if(indexToRemove < 0) {
      // record not found
      return next({message: 'Record not found'});
    }
    const updatedList = result.slice(0, indexToReplace).concat(result.slice(indexToReplace+1));
    return next(null, updatedList);
  } catch (err) {
    console.log("Error processing data from DyanamoDB", err, err.stack);
    next(err);
  }
};

const writeUpdatedRecord = function(data, next) {
  const {applicant_id, college} = this;
  if(data.length > 0) {
    const params = {
      Item: {
        Id: applicant_id,
        College: college,
        SummaryList: data
      },
      TableName: process.env.TABLE_NAME
    };
    return dynamo.putItem(params, next);
  }

  const parameters = {
    TableName: process.env.TABLE_NAME,
    Key: {
      Id: applicant_id,
      College: college
    }
  };
  return dynamo.deleteItem(params, next);
};

module.exports = function(data, done) {
  const {applicant_id, college, start_month, end_month} = parameters.key;
  const {payload} = parameters.payload;
  const {byuId: userId} = parameters.user;

  async.waterfall([
    fetchFromTable.bind({applicant_id, college}),
    updateRecord.bind({start_month, end_month}),
    writeUpdatedRecord.bind({applicant_id, college})
  ], function(err, data) {
    if(err) {
      const errMessage = 'Error removing College Summary from DB.';
      console.error(errMessage, err);
      return done({'message': errMessage, 'details': err});
    }

    done(null, data);
  });
};

