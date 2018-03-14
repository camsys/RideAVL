export class Address {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  notes: string;
  latlng_only: boolean;
  one_line_text: string;

  displayText() {
    return this.address;
  }
}