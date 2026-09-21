export type Money = {
  amount: number;
  currency: string;
};

export type SearchArea = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type Payment = {
  reference: string | null;
  status: string;
};

export type Reservation = {
  id: string;
  status: string;
  reservationAt: string;
  excludedCuisineTypes: string[];
  partySize: number;
  budgetPerPerson: Money;
  totalBudget: Money;
  searchArea: SearchArea;
  payment: Payment;
  assignedEmployeeId: string | null;
  restaurantId: string | null;
  externalReference: string | null;
  confirmedReservationAt: string | null;
  createdAt: string;
};

export type Restaurant = {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  cuisine: string | null;
  priceTier: number | null;
  description: string | null;
  openingHours: string | null;
  tags: string[];
  googlePlaceId: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  userRatingCount: number | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  primaryType: string | null;
  types: string[];
  menus: RestaurantMenu[];
};

export type NearbyRestaurant = {
  id: string;
  name: string;
  formattedAddress: string | null;
  cuisine: string | null;
  rating: number | null;
  distanceMeters: number;
};

export type RestaurantMenu = {
  id: number | null;
  entries: Record<string, string>;
};

export type GooglePlaceCandidate = {
  googlePlaceId: string;
  name: string;
  formattedAddress: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  userRatingCount: number | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  primaryType: string | null;
  types: string[];
};

export type UserSummary = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  profile: UserProfile | null;
};

export type UserProfile = {
  phone: string | null;
  birthDate: string | null;
  dietaryPreferences: string[];
  allergyNotes: string | null;
  marketingNotificationsEnabled: boolean | null;
  reservationNotificationsEnabled: boolean | null;
  address: UserProfileAddress | null;
};

export type UserProfileAddress = {
  label: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type UserRole = "SUPER_ADMIN" | "MANAGER" | "WORKER" | "USER";

export type TokenResponse = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  tokenType: string;
};
