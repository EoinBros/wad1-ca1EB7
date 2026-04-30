'use strict';

import logger from "../utils/logger.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import appStore from '../models/app-store.js';

// dashboard controller loads catalogue data and renders the catalogue view

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOGUE_PATH = path.join(__dirname, '../models/Catalogue.json');

function readCatalogue() {
  const catalogueData = JSON.parse(fs.readFileSync(CATALOGUE_PATH));

  if (!Array.isArray(catalogueData)) {
    return catalogueData;
  }

  const grouped = {tshirts: [], jackets: [], sneakers: []};
  catalogueData.forEach(item => {
    const name = item.name.toLowerCase();
    if (name.includes('shirt')) grouped.tshirts.push(item);
    else if (name.includes('jacket')) grouped.jackets.push(item);
    else if (name.includes('sneaker')) grouped.sneakers.push(item);
    else grouped.tshirts.push(item);
  });

  return grouped;
}

function writeCatalogue(catalogue) {
  fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(catalogue, null, 2));
}

function createCategoryId(categoryName) {
  return categoryName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatCategoryName(categoryId) {
  return categoryId
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const dashboard = {
  createView(request, response) {
    logger.info("Catalogue page loading!");

    // load the catalogue JSON directly
    let products = {};
    let categories = [];
    try {
      products = readCatalogue();

      // convert products object to array of categories with metadata
      categories = Object.keys(products).map(categoryName => ({
        id: categoryName,
        name: categoryName,
        displayName: formatCategoryName(categoryName),
        items: products[categoryName],
        itemCount: products[categoryName].length,
        image: products[categoryName][0]?.image || '/main.webp',
        createdDate: new Date().toLocaleDateString()
      }));
    } catch (e) {
      logger.error('Error reading catalogue file', e);
    }

    const viewData = {
      title: "Dashboard",
      id: "dashboard",
      categories: categories,
      products: products,
      info: appStore.getAppInfo()
    };

    logger.debug(viewData.categories);

    response.render('dashboard', viewData);
  },

  addCategory(request, response) {
    const categoryName = request.body.collectionName || request.body.name || '';
    const categoryId = createCategoryId(categoryName);

    if (!categoryId) {
      return response.status(400).json({ error: 'Collection name is required' });
    }

    try {
      const catalogue = readCatalogue();

      if (catalogue[categoryId]) {
        return response.status(409).json({ error: 'Collection already exists' });
      }

      catalogue[categoryId] = [];
      writeCatalogue(catalogue);
      logger.info(`Collection added: ${categoryId}`);

      response.json({
        success: true,
        category: {
          id: categoryId,
          displayName: formatCategoryName(categoryId)
        }
      });
    } catch (e) {
      logger.error('Error adding collection', e);
      response.status(500).json({ error: 'Error adding collection' });
    }
  },

  deleteCategory(request, response) {
    const categoryId = request.params.type;

    try {
      const catalogue = readCatalogue();

      if (!catalogue[categoryId]) {
        return response.status(404).json({ error: 'Collection not found' });
      }

      delete catalogue[categoryId];
      writeCatalogue(catalogue);
      logger.info(`Collection deleted: ${categoryId}`);

      response.json({ success: true });
    } catch (e) {
      logger.error('Error deleting collection', e);
      response.status(500).json({ error: 'Error deleting collection' });
    }
  },
};

export default dashboard;
