'use strict';

const express        = require('express');
const bodyParser     = require('body-parser');
const fccTesting     = require('./freeCodeCamp/fcctesting.js');
const session        = require('express-session');
const passport       = require('passport');
const LocalStrategy  = require('passport-local');
const ObjectID       = require('mongodb').ObjectID;
const mongo          = require('mongodb').MongoClient;

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug');




app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index.pug', {
      title: 'Home page',
      message: 'Please login',
      showLogin: true,
    });
  });

mongo.connect(process.env.DATABASE, {
  useNewUrlParser: true,
}, (err, client) => {
  if (err) {
    console.log("Database error: ", err);
  } else {
    console.log("Successful database connection")
    const db = client.db('advancednode');
    
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    
    passport.deserializeUser((id, done) => {
      db.collection('users').findById({
        _id: new ObjectID(id)
      }, (err, foundUser) => {
        done(null, foundUser);
      });
    });
    
    passport.use(new LocalStrategy(
      (username, password, done) => {
        db.collection('users').findOne({username: username}, (err, user) => {
          console.log(`User ${username} attempted to login`);
          if (err)  { return done(err); }
          if (!user) { return done(null, false); }
          if (password !== user.password) {return done(null, false); }
          return done(null, user);
        })
      }
    ));


    app.post('/login', passport.authenticate('local', {
      failureRedirect: '/'
    }),(req, res) => {
      res.redirect('/profile')
    });

        
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/');
    };
    
    app.get('/profile', ensureAuthenticated, (req, res) => {
      res.render(process.cwd() + '/views/pug/profile.pug', {
        username: req.user.username,
      });
    });
    

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
    

  }
});
