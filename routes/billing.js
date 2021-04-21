var authMiddleware = require("../config/auth-middleware");
var BillingCtrl = require("../controllers/billing-ctrl");
var ctrl = new BillingCtrl();

module.exports = function BillingRoutes(app) {
  // Test
  app.get("/api/billing", ctrl.getTest);

  app.post("/api/cards", authMiddleware.Authorize, ctrl.getAllCards);
  app.post("/api/cards/:id", authMiddleware.Authorize, ctrl.getCard);
  app.post("/api/card", authMiddleware.Authorize, ctrl.insertCard);
  app.delete("/api/card", authMiddleware.Authorize, ctrl.deleteCard);

  app.post("/api/charges", authMiddleware.Authorize, ctrl.getAllCharges);
  app.post("/api/charges/:id", authMiddleware.Authorize, ctrl.getCharge);
  app.post("/api/charge", authMiddleware.Authorize, ctrl.insertCharge);
  // This call creates a new rider and execute a charge
  app.post(
    "/api/registerAndCharge",
    authMiddleware.Authorize,
    ctrl.registerAndCharge
  );
};
