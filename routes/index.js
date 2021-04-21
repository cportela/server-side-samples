const AuthRoutes = require("./auth");
const BillingRoutes = require("./billing");
const DashboardRoutes = require("./dashboard");
const EntriesRoutes = require("./entries");
const EventTypesRoutes = require("./event-types");
const EventsRoutes = require("./events");
const MediaItemsRoutes = require("./media-items");
const SanctioningBodiesRoutes = require("./sanctioning-bodies");
const ScoresRoutes = require("./scores");
const UsersRoutes = require("./users");
const VenueTypesRoutes = require("./venue_types");
const VenuesRoutes = require("./venues");

module.exports = function (app) {
  const ar = new AuthRoutes(app);
  const br = new BillingRoutes(app);
  const dr = new DashboardRoutes(app);
  const er = new EntriesRoutes(app);
  const etr = new EventTypesRoutes(app);
  const evr = new EventsRoutes(app);
  const mir = new MediaItemsRoutes(app);
  const sbr = new SanctioningBodiesRoutes(app);
  const sr = new ScoresRoutes(app);
  const ur = new UsersRoutes(app);
  const vtr = new VenueTypesRoutes(app);
  const vr = new VenuesRoutes(app);
};
