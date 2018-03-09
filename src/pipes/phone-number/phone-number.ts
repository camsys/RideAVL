import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the PhoneNumberPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'phoneNumber',
})
export class PhoneNumberPipe implements PipeTransform {
  transform(phoneNumber: string): string {
    if(!phoneNumber) {
      return "";
    }

    let formattedNumber = "(" + phoneNumber.slice(0,3) + ") " 
                              + phoneNumber.slice(3,6) + "-" 
                              + phoneNumber.slice(6)
    return formattedNumber;
  }
}
