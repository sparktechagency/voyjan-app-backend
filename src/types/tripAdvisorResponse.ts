export interface Location {
  location_id: string;
  name: string;
  web_url: string;
  address_obj: Address;
  ancestors: Ancestor[];
  latitude: string;
  longitude: string;
  timezone: string;
  phone: string;
  website: string;
  write_review: string;
  ranking_data: RankingData;
  rating: string;
  rating_image_url: string;
  num_reviews: string;
  review_rating_count: ReviewRatingCount;
  photo_count: string;
  see_all_photos: string;
  hours: Hours;
  category: Category;
  subcategory: SubCategory[];
  groups: Group[];
  neighborhood_info: unknown[];
  trip_types: TripType[];
  awards: unknown[];
}

export interface Address {
  street1: string;
  street2: string;
  city: string;
  country: string;
  postalcode: string;
  address_string: string;
}

export interface Ancestor {
  level: string;
  name: string;
  location_id: string;
}

export interface RankingData {
  geo_location_id: string;
  ranking_string: string;
  geo_location_name: string;
  ranking_out_of: string;
  ranking: string;
}

export interface ReviewRatingCount {
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
}

export interface Hours {
  periods: unknown[]; // TripAdvisor sends complex objects here
  weekday_text: string[];
}

export interface Category {
  name: string;
  localized_name: string;
}

export interface SubCategory {
  name: string;
  localized_name: string;
}

export interface Group {
  name: string;
  localized_name: string;
  categories: unknown[];
}

export interface TripType {
  name: string;
  localized_name: string;
  value: string;
}

export type TripAdvisorResponse = Location&{photos:string[]}