'use strict';

const routes        = require('./routes.js');
const auth          = require('./auth.js');

const express       = require('express');
const bodyParser    = require('body-parser');
const fccTesting    = require('./freeCodeCamp/fcctesting.js');
const session       = require('express-session');
const passport      = require('passport');
const mongo         = require('mongodb').MongoClient;

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

mongo.connect(process.env.DATABASE, {
  useNewUrlParser: true,
}, (err, client) => {
  if (err) {
    console.log("Database error: ", err);
  } else {
    console.log("Successful database connection")
    const db = client.db('advancednode');
    
    auth(app, db);
    routes(app, db);

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});
