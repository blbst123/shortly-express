const parseCookies = (req, res, next) => {
  if (req.headers.cookie !== undefined) {
    console.log(req.headers.cookie.substring(10));
  }
  // req.cookies = {shortlyid: req.headers.cookie.substring(10)};
  next();
};

module.exports = parseCookies;