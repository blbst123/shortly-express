const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // console.log(req);
  if (req.cookies === undefined || Object.keys(req.cookies).length === 0) {
    models.Sessions.create()
      .then(function (result) {
        sessionId = result.insertId;
        models.Sessions.get({ id: sessionId })
          .then(function (result) {
            req.session = result;
            res.cookies = { shortlyid: { value: result.hash } };
            res.cookie('shortlyid', result.hash);
            next();
          });
      });
  } else {
    models.Sessions.get({ hash: req.cookies.shortlyid })
      .then(function (result) {
        if (result === undefined) {
          models.Sessions.create().then(function (result) {
            sessionId = result.insertId;
            models.Sessions.get({ id: sessionId })
              .then(function (result) {
                req.session = result;
                res.cookies.shortlyid = { value: result.hash };
                res.cookie('shortlyid', result.hash);
                next();
              });
          });
        } else {
          req.session = result;
          next();
        }
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/