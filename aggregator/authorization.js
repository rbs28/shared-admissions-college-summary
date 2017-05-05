var debug = require('debug')('authorization');

module.exports = function (req, res, next) {
  try{
    debug(`key=${req.params.key}:userid=${req.byu.user.byuId}`);
  } catch(err) {
    debug(err + '\n' + err.stack);
    debug('Bad parameters!!\n' + JSON.stringify(req.params,null,2));
    return res.status(400).end();
  }
  // Only allow self-service for now
  if(req.params && req.params.key && req.params.key.split) {
    const parts = req.params.key.split(',');
    const [applicant_id] = parts;

    if(!req.byu || !req.byu.user) {
      debug('Authentication info not found!');
      return res.status(403).end();
    }
    const userId = req.byu.user.byuId;

    if(userId !== applicant_id) {
      debug('User and applicant ids mismatch, rejecting...');
      return res.status(403).end();
    }
  }

  return next();
};
