import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

// Models
import { User } from '../../models/user';
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';

@Injectable()
export class GlobalProvider {
  public timezone: string;
  public user: User = {} as User;
  public activeItin: Itinerary;
  public nextItin: Itinerary;
  public activeRun: Run;
  public activeItinEtaDiff: number = 0; // ETA difference in seconds for current leg (new_eta - old_eta)
  public gpsInterval: number = 30; //30 seconds as default

  constructor(public http: Http) {
  }

  updateManifestETA(itineraries) {
    let eta_diff = this.activeItinEtaDiff;
    if(!eta_diff) {
      return;
    }

    let last_eta = null;
    let current_leg_updated = false;
    let pending_itins = itineraries.filter(r => !r.arrived());
    for(let it of pending_itins) {
      if(!current_leg_updated && this.activeItin) {
        if(!this.activeItin.arrived()) {
          if(it.id == this.activeItin.id) {
            it.eta = this.activeItin.eta;
            it.eta_seconds = this.activeItin.eta_seconds;
            current_leg_updated = true;
            last_eta = new Date(it.eta);
            continue;
          }
        } else if(this.nextItin) {
          if(it.id == this.nextItin.id) {
            it.eta = this.nextItin.eta;
            it.eta_seconds = this.nextItin.eta_seconds;
            current_leg_updated = true;
            last_eta = new Date(it.eta);
            continue;
          }
        }
      }

      if(it.early_pickup_not_allowed && last_eta) {
        if(last_eta <= new Date(it.time)) {
          break;
        } else {
          let time_date = +new Date(it.time);
          eta_diff = Math.floor((last_eta - time_date)/1000);
        }
      }

      it.updateEta(eta_diff);

      if(it.eta) {
        last_eta = new Date(it.eta);
      }
    }
    this.activeItinEtaDiff = 0;
  }

}
