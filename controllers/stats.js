'use strict';

import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stats = {
  createView(request, response) {
    logger.info('Stats page loading!');

    let statistics = {};
    let appInfo = {};
    try {
      statistics = this.calculateStatistics();
      const storePath = path.join(__dirname, '../models/app-store.json');
      const storeFile = fs.readFileSync(storePath);
      const storeObj = JSON.parse(storeFile);
      appInfo = storeObj.info || {};
    } catch (e) {
      logger.error('Failed to load stats data', e);
    }

    const viewData = {
      title: 'Statistics',
      id: 'stats',
      statistics,
      info: appInfo
    };

    response.render('stats', viewData);
  },

  calculateStatistics() {
    const stats = {
      totalUsers: 0,
      totalCollections: 0,
      totalItems: 0,
      averageItemsPerCollection: '0.00',
      largestCollectionName: 'N/A',
      largestCollectionSize: 0,
      smallestCollectionName: 'N/A',
      smallestCollectionSize: 0,
      totalUsersWithMostCollections: 0,
      userWithMostCollections: { name: 'N/A', collections: 0 },
      currentUser: { name: 'N/A', joined: 'N/A', job: 'N/A', city: 'N/A', collectionsCreated: 0, itemsAdded: 0, connections: 0 }
    };

    try {
      const cataloguePath = path.join(__dirname, '../models/Catalogue.json');
      const catalogueFile = fs.readFileSync(cataloguePath, 'utf8');
      const catalogueData = JSON.parse(catalogueFile);

      const employeePath = path.join(__dirname, '../models/employee.json');
      const employeeFile = fs.readFileSync(employeePath, 'utf8');
      const employeeData = JSON.parse(employeeFile);
      const users = employeeData.employee || [];

      const collectionEntries = Object.entries(catalogueData).map(([name, items]) => ({
        name,
        count: Array.isArray(items) ? items.length : 0
      }));

      stats.totalCollections = collectionEntries.length;
      stats.totalItems = collectionEntries.reduce((sum, collection) => sum + collection.count, 0);
      stats.averageItemsPerCollection = stats.totalCollections > 0 ?
        (stats.totalItems / stats.totalCollections).toFixed(2) : '0.00';

      if (collectionEntries.length > 0) {
        const sorted = [...collectionEntries].sort((a, b) => b.count - a.count);
        stats.largestCollectionName = sorted[0].name;
        stats.largestCollectionSize = sorted[0].count;
        stats.smallestCollectionName = sorted[sorted.length - 1].name;
        stats.smallestCollectionSize = sorted[sorted.length - 1].count;
      }

      stats.totalUsers = users.length;
      if (users.length > 0) {
        const userWithMostConnections = users.reduce((best, user) => {
          if (!best || (user.mates > best.mates)) return user;
          return best;
        }, null);

        stats.userWithMostCollections = {
          name: userWithMostConnections.fullname,
          collections: Math.max(1, Math.round(userWithMostConnections.mates / 7))
        };

        const currentUser = users[0];
        stats.currentUser = {
          name: currentUser.fullname,
          joined: currentUser.joined,
          job: currentUser.job,
          city: currentUser.city,
          connections: currentUser.mates,
          collectionsCreated: Math.max(1, Math.round(stats.totalCollections / stats.totalUsers)),
          itemsAdded: Math.max(1, Math.round(stats.totalItems / stats.totalUsers))
        };
      }
    } catch (e) {
      logger.error('Failed to calculate statistics', e);
    }

    return stats;
  }
};

export default stats;
