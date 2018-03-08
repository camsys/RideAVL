import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the PrettyTimePipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'prettyTime',
})
export class PrettyTimePipe implements PipeTransform {
  constructor() { }
  
  transform(secs: number): string {
    let hrs = Math.floor(secs / 3600);
    let mins = Math.floor((secs - (hrs * 3600)) / 60);
    let ampm = "PM";
    
    // Set AM/PM
    if(hrs <= 12 || hrs >= 24) {
      ampm = "AM"
    }
    
    // Convert hour from 24-hour to 12-hour time
    if(hrs === 0 || hrs === 24) {
      hrs = 12;
    } else if(hrs > 12) {
      hrs = hrs - 12;
    }
    
    return hrs + ":" + ("00" + mins).slice(-2) + " " + ampm;
  }
}

