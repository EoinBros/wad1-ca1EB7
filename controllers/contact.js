'use strict';

import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// contact controller renders a page showing app information
// similar to an about page including a map 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contact = {
  createView(request, response) {
    logger.info('Contact page loading!');
    // read the app-store.json directly to get the info object
    let info = {};
    try {
      const storePath = path.join(__dirname, '../models/app-store.json');
      const file = fs.readFileSync(storePath);
      const obj = JSON.parse(file);
      info = obj.info || {};
    } catch (e) {
      logger.error('Failed to load app info', e);
    }

    const viewData = {
      title: 'About',
      id: 'about',
      info: info
    };
    response.render('contact', viewData);
  },
};

export default contact;
