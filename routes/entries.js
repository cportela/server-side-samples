var authMiddleware = require("../config/auth-middleware");
var EntriesCtrl = require("../controllers/entries-ctrl");
var ctrl = new EntriesCtrl();

module.exports = function EntriesRoutes(app) {
  // Test
  app.get("/api/entries", ctrl.getTest);
  app.get("/api/entries/private", authMiddleware.Authorize, ctrl.getTest);

  app.post("/api/entries", authMiddleware.Authorize, ctrl.getAllEntries);
  app.post(
    "/api/entries/event/:id",
    authMiddleware.Authorize,
    ctrl.getAllEntries
  );
  app.post("/api/entries/:id", authMiddleware.Authorize, ctrl.getEntry);
  app.post("/api/entry", authMiddleware.Authorize, ctrl.insertEntry);
  app.put("/api/entry", authMiddleware.Authorize, ctrl.updateEntry);
  app.delete("/api/entry", authMiddleware.Authorize, ctrl.deleteEntry);
};
