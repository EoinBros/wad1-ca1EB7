'use strict';

import logger from "../utils/logger.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    } catch (e) {
      logger.error('Error reading catalogue file', e);
    }

    const viewData = {
      title: "Catalogue",
      id: "dashboard",
      products: products
    };

    logger.debug(viewData.products);

    response.render('dashboard', viewData);
  },
};

export default dashboard;

