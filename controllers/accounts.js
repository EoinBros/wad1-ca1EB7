'use strict';

import logger from '../utils/logger.js';
import userStore from '../models/user-store.js';

function getLoggedInUser(request) {
  const userId = request.cookies?.userId;
  return userId ? userStore.getUserById(userId) : null;
}

const accounts = {
  checkAuth(request, response, next) {
    const currentUser = getLoggedInUser(request);
    request.currentUser = currentUser;
    response.locals.currentUser = currentUser;
    next();
  },

  requireAuth(request, response, next) {
    if (!request.currentUser) {
      return response.redirect('/login');
    }
    next();
  },

  showLogin(request, response) {
    response.render('login', {
      title: 'Login',
      id: 'login',
      error: request.query.error
    });
  },

  login(request, response) {
    const { email, password } = request.body;
    const safeEmail = email || 'guest@example.com';
    let user = userStore.getUserByEmail(safeEmail);

    if (!user) {
      user = userStore.addUser('Guest', 'User', safeEmail, password || 'password');
    }

    response.cookie('userId', user.id, { httpOnly: true, sameSite: 'lax' });
    logger.info(`User logged in: ${user.email}`);
    response.redirect('/dashboard');
  },

  showSignup(request, response) {
    response.render('signup', {
      title: 'Signup',
      id: 'signup',
      error: request.query.error
    });
  },

  signup(request, response) {
    const { firstName, lastName, email, password } = request.body;

    if (!firstName || !lastName || !email || !password) {
      return response.redirect(`/signup?error=${encodeURIComponent('Please fill in all fields')}`);
    }

    if (userStore.getUserByEmail(email)) {
      return response.redirect(`/signup?error=${encodeURIComponent('Email already registered')}`);
    }

    const user = userStore.addUser(firstName, lastName, email, password);
    response.cookie('userId', user.id, { httpOnly: true, sameSite: 'lax' });
    logger.info(`User signed up: ${user.email}`);
    response.redirect('/dashboard');
  },

  logout(request, response) {
    response.clearCookie('userId');
    response.redirect('/login');
  }
};

export default accounts;
