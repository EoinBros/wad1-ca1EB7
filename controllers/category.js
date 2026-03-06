'use strict';

import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// generic controller for one clothing category (tshirts, jackets, sneakers)
// reads catalogue and renders dashboard template filtered to that category

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_CATEGORIES = new Set(['tshirts', 'jackets', 'sneakers']);

const category = {
  createView(request, response) {
    const type = request.params.type;
    if (!VALID_CATEGORIES.has(type)) {
      // unknown category -> redirect to dashboard
      logger.warn(`Invalid category requested: ${type}`);
      return response.redirect('/dashboard');
    }

    logger.info(`Category page loading (${type})`);

    const cataloguePath = path.join(__dirname, '../models/Catalogue.json');
    let products = [];
    try {
      products = JSON.parse(fs.readFileSync(cataloguePath));

      // normalize flat array if needed
      if (Array.isArray(products)) {
        const grouped = {tshirts: [], jackets: [], sneakers: []};
        products.forEach(item => {
          const name = item.name.toLowerCase();
          if (name.includes('shirt')) grouped.tshirts.push(item);
          else if (name.includes('jacket')) grouped.jackets.push(item);
          else if (name.includes('sneaker')) grouped.sneakers.push(item);
          else grouped.tshirts.push(item);
        });
        products = grouped;
      }
    } catch (e) {
      logger.error('Error reading catalogue for category page', e);
      products = {tshirts: [], jackets: [], sneakers: []};
    }

    // filter to requested category only
    const filtered = {};
    filtered[type] = products[type] || [];

    const viewData = {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      id: type,
      products: filtered,
    };

    response.render('dashboard', viewData);
  },
};

export default category;
