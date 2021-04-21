var jwt = require("jwt-simple");
var moment = require("moment");
var constants = require("./constants");

exports.Authorize = function (req, res, next) {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send({ message: "Authorization header is required." });
  }

  var token = req.headers.authorization.split(" ")[1];
  var payload = jwt.decode(token, constants.token_secret);

  if (payload.exp <= moment().unix()) {
    //return res.status(401).send({ message: "The token was expired." });
  }

  req.userId = payload.sub;
  next();
};

exports.createToken = function (user) {
  var payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(5, "days").unix(),
  };
  return jwt.encode(payload, constants.token_secret);
};
