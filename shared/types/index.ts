export type StudentMealType = 'KELA_SUBSIDIZED' | 'STUDENT_DISCOUNT' | 'PREMIUM_STUDENT' | 'OTHER';
export type Diet = 'VEGAN' | 'VEGETARIAN' | 'GLUTEN_FREE' | 'LACTOSE_FREE' | 'DAIRY_FREE';

export interface Meal {
  id?: number;
  name: string;
  category: string;
  description?: string | null;
  price?: number | null;
  studentPrice?: number | null;
  diets: Diet[];
  allergens: string[];
}

export interface Menu {
  id?: number;
  restaurantId: number;
  date: string;
  sourceUrl: string;
  fetchedAt: string;
  sourceUpdatedAt?: string | null;
  meals: Meal[];
  stale?: boolean;
  error?: string | null;
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  area?: string | null;
  campus?: string | null;
  chain?: string | null;
  websiteUrl: string;
  menuUrl: string;
  studentDiscountAvailable: boolean;
  studentMealType: StudentMealType;
  studentPrice?: number | null;
  premiumStudentPrice?: number | null;
  normalPrice?: number | null;
  currency: string;
  openingHours?: string | null;
  lunchHours?: string | null;
  vegetarianAvailable: boolean;
  veganAvailable: boolean;
  glutenFreeAvailable: boolean;
  sourceUrl: string;
  priceSourceUrl: string;
  active: boolean;
  updatedAt: string;
  priceLastCheckedAt?: string | null;
  todayMenu?: Menu | null;
  distanceKm?: number;
}

export interface RestaurantFilters {
  query: string;
  maxPrice: number | null;
  studentDiscountOnly: boolean;
  premiumOnly: boolean;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  openNow: boolean;
  area: string;
  campus: string;
  chain: string;
  sort: 'name' | 'price' | 'distance';
}
