'use strict';

import logger from "../utils/logger.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import appStore from '../models/app-store.js';

// dashboard controller loads catalogue data and renders the catalogue view

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dashboard = {
  createView(request, response) {
    logger.info("Catalogue page loading!");

    // load the catalogue JSON directly
    const cataloguePath = path.join(__dirname, '../models/Catalogue.json');
    let products = [];
    try {
      products = JSON.parse(fs.readFileSync(cataloguePath));

      // if the catalogue is still a flat array, convert into categories
      if (Array.isArray(products)) {
        const grouped = {tshirts: [], jackets: [], sneakers: []};
        products.forEach(item => {
          const name = item.name.toLowerCase();
          if (name.includes('shirt')) grouped.tshirts.push(item);
          else if (name.includes('jacket')) grouped.jackets.push(item);
          else if (name.includes('sneaker')) grouped.sneakers.push(item);
          else grouped.tshirts.push(item); // default bucket
        });
        products = grouped;
      }
    } catch (e) {
      logger.error('Error reading catalogue file', e);
    }

    const viewData = {
      title: "Catalogue",
      id: "dashboard",
      products: products,
      info: appStore.getAppInfo()
    };

    logger.debug(viewData.products);

    response.render('dashboard', viewData);
  },
};

export default dashboard;

