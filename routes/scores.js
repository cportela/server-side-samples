var authMiddleware = require("../config/auth-middleware");
var ScoresCtrl = require("../controllers/scores-ctrl");
var ctrl = new ScoresCtrl();

module.exports = function EntriesRoutes(app) {
  // Test
  app.get("/api/scores", ctrl.getTest);
  app.get("/api/scores/private", authMiddleware.Authorize, ctrl.getTest);

  // Route to return all entries with a given event
  app.get("/api/scores/:eventId", authMiddleware.Authorize, ctrl.getScoresData);
};
