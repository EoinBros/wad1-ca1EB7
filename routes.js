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

// GET routes
router.get('/', start.createView);
router.get('/dashboard', dashboard.createView);
router.get('/about', about.createView);
router.get('/playlist/:id', playlist.createView);
router.get('/contact', contact.createView);
router.get('/stats', stats.createView);
router.get('/category/:type', category.createView);

// POST route - add item to category
router.post('/category/:type', category.addItem);

// PUT route - update item in category
router.put('/category/:type/:id', category.updateItem);

// DELETE route - delete item from category
router.delete('/category/:type/:id', category.deleteItem);

router.get('/error', (request, response) => response.status(404).end('Page not found.'));

export default router;

