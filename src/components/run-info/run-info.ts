import { Component, Input } from '@angular/core';
import { Run } from "../../models/run";

/**
 * Generated class for the RunInfoComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'run-info',
  templateUrl: 'run-info.html'
})
export class RunInfoComponent {

  @Input() run: Run;

  constructor() {
  }

}
