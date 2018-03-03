import { Vehicle } from '../models/vehicle';
import { Driver } from '../models/driver';
import { Itinerary } from '../models/itinerary';

export class Run {
  id: number;
  name: string;
  scheduled_start_time_string: string;
  scheduled_end_time_string: string;
  vehicle: Vehicle;
  driver: Driver;
  itineraries: Itinerary[];
}