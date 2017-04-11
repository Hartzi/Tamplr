var passport = require('passport');
var basicAuth = passport.authenticate('basic', {session: false});

module.exports = function (req, res, next) {

  // Onko käyttäjä kirjautunut istuntoon (LocalStrategy)?
  if (req.user) {
    // Jos on, voidaan jatkaa.
    next();
  }
  else {
    // Ellei, yritetään vielä Basic-autentikointia.
    basicAuth(req, res, next);
  }
};