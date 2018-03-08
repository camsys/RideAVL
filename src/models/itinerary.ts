import { Address } from '../models/address';

export class Itinerary {
  id: number;
  time_seconds: string;
  eta_seconds: string;
  leg_flag: number;
  trip_notes: string;
  trip_address_notes: string;
  customer_name: string;
  address: Address;

  label() {
    let label = "";
    switch(this.leg_flag) {
      case 0:
        label = "Vehicle Inspection / Departure"
        break;
      case 1:
        label = "Pick up " + this.customer_name;
        break;
      case 2:
        label = "Drop off " + this.customer_name;
        break;
      case 3:
        label = "Finsh the Run";
        break;
      default:
        break;
    }

    return label;
  }
}