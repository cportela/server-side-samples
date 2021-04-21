var authMiddleware = require("../config/auth-middleware");
var EventsCtrl = require("../controllers/events-ctrl");
var ctrl = new EventsCtrl();

module.exports = function EventsRoutes(app) {
  // Test
  app.get("/api/events", authMiddleware.Authorize, ctrl.getTest);
  app.get("/api/events/private", authMiddleware.Authorize, ctrl.getTest);

  app.post("/api/events", authMiddleware.Authorize, ctrl.getAllEvents);
  app.post("/api/events/:id", authMiddleware.Authorize, ctrl.getEvent);
  app.post("/api/event", authMiddleware.Authorize, ctrl.insertEvent);
  app.put("/api/event", authMiddleware.Authorize, ctrl.updateEvent);
  app.delete("/api/event", authMiddleware.Authorize, ctrl.deleteEvent);
};
