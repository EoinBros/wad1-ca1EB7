'use strict';

import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRAND_STORE_PATH = path.join(__dirname, '../models/brand-store.json');

function readBrandStore() {
  return JSON.parse(fs.readFileSync(BRAND_STORE_PATH));
}

const brands = {
  createView(request, response) {
    logger.info('Brands page loading!');

    let brandList = [];
    try {
      brandList = readBrandStore().brands || [];
    } catch (e) {
      logger.error('Unable to read brand store', e);
    }

    response.render('brands', {
      title: 'Brands',
      id: 'brands',
      brands: brandList
    });
  }
};

export default brands;
