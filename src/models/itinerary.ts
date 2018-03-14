import { Address } from '../models/address';

export class Itinerary {
  readonly STATUS_PENDING = 0;
  readonly STATUS_IN_PROGRESS = 1;
  readonly STATUS_COMPLETED = 2;
  readonly STATUS_OTHER = 3;

  id: number;
  time_seconds: string;
  eta_seconds: string;
  leg_flag: number;
  trip_notes: string;
  customer_notes: string;
  trip_address_notes: string;
  trip_result: string;
  customer_name: string;
  phone: string;
  status_code: number;
  address: Address;
  is_departed: Boolean;
  is_arrived: Boolean;

  label() {
    let label = "";
    switch(this.leg_flag) {
      case 0:
        label = "Pre-run vehicle inspection"
        break;
      case 1:
        label = "Pickup: " + this.customer_name;
        break;
      case 2:
        label = "Dropoff: " + this.customer_name;
        break;
      case 3:
        label = "Finsh the Run";
        break;
      default:
        break;
    }

    return label;
  }

  status() {
    let status_label = "Pending";
    switch(this.status_code) {
      case this.STATUS_IN_PROGRESS:
        status_label = "In Progress";
        break;
      case this.STATUS_COMPLETED:
        status_label = "Completed";
        break;
      case this.STATUS_OTHER:
        status_label = this.trip_result;
        break;
      default:
        break;
    }

    return status_label;
  }

  // Gap between ETA and Schedueld Time
  gap_in_seconds() {
    let diff = parseInt(this.eta_seconds) - parseInt(this.time_seconds);

    return diff;
  }

  // Gap status: late, early, or on time
  gap_status() {
    let gap = this.gap_in_seconds();
    let code = 0; // N/A

    if(gap == 0) {
      code = 1; // On Time
    } else if(gap > 0) {
      code = 2; // Early
    } else if(gap > 0) {
      code = 3; // Late
    } 

    return code;
  }

  // Get gap label
  gap_status_label() {
    let code = this.gap_status();
    let label = "N/A";

    switch(code) {
      case 1:
        label = "On Time";
        break;
      case 2:
        label = "Ahead";
        break;
      case 3:
        label = "Late";
        break;
      default:
        break;
    } 

    return label;
  }

  // Status check
  pending() {
    return !this.status_code;
  }

  in_progress() {
    return this.status_code == this.STATUS_IN_PROGRESS;
  }

  completed() {
    return this.status_code == this.STATUS_COMPLETED;
  }

  finished() {
    return this.completed() || this.status_code == this.STATUS_OTHER;
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

  flagOther() {
    this.status_code = this.STATUS_OTHER;
  }

  // Type check
  hasTrip() {
    return this.pickup() || this.dropoff();
  }

  beginRun() {
    return this.leg_flag == 0;
  }

  pickup() {
    return this.leg_flag == 1;
  }

  dropoff() {
    return this.leg_flag == 2;
  }

  endRun() {
    return this.leg_flag == 3;
  }

  // departed?
  departed() {
    return this.is_departed;
  }

  // arrived?
  arrived() {
    return this.is_arrived;
  }

  // Comparison
  sameAs(itin: Itinerary) {
    if(!itin) {
      return false;
    }
    return itin === this || (itin.time_seconds == this.time_seconds && itin.address == this.address);
  }
}