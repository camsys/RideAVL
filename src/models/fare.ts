export class Fare {
  fare_type: string;
  pre_trip: boolean;
  amount: number;
  collected_time: string;

  collected() {
    return this.collected_time && (this.amount || this.amount == 0);
  }
}