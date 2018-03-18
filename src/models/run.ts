import { Vehicle } from '../models/vehicle';
import { Driver } from '../models/driver';
import { Itinerary } from '../models/itinerary';

export class Run {
  readonly STATUS_PENDING = 0;
  readonly STATUS_IN_PROGRESS = 1;
  readonly STATUS_COMPLETED = 2;

  id: number;
  name: string;
  scheduled_start_time_seconds: number;
  scheduled_end_time_seconds: number;
  vehicle: Vehicle;
  status_code: number;
  trips_count: number;
  start_odometer: number;
  end_odometer: number;
  actual_start_time: string;
  actual_end_time: string;

  completed() {
    return this.status_code == 2;
  }

  status() {
    let status_label = "Not yet started";
    switch(this.status_code) {
      case this.STATUS_IN_PROGRESS:
        status_label = "In progress";
        break;
      case this.STATUS_COMPLETED:
        status_label = "Completed";
        break;
      default:
        break;
    }

    return status_label;
  }

  // Update status
  flagPending() {
    this.status_code = this.STATUS_PENDING;
  }

  flagInProgress() {
    this.status_code = this.STATUS_IN_PROGRESS;
  }

  flagCompleted() {
    this.status_code = this.STATUS_COMPLETED;
  }
}