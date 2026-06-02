import { Categorie } from './categorie.model';

export interface Place {
  id?: number;
  name: string;
  description: string;
  address: string;
  region?: string; 
  phone?: string;
  email?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  categorie?: Categorie;
  openingHours?: string;
  website?: string;

  // Hotels
  stars?: number;
  roomsSingle?: number;
  roomsDouble?: number;
  priceSingle?: number;
  priceDouble?: number;
  fullBoard?: boolean;
  halfBoard?: boolean;

  // Restaurants
  cuisineType?: string;
  averagePrice?: number;
  tableCapacity?: number;
  deliveryAvailable?: boolean;

  // Hopitaux
  emergencyNumber?: string;
  specialties?: string;
  open24h?: boolean;

  // Facultés
  studentCount?: number;
  departments?: string;
  tuitionFees?: number;
  foundedYear?: number;

  // Location voiture
  vehicleCount?: number;
  pricePerDay?: number;

  // Café
  seatingCapacity?: number;
  cafePrice?: number;

  // Aéroport
  terminals?: string;
  runways?: number;

  // Musées
  ticketPrice?: number;
  museumCapacity?: number;
}