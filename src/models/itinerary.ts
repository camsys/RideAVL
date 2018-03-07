export class Itinerary {
  id: number;
  time: string;
  eta: string;
  address_name: string;
  customer_name: string;
  leg_flag: number;

  public label():string {
    return this.customer_name;
  }
}