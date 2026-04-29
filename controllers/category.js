'use strict';

import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// generic controller for one clothing category (tshirts, jackets, sneakers)
// reads catalogue and renders category template filtered to that category

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_CATEGORIES = new Set(['tshirts', 'jackets', 'sneakers']);
const CATALOGUE_PATH = path.join(__dirname, '../models/Catalogue.json');

const category = {
  createView(request, response) {
    const type = request.params.type;
    if (!VALID_CATEGORIES.has(type)) {
      logger.warn(`Invalid category requested: ${type}`);
      return response.redirect('/dashboard');
    }

    logger.info(`Category page loading (${type})`);

    let products = {};
    try {
      const catalogueData = JSON.parse(fs.readFileSync(CATALOGUE_PATH));
      products = catalogueData;
    } catch (e) {
      logger.error('Error reading catalogue for category page', e);
      products = {tshirts: [], jackets: [], sneakers: []};
    }

    const viewData = {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      id: type,
      items: products[type] || [],
    };

    response.render('category', viewData);
  },

  addItem(request, response) {
    const type = request.params.type;
    if (!VALID_CATEGORIES.has(type)) {
      logger.warn(`Invalid category for add: ${type}`);
      return response.status(400).json({ error: 'Invalid category' });
    }

    try {
      const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH));
      
      // Get next ID
      const allItems = Object.values(catalogue).flat();
      const maxId = Math.max(...allItems.map(item => item.id), 0);
      const newId = maxId + 1;

      const newItem = {
        id: newId,
        name: request.body.name,
        price: request.body.price,
        description: request.body.description,
        image: request.body.image
      };

      if (!catalogue[type]) {
        catalogue[type] = [];
      }
      catalogue[type].push(newItem);

      fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(catalogue, null, 2));
      logger.info(`Item added to ${type}: ${newItem.name}`);
      response.json({ success: true, item: newItem });
    } catch (e) {
      logger.error('Error adding item', e);
      response.status(500).json({ error: 'Error adding item' });
    }
  },

  updateItem(request, response) {
    const type = request.params.type;
    const itemId = parseInt(request.params.id);
    
    if (!VALID_CATEGORIES.has(type)) {
      logger.warn(`Invalid category for update: ${type}`);
      return response.status(400).json({ error: 'Invalid category' });
    }

    try {
      const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH));
      const items = catalogue[type] || [];
      const itemIndex = items.findIndex(item => item.id === itemId);

      if (itemIndex === -1) {
        logger.warn(`Item not found: ${itemId} in ${type}`);
        return response.status(404).json({ error: 'Item not found' });
      }

      items[itemIndex] = {
        id: itemId,
        name: request.body.name,
        price: request.body.price,
        description: request.body.description,
        image: request.body.image
      };

      catalogue[type] = items;
      fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(catalogue, null, 2));
      logger.info(`Item updated in ${type}: ID ${itemId}`);
      response.json({ success: true, item: items[itemIndex] });
    } catch (e) {
      logger.error('Error updating item', e);
      response.status(500).json({ error: 'Error updating item' });
    }
  },

  deleteItem(request, response) {
    const type = request.params.type;
    const itemId = parseInt(request.params.id);
    
    if (!VALID_CATEGORIES.has(type)) {
      logger.warn(`Invalid category for delete: ${type}`);
      return response.status(400).json({ error: 'Invalid category' });
    }

    try {
      const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH));
      const items = catalogue[type] || [];
      const itemIndex = items.findIndex(item => item.id === itemId);

      if (itemIndex === -1) {
        logger.warn(`Item not found for delete: ${itemId} in ${type}`);
        return response.status(404).json({ error: 'Item not found' });
      }

      const deletedItem = items.splice(itemIndex, 1);
      catalogue[type] = items;
      fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(catalogue, null, 2));
      logger.info(`Item deleted from ${type}: ${deletedItem[0].name}`);
      response.json({ success: true });
    } catch (e) {
      logger.error('Error deleting item', e);
      response.status(500).json({ error: 'Error deleting item' });
    }
  }
};

export default category;
