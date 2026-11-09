import http from "node:http";

const PORT = 8090;
const EMAIL = "demo@runout.local";
const PASSWORD = "RunOutDemo2026!";

const dish = (name, description) => ({ name, description });
const menu = (partySize, discountPercentage) => ({
  id: partySize,
  partySize,
  discountPercentage,
  priceBeforePerPerson: 200,
  priceAfterPerPerson: 200 * (1 - discountPercentage / 100),
  sections: {
    STARTERS: [dish("Burrata with heritage tomatoes", "Basil oil and sea salt")],
    MAINS: [dish(partySize <= 3 ? "Truffle rigatoni" : "Shared truffle rigatoni", "Parmesan and black truffle")],
    DESSERTS: [dish("Tiramisù", "Mascarpone, espresso and cocoa")],
    DRINKS: [dish("House lemonade", "Lemon, mint and soda")]
  }
});

let restaurant = {
  id: "10000000-0000-0000-0000-000000000001",
  ownerUserId: "20000000-0000-0000-0000-000000000001",
  name: "Casa Run Out",
  phone: "+971 4 555 0101",
  active: true,
  menuStatus: "DRAFT",
  pendingMenus: [],
  cuisine: "Italian",
  categories: ["Mediterranean", "Italian"],
  priceTier: 3,
  description: "Modern Italian dining in the heart of Dubai.",
  openingHours: "Daily, 12:00–23:30",
  tags: [],
  formattedAddress: "DIFC, Dubai, United Arab Emirates",
  parkingInstructions: "Use the Gate Avenue visitor car park, entrance from Al Mustaqbal Street. Bring your parking ticket for two hours of complimentary parking validation.",
  cityName: "Dubai",
  area: "DIFC",
  rating: 4.7,
  userRatingCount: 286,
  websiteUri: "https://example.com",
  googleMapsUri: null,
  menus: []
};

const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: restaurant.ownerUserId, realm_access: { roles: ["RESTAURANT"] } })}.demo`;

const headers = {
  "Access-Control-Allow-Origin": "http://127.0.0.1:5174",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, PATCH, PUT, POST, OPTIONS",
  "Content-Type": "application/json"
};

function send(response, status, body) {
  response.writeHead(status, headers);
  response.end(body === undefined ? undefined : JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204);

  try {
    if (request.method === "POST" && request.url === "/api/v1/auth/login") {
      const credentials = await readJson(request);
      if (credentials.email !== EMAIL || credentials.password !== PASSWORD) {
        return send(response, 401, { detail: "Incorrect demo email or password" });
      }
      return send(response, 200, { accessToken: token, refreshToken: "demo-refresh", expiresIn: 86400, refreshExpiresIn: 86400, tokenType: "Bearer" });
    }

    if (request.method === "POST" && request.url === "/api/v1/auth/logout") return send(response, 204);
    if (!request.headers.authorization?.startsWith("Bearer ")) return send(response, 401, { detail: "Sign in to continue" });

    if (request.method === "GET" && request.url === "/api/restaurant-portal/me") return send(response, 200, restaurant);

    if (request.method === "POST" && request.url === "/api/restaurant-portal/me/menus/cancel-submission") {
      if (restaurant.menuStatus !== "PENDING_APPROVAL") return send(response, 400, { detail: "Only pending submissions can be cancelled" });
      restaurant = { ...restaurant, menuStatus: "DRAFT" };
      return send(response, 200, restaurant);
    }

    if (request.method === "PATCH" && request.url === "/api/restaurant-portal/me") {
      if (restaurant.menuStatus === "PENDING_APPROVAL") return send(response, 400, { detail: "Restaurant details and menus are locked until management approves or rejects the submission" });
      restaurant = { ...restaurant, ...await readJson(request) };
      return send(response, 200, restaurant);
    }

    if (request.method === "PUT" && request.url === "/api/restaurant-portal/me/menus") {
      const body = await readJson(request);
      if (restaurant.menuStatus === "PENDING_APPROVAL") return send(response, 400, { detail: "Menus already awaiting approval" });
      if (!restaurant.phone || !restaurant.formattedAddress || !restaurant.openingHours || !restaurant.parkingInstructions || !restaurant.categories.length) return send(response, 400, { detail: "Complete restaurant details first" });
      if (!Array.isArray(body.menus) || body.menus.length !== 5 || new Set(body.menus.map(menu => menu.partySize)).size !== 5
          || body.menus.some(menu => menu.partySize < 2 || menu.partySize > 6 || menu.priceBeforePerPerson <= 0 || menu.priceAfterPerPerson < 0 || menu.priceAfterPerPerson > menu.priceBeforePerPerson
            || ["STARTERS", "MAINS", "DESSERTS", "DRINKS"].some(section => !menu.sections[section]?.length || menu.sections[section].some(item => !item.name?.trim())))) return send(response, 400, { detail: "Complete all five menus, prices and sections" });
      restaurant = { ...restaurant, pendingMenus: body.menus, priceTier: body.priceTier, menuStatus: "PENDING_APPROVAL" };
      return send(response, 200, restaurant);
    }

    return send(response, 404, { detail: "Demo route not found" });
  } catch (error) {
    return send(response, 400, { detail: error instanceof Error ? error.message : "Invalid request" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Restaurant demo API ready at http://127.0.0.1:${PORT}`);
  console.log(`Demo login: ${EMAIL} / ${PASSWORD}`);
});
