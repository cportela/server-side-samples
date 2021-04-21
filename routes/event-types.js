var authMiddleware = require("../config/auth-middleware");
var EventTypesCtrl = require("../controllers/event-types-ctrl");
var ctrl = new EventTypesCtrl();

module.exports = function EventTypesRoutes(app) {
  // Test
  app.get("/api/event-types", authMiddleware.Authorize, ctrl.getTest);
  app.get("/api/event-types/private", authMiddleware.Authorize, ctrl.getTest);

  app.post("/api/event-types", authMiddleware.Authorize, ctrl.getAllEventTypes);
  app.post("/api/event-types/:id", authMiddleware.Authorize, ctrl.getEventType);
  app.post("/api/event-type", authMiddleware.Authorize, ctrl.insertEventType);
  app.put("/api/event-type", authMiddleware.Authorize, ctrl.updateEventType);
  app.delete("/api/event-type", authMiddleware.Authorize, ctrl.deleteEventType);
};
