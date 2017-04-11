var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;

var routes = require('./routes/index');
var apiUser = require('./routes/api_user');
var apiHt = require('./routes/api_ht');
var apiBlog = require('./routes/api_blog');
var apiPost = require('./routes/api_post');

var models = require('./models');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'salateksti1234',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/api/ht', apiHt);
app.use('/api/user', apiUser);
app.use('/api/blog', apiBlog);
app.use('/api/post', apiPost);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// Passport

passport.use(new BasicStrategy({
    realm: 'tamplr'},

    function(username, password, done) {

        var query = {where: {username: username}};
        models.User.findOne(query).then(function(foundUser) {
            if(foundUser) {
              if (username === foundUser.username 
                && password === foundUser.password) {
                done(null, username);
              }

              // Salasana ja käyttäjänimi eivät täsmää
              else {
                done(null, false);
              }
            }

            // Käyttäjänimi on väärä
            else{
              done(null, false);
            }
        });
    }
));

// Lomakekirjautuminen
passport.use(new LocalStrategy(  
    {
        // Kenttien nimet HTML-lomakkeessa
        usernameField: 'username',
        passwordField: 'password'
    },
    function(username, password, done) {
        
        var query = {where: {username: username}};
        models.User.findOne(query).then(function(foundUser) {
            if(foundUser) {
              if (username === foundUser.username 
                && password === foundUser.password) {
                done(null, username);
              }

              // Salasana ja käyttäjänimi eivät täsmää
              else {
                done(null, false);
              }
            }

            // Käyttäjänimi on väärä
            else{
              done(null, false);
            }
        });
    }
));

// Serialisointi session-muuttujaksi
passport.serializeUser(function(user, done) {
  done(null, user);
});

// Deserialisointi session-muuttujasta
passport.deserializeUser(function(user, done) {
  done(null, user);
});

module.exports = app;
