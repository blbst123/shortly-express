const models = require('../models');

const parseCookies = (req, res, next) => {
  if (req.headers.cookie !== undefined) {
    var cookiesObj = req.headers.cookie.split(';');

    for (let i = 0; i < cookiesObj.length; i++) {
      let tempCookie = cookiesObj[i].split('=').map(item => item.trim());
      req.cookies[tempCookie[0]] = tempCookie[1];
    }
    
  }
  next();
};

module.exports = parseCookies;