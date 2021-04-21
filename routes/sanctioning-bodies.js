var authMiddleware = require("../config/auth-middleware");
var SanctioningBodiesCtrl = require("../controllers/sanctioning-bodies-ctrl");
var ctrl = new SanctioningBodiesCtrl();

module.exports = function SanctioningBodiesRoutes(app) {
  // Test
  app.get("/api/sanctioning-bodies", authMiddleware.Authorize, ctrl.getTest);
  app.get(
    "/api/sanctioning-bodies/private",
    authMiddleware.Authorize,
    ctrl.getTest
  );

  app.post(
    "/api/sanctioning-bodies",
    authMiddleware.Authorize,
    ctrl.getAllSanctioningBodies
  );
  app.post(
    "/api/sanctioning-bodies/:id",
    authMiddleware.Authorize,
    ctrl.getSanctioningBody
  );
  app.post(
    "/api/sanctioning-body",
    authMiddleware.Authorize,
    ctrl.insertSanctioningBody
  );
  app.put(
    "/api/sanctioning-body",
    authMiddleware.Authorize,
    ctrl.updateSanctioningBody
  );
  app.delete(
    "/api/sanctioning-body",
    authMiddleware.Authorize,
    ctrl.deleteSanctioningBody
  );
};
