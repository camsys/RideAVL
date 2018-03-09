import { Address } from '../models/address';

export class Itinerary {
  id: number;
  time_seconds: string;
  eta_seconds: string;
  leg_flag: number;
  trip_notes: string;
  trip_address_notes: string;
  trip_result: string;
  customer_name: string;
  phone: string;
  status_code: number;
  address: Address;

  label() {
    let label = "";
    switch(this.leg_flag) {
      case 0:
        label = "Pre-run vehicle inspection and departure"
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
      case 1:
        status_label = "In Progress";
        break;
      case 2:
        status_label = "Completed";
        break;
      case 3:
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

  pending() {
    return !this.status_code;
  }

  in_progress() {
    return this.status_code == 1;
  }

  completed() {
    return this.status_code == 2;
  }

  sameAs(itin: Itinerary) {
    if(!itin) {
      return false;
    }
    return itin === this || (itin.time_seconds == this.time_seconds && itin.address == this.address);
  }
}