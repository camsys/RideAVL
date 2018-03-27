import { Address } from '../models/address';
import { Fare } from '../models/fare';

export class Itinerary {
  readonly STATUS_PENDING = 0;
  readonly STATUS_IN_PROGRESS = 1;
  readonly STATUS_COMPLETED = 2;
  readonly STATUS_OTHER = 3;

  id: number;
  trip_id: number;
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
  departure_time: string;
  arrival_time: string;
  finish_time: string;

  address: Address;
  fare: Fare;


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
    if(this.in_progress()) {
      status_label = "In Progress";
    } else if (this.completed()) {
      status_label = "Completed";
    } else if (this.finished()) {
      status_label = this.trip_result;
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

  // status_code as in_progress
  flaged_in_progress() {
    return this.status_code == this.STATUS_IN_PROGRESS;
  }

  // actual in_progress status check
  in_progress() {
    if(this.flaged_in_progress()) {
      return true;
    }
    
    if(this.hasFare() && this.flaged_completed() && !this.fare.collected()) {
      return true;
    }

    return false;
  }

  // status_code as completed, but might have fare to collect 
  flaged_completed() {
    return this.status_code == this.STATUS_COMPLETED;
  }

  // actual completed status check
  completed() {
    if(!this.flaged_completed()) {
      return false;
    }

    if(this.hasFare() && !this.fare.collected()) {
      return false;
    }

    return true;
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
    this.trip_result = "No-show";
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

  // Get info of last action
  lastActionInfo() {
    if(this.completed()) {
      if(this.dropoff()) {
        return "You have dropped off at " + this.formatTime(this.finish_time);
      } else if(this.pickup()) {
        if(this.hasFare() && this.fare.collected()) {
          return "Collected $" + this.fare.amount + " " + this.fare.fare_type + " at " + this.formatTime(this.fare.collected_time);
        } else {
          return "You have picked up at " + this.formatTime(this.finish_time);
        }
      } 
    } else if(this.hasFare() && this.fare.collected()) {
      return "Collected $" + this.fare.amount + " " + this.fare.fare_type + " at " + this.formatTime(this.fare.collected_time);
    } else if(this.pickup() && this.flaged_completed()) {
      return "You have picked up at " + this.formatTime(this.finish_time);
    } else if (this.finished()) {
      return "You marked as No Show at " + this.formatTime(this.finish_time);
    } else {
      if(this.arrived()) {
        return "You have arrived at " + this.formatTime(this.arrival_time);
      } else if (this.departed()) {
        return "You have departed at " + this.formatTime(this.departure_time);
      }
    }
  }

  // Get list of history action 
  historyActions() {
    let actions = [];
    if(this.departed()) {
      actions.push("Departed at " + this.formatTime(this.departure_time));
    }
    if(this.arrived()) {
      actions.push("Arrived at " + this.formatTime(this.arrival_time));
    }
    if(this.completed()) {
      if(this.pickup()) {
        actions.push("Picked up at " + this.formatTime(this.finish_time));
        if(this.hasFare()) {
          actions.push("Collected $" + this.fare.amount + " " + this.fare.fare_type + " at " + this.formatTime(this.fare.collected_time));
        }
      }
      if(this.dropoff()) {
        if(this.hasFare()) {
          actions.push("Collected $" + this.fare.amount + " " + this.fare.fare_type + " at " + this.formatTime(this.fare.collected_time));
        }
        actions.push("Dropped off at " + this.formatTime(this.finish_time));
      }
    } else if (this.finished()) {
      actions.push("Marked as No Show at " + this.formatTime(this.finish_time));
    }


    return actions;
  }

  // Undo last action
  undo() {
    // first dealing with fare undo
    if(this.hasFare() && this.completed() && this.pickup()) {
      this.fare.collected_time = null;
    } else if(this.hasFare() && this.pickup() && this.flaged_completed() && !this.fare.collected()) { 
      this.finish_time = null;
      this.flagInProgress();
      this.trip_result = null;
    } else if(this.hasFare() && this.dropoff() && this.in_progress() && this.fare.collected()) {
      this.fare.collected_time = null;
    } else if(this.hasFare() && this.dropoff() && this.in_progress() && this.arrived() && !this.fare.collected()) { 
      this.arrival_time = null;
    } else {
      if (this.finished()) {
        this.finish_time = null;
        this.flagInProgress();
        this.trip_result = null;
      } else if (this.in_progress()) {
        if(this.arrived()) {
          this.arrival_time = null;
        } else if (this.departed()) {
          this.departure_time = null;
          this.flagPending();
        }
      }
    }
  }

  // departed?
  departed() {
    return this.departure_time;
  }

  // arrived?
  arrived() {
    return this.arrival_time;
  }

  // check if itin has fare
  hasFare() {
    return this.fare && (
      ( this.fare.pre_trip && this.pickup() ) ||
      (!this.fare.pre_trip && this.dropoff())
    );
  }

  // check if need to present fare info
  showFare() {
    let showFare = false;

    if(this.fare && !this.fare.collected()) {
      // if pre_trip, then collect fare after picked up the passenger
      if(this.fare.pre_trip && this.pickup() && this.flaged_completed()) {
        
        showFare = true;

      } else if (!this.fare.pre_trip && this.dropoff() && this.arrived() && !this.completed()) {
        // if post_trip, then collect fare before dropping off the passnger
        // after arriving at the destination
        
        showFare = true;
      }
    }

    return showFare;
  }

  // Comparison
  sameAs(itin: Itinerary) {
    if(!itin) {
      return false;
    }
    return itin === this || (itin.time_seconds == this.time_seconds && itin.address == this.address);
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