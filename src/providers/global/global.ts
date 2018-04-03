import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

// Models
import { User } from '../../models/user';
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';

@Injectable()
export class GlobalProvider {
  public user: User = {} as User;
  public activeItin: Itinerary;
  public activeRun: Run;
  public gpsInterval: number = 30; //30 seconds as default

  constructor(public http: Http) {
  }

}
