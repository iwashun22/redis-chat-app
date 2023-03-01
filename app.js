const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const helmet = require('helmet');
const path = require('path');
const redisClient = require('./model/redis-loader');

const app = express();

const session = require('express-session');
const passport = require('passport');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
const GoogleStrategy = require('passport-google-oauth20');
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GitHubStrategy = require('passport-github2');
// const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
// const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

passport.serializeUser((user, done) => {
   done(null, user);
});
passport.deserializeUser((obj, done) => {
   done(null, obj);
});

passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:8032/auth/google/callback'
   },
   function(accessToken, refreshToken, profile, cb) {
      // console.log(profile)
      redisClient.hGet('all_users', profile.id, async (err, name) => {
         if(err) throw err;
         if(!name) {
            await redisClient.hSet('all_users', profile.id, profile.name.givenName);
         }
      })
      return cb(null, profile);
   }
))

passport.use(new GitHubStrategy({
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:8032/auth/github/callback'
   },
   function(accessToken, refreshToken, profile, cb) {
      redisClient.hGet('all_users', profile.id, async (err, name) => {
         if(err) throw err;
         if(!name) {
            await redisClient.hSet('all_users', profile.id, profile.username);
         }
      })
      return cb(null, profile);
   }
))

app.use(helmet());
app.disable('x-powered-by');
app.use(logger('dev'));
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'public')));

app.use(session({
   secret: '2a6a01094d01906ceb',
   resave: true,
   saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const chatroomRouter = require('./routes/chat-room');
const messageRouter = require('./routes/message');

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/chatroom', chatroomRouter);
app.use('/message', messageRouter);

app.get('/auth/google',
   passport.authenticate('google', { scope: ['profile'] })
)
app.get('/auth/google/callback',
   passport.authenticate('google', { failureRedirect: '/login' }),
   (req, res) => {
      res.redirect('/');
   }
)

app.get('/auth/github',
   passport.authenticate('github', { scope: ['user:email'] })
)
app.get('/auth/github/callback',
   passport.authenticate('github', { failureRedirect: '/login' }),
   (req, res) => {
      res.redirect('/');
   }
)

app.use((req, res, next) => {
   res.status(404);
   // respond with html page
   if (req.accepts('html')) {
      res.render('notfound', { url: req.url, hideLogin: true });
      return;
   }

   // respond with json
   if (req.accepts('json')) {
      res.json({ error: 'Not found' });
      return;
   }

   // default to plain-text. send()
   res.type('txt').send('Not found');
})

module.exports = app;