module.exports = function(app, db) {
  
  const passport        = require('passport');
  const LocalStrategy   = require('passport-local');
  const GitHubStrategy  = require('passport-github').Strategy;
  const ObjectID        = require('mongodb').ObjectID;
  const bcrypt          = require('bcrypt');
    
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    db.collection('socialusers').findOne({
      _id: new ObjectID(id)
    }, (err, foundUser) => {
      done(null, foundUser);
    });
  });

  passport.use(new LocalStrategy(
    (username, password, done) => {
      db.collection('socialusers').findOne({username: username}, (err, user) => {
        console.log(`User ${username} attempted to login`);
        if (err)  { return done(err); }
        if (!user) { return done(null, false); }
        if (!bcrypt.compareSync(password, user.password)) {return done(null, false); }
        return done(null, user);
      })
    }
  ));
  
  passport.use(new GitHubStrategy ({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://archaengel-advancednode-challenges.glitch.me/auth/github/callback',
  }, function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    db.collection('socialusers').findOneAndUpdate(
      {id: profile.id},
      { $setOnInsert: {
        id: profile.id,
        name: profile.displayName || 'John Doe',
        photo: profile.photos[0].value || '',
        email: profile.emails[0].value || 'No public email',
        created_on: new Date(),
        provider: profile.provider || '',
      }, $set: {
        last_login: new Date(),
      }, $inc: {
        login_count: 1,
      }},
      { upsert: true },
      (err, authedUser) => {
         return cb(null, authedUser.value);
      }
    );
  }));
}