module.exports = function (app, db) {
  
  const bcrypt    = require('bcrypt');
  const passport  = require('passport');
  
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };
  
  app.route('/')
    .get((req, res) => {
      res.render(process.cwd() + '/views/pug/index.pug', {
        title: 'Home page',
        message: 'Please login',
        showLogin: true,
        showRegistration: true,
      });
  });

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/'
  }),(req, res) => {
    res.redirect('/profile')
  });

  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/profile.pug', {
      username: req.user.username,
    });
  });

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.route('/register').post((req, res, next) => {
    let hash = bcrypt.hashSync(req.body.password, 12);
    db.collection('users').findOne({
      username: req.body.username
    }, (err, foundUser) => {
      if (err) {
        next(err);
      } else if (!!foundUser) {
        res.redirect('/');
      } else {
        db.collection('users').insertOne({
          username: req.body.username,
          password: hash,
        }, (err, insertedUser) => {
          if (err) {
            res.redirect('/');
          } else {
            next(null, insertedUser);
          }
        });
      }
    })
  }, passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
    res.redirect('/profile');
  });
     
  app.route('/auth/github')
    .get(passport.authenticate('github'));

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/',}), (req, res) => {
    res.redirect('/profile');
  });

  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found'); 
  });
}