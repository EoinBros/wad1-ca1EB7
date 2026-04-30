'use strict';

import logger from "../utils/logger.js";
import appStore from '../models/app-store.js';
import userStore from '../models/user-store.js';

// dashboard controller loads catalogue data and renders the catalogue view

function readUserCatalogue(request) {
  return userStore.getCatalogue(request.currentUser.id);
}

function writeUserCatalogue(request, catalogue) {
  userStore.saveCatalogue(request.currentUser.id, catalogue);
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
      products = readUserCatalogue(request);

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
      currentUser: request.currentUser,
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
      const catalogue = readUserCatalogue(request);

      if (catalogue[categoryId]) {
        return response.status(409).json({ error: 'Collection already exists' });
      }

      catalogue[categoryId] = [];
      writeUserCatalogue(request, catalogue);
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
      const catalogue = readUserCatalogue(request);

      if (!catalogue[categoryId]) {
        return response.status(404).json({ error: 'Collection not found' });
      }

      delete catalogue[categoryId];
      writeUserCatalogue(request, catalogue);
      logger.info(`Collection deleted: ${categoryId}`);

      response.json({ success: true });
    } catch (e) {
      logger.error('Error deleting collection', e);
      response.status(500).json({ error: 'Error deleting collection' });
    }
  },
};

export default dashboard;
