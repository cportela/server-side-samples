var authMiddleware = require("../config/auth-middleware");
var VenuesCtrl = require("../controllers/venues-ctrl");
var ctrl = new VenuesCtrl();

module.exports = function VenuesRoutes(app) {
  // Test
  app.get("/api/venues", authMiddleware.Authorize, ctrl.getTest);
  app.get("/api/venues/private", authMiddleware.Authorize, ctrl.getTest);

  app.post("/api/venues", authMiddleware.Authorize, ctrl.getAllVenues);
  app.post("/api/venues/:id", authMiddleware.Authorize, ctrl.getVenue);
  app.post("/api/venue", authMiddleware.Authorize, ctrl.insertVenue);
  app.put("/api/venue", authMiddleware.Authorize, ctrl.updateVenue);
  app.delete("/api/venue", authMiddleware.Authorize, ctrl.deleteVenue);
};
