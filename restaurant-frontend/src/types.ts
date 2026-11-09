export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
};

export type MenuItem = { name: string; description: string };
export type MenuSection = "STARTERS" | "MAINS" | "DESSERTS" | "DRINKS";
export type RestaurantMenu = {
  id: number | null;
  partySize: number;
  discountPercentage: number;
  priceBeforePerPerson: number;
  priceAfterPerPerson: number;
  sections: Record<MenuSection, MenuItem[]>;
};

export type Restaurant = {
  menuStatus: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  pendingMenus: RestaurantMenu[];
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  cuisine: string | null;
  categories: string[];
  priceTier: number | null;
  description: string | null;
  openingHours: string | null;
  tags: string[];
  formattedAddress: string | null;
  parkingInstructions: string | null;
  cityName: string;
  area: string | null;
  rating: number | null;
  userRatingCount: number | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  menus: RestaurantMenu[];
  ownerUserId: string;
};
