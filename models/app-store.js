'use strict';

import JsonStore from './json-store.js';

const appStore = {

  store: new JsonStore('./models/employee.json', { employee: {} }),
  collection: 'employee',

  getAppInfo() {
    return this.store.findAll(this.collection);
  }

};

export default appStore;