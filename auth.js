module.exports = function(app, db) {
  
  const passport        = require('passport');
  const LocalStrategy   = require('passport-local');
  const ObjectID        = require('mongodb').ObjectID;
  const bcrypt          = require('bcrypt');
    
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    db.collection('users').findOne({
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
        if (!bcrypt.compareSync(password, user.password)) {return done(null, false); }
        return done(null, user);
      })
    }
  ));
}