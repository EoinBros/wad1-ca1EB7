'use strict';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_PATH = path.join(__dirname, 'users.json');
const CATALOGUE_PATH = path.join(__dirname, 'Catalogue.json');

function readUsersFile() {
  return JSON.parse(fs.readFileSync(USERS_PATH));
}

function writeUsersFile(data) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
}

function getStarterCatalogue() {
  return JSON.parse(fs.readFileSync(CATALOGUE_PATH));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const userStore = {
  getAllUsers() {
    return readUsersFile().users;
  },

  getUserById(id) {
    return this.getAllUsers().find(user => user.id === id);
  },

  getUserByEmail(email) {
    return this.getAllUsers().find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  addUser(firstName, lastName, email, password, profileImage = '/batman.jpg') {
    const data = readUsersFile();
    const user = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      email,
      password: hashPassword(password),
      profileImage,
      catalogue: getStarterCatalogue(),
      collectionImages: {}
    };

    data.users.push(user);
    writeUsersFile(data);
    return user;
  },

  authenticate(email, password) {
    const user = this.getUserByEmail(email);
    if (user && user.password === hashPassword(password)) {
      return user;
    }
    return null;
  },

  getCatalogue(userId) {
    const user = this.getUserById(userId);
    return user?.catalogue || {};
  },

  saveCatalogue(userId, catalogue) {
    const data = readUsersFile();
    const user = data.users.find(currentUser => currentUser.id === userId);

    if (user) {
      user.catalogue = catalogue;
      writeUsersFile(data);
    }
  },

  getCollectionImages(userId) {
    const user = this.getUserById(userId);
    return user?.collectionImages || {};
  },

  saveCollectionImage(userId, categoryId, imagePath) {
    const data = readUsersFile();
    const user = data.users.find(currentUser => currentUser.id === userId);

    if (user) {
      user.collectionImages = user.collectionImages || {};
      user.collectionImages[categoryId] = imagePath;
      writeUsersFile(data);
    }
  }
};

export default userStore;
