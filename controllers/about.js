'use strict';

import logger from '../utils/logger.js';
import appStore from '../models/app-store.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// about controller shows info and product list
// it reads from the catalogue JSON file to supply product data

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const about = {
  createView(request, response) {
    logger.info('About page loading!');

    // load catalogue data so we can list name and price
    const cataloguePath = path.join(__dirname, '../models/Catalogue.json');
    let products = [];
    try {
      products = JSON.parse(fs.readFileSync(cataloguePath));
    } catch (e) {
      logger.error('Unable to read catalogue in about controller', e);
    }

    const viewData = {
      title: 'Collection',
      employee: appStore.getAppInfo(),
      products: products,
      id: 'about'
    };

    response.render('about', viewData);
  },
};

export default about;