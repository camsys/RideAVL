import { Component, Input } from '@angular/core';
import { Itinerary } from "../../models/itinerary";
/**
 * Generated class for the ItineraryInfoComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'itinerary-info',
  templateUrl: 'itinerary-info.html'
})
export class ItineraryInfoComponent {

  @Input() itin: Itinerary;

  constructor() {
  }

}
