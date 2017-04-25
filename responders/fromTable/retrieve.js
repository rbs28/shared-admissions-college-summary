const doc     = require('dynamodb-doc');
const dynamo  = new doc.DynamoDB();
const async   = require('async');

const fetchFromTable = function(next) {
  const {applicant_id, college} = this;
  let Key = {
    'Id': applicant_id
  };

  if(college) {
    Key.College = college;
  }

  const parameters = {
    'TableName': process.env.TABLE_NAME,
    Key
  };
  console.log("Fetch info from Table", JSON.stringify(parameters, null, 2));
  dynamo.getItem(parameters, next);
};

const filterResults = function(data, next) {
  const {college, start_month, end_month} = this;
  console.log("Here is the return from the retrieve function" + JSON.stringify(data, null, 2));
  try {
    const result = data.Item.SummaryList;
    if(start_month && end_month) {
      return next(null, result.filter(s => s.start_month === start_month && s.end_month === end_month));
    }
    next(null, result);
  } catch (err) {
    console.log("Error processing data from DyanamoDB", err, err.stack);
    next(err);
  }
};

module.exports = function(data, done) {
  const {applicant_id, college, start_month, end_month} = parameters.key;
  const {netId: callerNetId} = parameters.user;

  async.waterfall([
    fetchFromTable.bind({applicant_id, college, start_month, end_month, callerNetId}),
    filterResults.bind({college, start_month, end_month})
  ], function(err, data) {
    if(err) {
      const errMessage = 'Error getting College Summary from DB.';
      console.error(errMessage, err);
      return done({'message': errMessage, 'details': err});
    }

    done(null, data);
  });
};
