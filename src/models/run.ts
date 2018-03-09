import { Vehicle } from '../models/vehicle';
import { Driver } from '../models/driver';
import { Itinerary } from '../models/itinerary';

export class Run {
  id: number;
  name: string;
  scheduled_start_time_seconds: number;
  scheduled_end_time_seconds: number;
  vehicle: Vehicle;
  status_code: number;
  status: string;
  trips_count: number;

  completed() {
    return this.status_code == 2;
  }
}