var authMiddleware = require("../config/auth-middleware");
var VenueTypesCtrl = require("../controllers/venue-types-ctrl");
var ctrl = new VenueTypesCtrl();

module.exports = function VenueTypesRoutes(app) {
  // Test
  app.get("/api/venue-types", authMiddleware.Authorize, ctrl.getTest);
  app.get("/api/venue-types/private", authMiddleware.Authorize, ctrl.getTest);

  app.post("/api/venue-types", authMiddleware.Authorize, ctrl.getAllVenueTypes);
  app.post("/api/venue-types/:id", authMiddleware.Authorize, ctrl.getVenueType);
  app.post("/api/venue-type", authMiddleware.Authorize, ctrl.insertVenueType);
  app.put("/api/venue-type", authMiddleware.Authorize, ctrl.updateVenueType);
  app.delete("/api/venue-type", authMiddleware.Authorize, ctrl.deleteVenueType);
};
