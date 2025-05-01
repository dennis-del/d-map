import { LatLngExpression } from 'leaflet';

export interface Location {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  instructions?: RouteInstruction[];
}

export interface RouteInstruction {
  text: string;
  distance: number;
  time: number;
  type: string;
  index: number;
}

export type TransportMode = 'car' | 'bicycle' | 'foot';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: LatLngExpression;
}

export interface SavedLocation {
    id: string;
    name: string;
    address: string;
    location: LatLngExpression;
    lastUsed: Date;
  }