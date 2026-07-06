require('dotenv').config();
const express  = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool   = require('../config/db');
const emitter = require('../events/eventEmitter');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { id, displayName, emails, photos } = profile;
    const email   = emails[0].value;
    const picture = photos[0]?.value;
    const result  = await pool.query(
      `INSERT INTO users (google_id, email, name, picture)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (google_id) DO UPDATE
         SET email=EXCLUDED.email, name=EXCLUDED.name, picture=EXCLUDED.picture
       RETURNING *`,
      [id, email, displayName, picture]
    );
    return done(null, result.rows[0]);
  } catch (err) { return done(err, null); }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Inicia flujo Google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Callback → genera JWT → redirige al frontend

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
  async (req, res) => {
    const user = req.user;
    const jti  = uuidv4();
    const token = jwt.sign(
      {
        jti,
        sub: user.google_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role, // el rol viene de la BD, nunca del cliente
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    emitter.emit('user.loggedIn', { userEmail: user.email, jti });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Logout: revoca el token
router.post('/logout', authMiddleware, async (req, res) => {
  const { jti, email } = req.user;
  await pool.query(
    'INSERT INTO revoked_tokens (jti) VALUES ($1) ON CONFLICT DO NOTHING', [jti]
  );
  emitter.emit('user.loggedOut', { userEmail: email, jti });
  emitter.emit('token.revoked', { userEmail: email, jti });
  res.json({ message: 'Sesion cerrada correctamente' });
});

// Perfil
router.get('/me', authMiddleware, (req, res) => {
  const { email, name, picture, role } = req.user;
  res.json({ email, name, picture, role });
});

router.get('/failure', (req, res) => {
  emitter.emit('user.loginFailed', { reason: 'Autenticacion con Google fallida' });
  res.status(401).json({ error: 'Autenticacion con Google fallida' });
});

module.exports = router;