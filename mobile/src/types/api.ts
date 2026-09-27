export type ReservationStatus =
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'COMPLETED';

export type Money = { amount: number; currency: 'AED' };
export type SearchArea = { latitude: number; longitude: number; radiusMeters: number };
export type Payment = { reference: string; status: string };
export type Feedback = {
  rating: number;
  comment: string | null;
  wouldReturnForSurpriseMenu: boolean;
  submittedAt: string;
};

export type Reservation = {
  id: string;
  status: ReservationStatus;
  reservationAt: string;
  timeWindowStartAt: string;
  timeWindowEndAt: string;
  excludedCuisineTypes: string[];
  vibe: string | null;
  dietaryPreferences: string[];
  allergyNotes: string | null;
  locationLabel: string | null;
  partySize: number;
  budgetPerPerson: Money;
  totalBudget: Money;
  searchArea: SearchArea;
  payment: Payment | null;
  assignedEmployeeId: string | null;
  restaurantId: string | null;
  externalReference: string | null;
  confirmedReservationAt: string | null;
  feedback: Feedback | null;
  createdAt: string;
};

export type RestaurantMenu = { id: number; entries: Record<string, string> };
export type Restaurant = {
  id: string;
  name: string;
  cuisine: string | null;
  description: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUri: string | null;
  tags: string[];
  menus: RestaurantMenu[];
};

export type ReservationReveal = {
  available: boolean;
  status: ReservationStatus;
  reservation: Reservation;
  restaurant: Restaurant | null;
  menu: RestaurantMenu[] | null;
};

export type CreateReservationPayload = {
  reservationAt: string;
  timeWindowStartAt: string;
  timeWindowEndAt: string;
  excludedCuisineTypes: string[];
  vibe: string;
  dietaryPreferences: string[];
  allergyNotes: string | null;
  locationLabel: string;
  partySize: number;
  budgetPerPerson: Money;
  totalBudget: Money;
  searchArea: SearchArea;
};

export type UserProfile = {
  phone: string | null;
  birthDate: string | null;
  dietaryPreferences: string[];
  allergyNotes: string | null;
  marketingNotificationsEnabled: boolean | null;
  reservationNotificationsEnabled: boolean | null;
  address: {
    label: string | null;
    formattedAddress: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

export type User = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  profile: UserProfile | null;
};

export type TokenResponse = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  tokenType: string;
};

export type LocationCandidate = { label: string; placeId: string; latitude: number; longitude: number };
export type ProblemDetails = { title?: string; detail?: string; status?: number };
