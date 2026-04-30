'use strict';

import logger from '../utils/logger.js';
import userStore from '../models/user-store.js';

// generic controller for one clothing category (tshirts, jackets, sneakers)
// reads catalogue and renders category template filtered to that category

function readUserCatalogue(request) {
  return userStore.getCatalogue(request.currentUser.id);
}

function writeUserCatalogue(request, catalogue) {
  userStore.saveCatalogue(request.currentUser.id, catalogue);
}

function isValidCategory(type, catalogue) {
  return Object.prototype.hasOwnProperty.call(catalogue, type);
}

function formatCategoryName(categoryId) {
  return categoryId
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getPriceValue(price) {
  return parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
}

function sortItems(items, sortBy, sortOrder) {
  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name),
    price: (a, b) => getPriceValue(a.price) - getPriceValue(b.price),
    description: (a, b) => a.description.localeCompare(b.description)
  };

  if (!sorters[sortBy]) {
    return items;
  }

  return [...items].sort((a, b) => {
    const result = sorters[sortBy](a, b);
    return sortOrder === 'desc' ? -result : result;
  });
}

const category = {
  createView(request, response) {
    const type = request.params.type;

    let products = {};
    try {
      products = readUserCatalogue(request);
    } catch (e) {
      logger.error('Error reading catalogue for category page', e);
      products = {};
    }

    if (!isValidCategory(type, products)) {
      logger.warn(`Invalid category requested: ${type}`);
      return response.redirect('/dashboard');
    }

    logger.info(`Category page loading (${type})`);

    const rawSearchTerm = request.query.search || '';
    const searchTerm = rawSearchTerm.trim().toLowerCase();
    const sortBy = ['name', 'price', 'description'].includes(request.query.sort) ? request.query.sort : '';
    const sortOrder = request.query.order === 'desc' ? 'desc' : 'asc';
    const allItems = products[type] || [];
    const filteredItems = searchTerm
      ? allItems.filter(item => item.name.toLowerCase().includes(searchTerm))
      : allItems;
    const items = sortItems(filteredItems, sortBy, sortOrder);

    const viewData = {
      title: formatCategoryName(type),
      id: type,
      items: items,
      searchTerm: rawSearchTerm,
      isSearching: searchTerm.length > 0,
      isSorted: sortBy.length > 0,
      hasFilters: searchTerm.length > 0 || sortBy.length > 0,
      sortBy: sortBy,
      sortOrder: sortOrder,
      sortByName: sortBy === 'name',
      sortByPrice: sortBy === 'price',
      sortByDescription: sortBy === 'description',
      sortAsc: sortOrder === 'asc',
      sortDesc: sortOrder === 'desc',
    };

    response.render('category', viewData);
  },

  addItem(request, response) {
    const type = request.params.type;
    try {
      const catalogue = readUserCatalogue(request);

      if (!isValidCategory(type, catalogue)) {
        logger.warn(`Invalid category for add: ${type}`);
        return response.status(400).json({ error: 'Invalid category' });
      }
      
      // Get next ID
      const allItems = Object.values(catalogue).flat();
      const maxId = Math.max(...allItems.map(item => item.id), 0);
      const newId = maxId + 1;

      const newItem = {
        id: newId,
        name: request.body.name,
        price: request.body.price,
        description: request.body.description,
        image: request.files?.itemImage?.path || request.body.image || '/main.webp'
      };

      if (!catalogue[type]) {
        catalogue[type] = [];
      }
      catalogue[type].push(newItem);

      writeUserCatalogue(request, catalogue);
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

    try {
      const catalogue = readUserCatalogue(request);
      
      if (!isValidCategory(type, catalogue)) {
        logger.warn(`Invalid category for update: ${type}`);
        return response.status(400).json({ error: 'Invalid category' });
      }

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
        image: request.files?.itemImage?.path || request.body.image || items[itemIndex].image
      };

      catalogue[type] = items;
      writeUserCatalogue(request, catalogue);
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

    try {
      const catalogue = readUserCatalogue(request);
      
      if (!isValidCategory(type, catalogue)) {
        logger.warn(`Invalid category for delete: ${type}`);
        return response.status(400).json({ error: 'Invalid category' });
      }

      const items = catalogue[type] || [];
      const itemIndex = items.findIndex(item => item.id === itemId);

      if (itemIndex === -1) {
        logger.warn(`Item not found for delete: ${itemId} in ${type}`);
        return response.status(404).json({ error: 'Item not found' });
      }

      const deletedItem = items.splice(itemIndex, 1);
      catalogue[type] = items;
      writeUserCatalogue(request, catalogue);
      logger.info(`Item deleted from ${type}: ${deletedItem[0].name}`);
      response.json({ success: true });
    } catch (e) {
      logger.error('Error deleting item', e);
      response.status(500).json({ error: 'Error deleting item' });
    }
  }
};

export default category;
