'use strict';

import logger from "../utils/logger.js";
import appStore from "../models/app-store.js";

// start controller handles the landing page of the application
// it fetches general application info and sends it to the view

const start = {
  createView(request, response) {
    logger.info("Start page loading!");
    
    const viewData = {
      title: "Welcome to the Playlist app!",
      info: appStore.getAppInfo()
    };
    
    //logger.debug(viewData);
    response.render('start', viewData);   
  },
};



export default start;
