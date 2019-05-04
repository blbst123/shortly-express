const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length === 0) {
    var promiseSession = models.Sessions.create()
    
    promiseSession.then(function (result) {
      console.log(result);
      sessionId = result.OkPacket.insertId;
      console.log('sessionId is', sessionId);
      req.session = {session: result};
      next();
    }).catch(err => {
        // console.log('error');
      next();
    });
}
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/