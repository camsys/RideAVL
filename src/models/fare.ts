export class Fare {
  fare_type: string;
  pre_trip: boolean;
  amount: number;
  collected_time: string;

  collected() {
    return this.collected_time;
  }

  isDonation() {
    return this.fare_type == "donation";
  }

  collectedText() {
    if(this.collected()) {
      if(this.amount) {
        return "Collected $" + this.amount + " " + this.fare_type + " at " + this.formatTime(this.collected_time);
      } else {
        return "Skipped " + this.fare_type;
      }
    } else {
      return "Not collected yet";
    }
  }

  private formatTime(strTime: string): string {
    if(strTime) {
      let timeObj = new Date(strTime);
      return this.formatAMPM(timeObj);
    } else {
      return "N/A";
    }
  }

  private formatAMPM(date: Date): string {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    let strMin = minutes < 10 ? '0'+minutes : minutes;
    let strTime = hours + ':' + strMin + ' ' + ampm;
    return strTime;
  }
}