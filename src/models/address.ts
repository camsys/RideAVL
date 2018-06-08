export class Address {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  notes: string;
  latlng_only: boolean;
  address_text: string;

  displayText() {
    return this.address;
  }

  one_line_text(){
    if(this.name) {
      return this.name + " (" + this.address_text + ")";
    } else {
      return this.address_text;
    }
  }
}