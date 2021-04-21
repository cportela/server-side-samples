var authMiddleware = require("../config/auth-middleware");
var AuthCtrl = require("../controllers/auth-ctrl");
var ctrl = new AuthCtrl();

module.exports = function AuthRoutes(app) {
  // Test
  app.get("/api/auth", ctrl.getTest);

  app.post("/api/auth/signup", ctrl.signup);
  app.post("/api/auth/login", ctrl.login);
  app.post("/api/auth/reset", ctrl.reset);
  app.delete("/api/auth/logout", authMiddleware.Authorize, ctrl.logout);
};
