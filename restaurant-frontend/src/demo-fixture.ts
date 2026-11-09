import type { RestaurantMenu } from "./types";

// Used only by the local demo's fill button. Nothing is submitted for approval.
export function filledDemoRestaurant() {
  const pendingMenus: RestaurantMenu[] = [2, 3, 4, 5, 6].map(partySize => ({
    id: partySize,
    partySize,
    priceBeforePerPerson: 200,
    priceAfterPerPerson: 150,
    discountPercentage: 25,
    sections: {
      STARTERS: [{ name: "Burrata and heritage tomatoes", description: `A shared starter platter for ${partySize} guests, with basil and olive oil.` }],
      MAINS: [{ name: "Truffle rigatoni", description: `${partySize} individual portions with parmesan and black truffle.` }],
      DESSERTS: [{ name: "Classic tiramisu", description: `One serving per person; ${partySize} servings in total.` }],
      DRINKS: [{ name: "House lemonade and water", description: `Per person: one 300 ml lemonade and one 500 ml water. ${partySize} of each for the table.` }]
    }
  }));
  return {
    menuStatus: "DRAFT",
    name: "Casa Run Out",
    phone: "+971 4 555 0101",
    description: "Modern Italian dining in DIFC, with seasonal dishes and a welcoming atmosphere.",
    openingHours: "Daily, 12:00–23:30",
    formattedAddress: "Gate Avenue, DIFC, Dubai, United Arab Emirates",
    parkingInstructions: "Use the Gate Avenue visitor car park via Al Mustaqbal Street. Follow signs to the restaurant entrance on the ground floor. Bring your ticket for two hours of complimentary parking validation.",
    area: "DIFC",
    websiteUri: "https://example.com",
    categories: ["Italian", "Mediterranean"],
    priceTier: 3,
    pendingMenus
  };
}
