'use strict';

import express from 'express';
const router = express.Router();
import logger from "./utils/logger.js";

import start from './controllers/start.js';
import dashboard from './controllers/dashboard.js';
import about from './controllers/about.js';
import playlist from './controllers/playlist.js';
import contact from './controllers/contact.js';
import stats from './controllers/stats.js';
import category from './controllers/category.js';
import accounts from './controllers/accounts.js';
import upload from './utils/upload.js';

router.use(accounts.checkAuth);

// GET routes
router.get('/', start.createView);
router.get('/login', accounts.showLogin);
router.post('/login', accounts.login);
router.get('/signup', accounts.showSignup);
router.post('/signup', upload, accounts.signup);
router.get('/logout', accounts.logout);
router.get('/logoff', accounts.logout);
router.get('/dashboard', accounts.requireAuth, dashboard.createView);
router.get('/about', about.createView);
router.get('/playlist/:id', playlist.createView);
router.get('/contact', contact.createView);
router.get('/stats', stats.createView);
router.get('/category/:type', accounts.requireAuth, category.createView);

// Dashboard collection routes
router.post('/dashboard/category', accounts.requireAuth, upload, dashboard.addCategory);
router.delete('/dashboard/category/:type', accounts.requireAuth, dashboard.deleteCategory);

// POST route - add item to category
router.post('/category/:type', accounts.requireAuth, upload, category.addItem);

// PUT route - update item in category
router.put('/category/:type/:id', accounts.requireAuth, upload, category.updateItem);

// DELETE route - delete item from category
router.delete('/category/:type/:id', accounts.requireAuth, category.deleteItem);

router.get('/error', (request, response) => response.status(404).end('Page not found.'));

export default router;
