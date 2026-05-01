'use strict';

import logger from '../utils/logger.js';
import userStore from '../models/user-store.js';

function getLoggedInUser(request) {
  const userId = request.cookies?.userId;
  const user = userId ? userStore.getUserById(userId) : null;
  if (user && !user.profileImage) {
    user.profileImage = '/batman.jpg';
  }
  return user;
}

function getPasswordRuleError(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number';
  }

  return '';
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
    const user = userStore.authenticate(email || '', password || '');

    if (!user) {
      logger.warn(`Failed login for ${email}`);
      return response.redirect(`/login?error=${encodeURIComponent('Invalid email or password')}`);
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

    const passwordError = getPasswordRuleError(password);
    if (passwordError) {
      return response.redirect(`/signup?error=${encodeURIComponent(passwordError)}`);
    }

    if (userStore.getUserByEmail(email)) {
      return response.redirect(`/signup?error=${encodeURIComponent('Email already registered')}`);
    }

    const profileImage = request.files?.profileImage?.path || '/batman.jpg';
    const user = userStore.addUser(firstName, lastName, email, password, profileImage);
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
