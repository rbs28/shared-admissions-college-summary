const doc     = require('dynamodb-doc');
const dynamo  = new doc.DynamoDB();
const async   = require('async');

const fetchFromTable = function(next) {
  const {applicant_id} = this;
  let Key = {
    'Id': applicant_id
  };

  const parameters = {
    'TableName': process.env.TABLE_NAME,
    Key
  };
  console.log("Fetch info from Table", JSON.stringify(parameters, null, 2));
  dynamo.getItem(parameters, next);
};

const filterResults = function(data, next) {
  const {college, start_month, end_month} = this;
  let result = [];
  console.log("Here is the return from the retrieve function" + JSON.stringify(data, null, 2));
  try {
    if(!data.Item || !data.Item.SummaryList) {
      // No record found
      return next(null, []);
    }
    result = data.Item.SummaryList;
    if(college) {
      result = result.filter(s => s.college === college);
    }
    if(start_month && end_month) {
      result = result.filter(s => s.start_month === start_month && s.end_month === end_month);
    }
  } catch (err) {
    console.log("Error processing data from DyanamoDB", err, err.stack);
    next(err);
  }
  next(null, result);
};

module.exports = function(parameters, done) {
  console.log('in retrieve action - ', parameters);
  const {applicant_id, college, start_month, end_month} = parameters.key;
  const {netId: callerNetId} = parameters.user;

  async.waterfall([
    fetchFromTable.bind({applicant_id}),
    filterResults.bind({college, start_month, end_month})
  ], function(err, data) {
    if(err) {
      const errMessage = 'Error getting College Summary from DB.';
      console.error(errMessage, err);
      return done({'message': errMessage, 'details': err});
    }

    console.log('Return from retrieve:\n', data);
    done(null, data);
  });
};

