import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { environment } from '../../app/environment'

// Models
import { Run } from '../../models/run';
import { Vehicle } from '../../models/vehicle';

// Providers
import { AuthProvider } from '../../providers/auth/auth';

// Runs Provider handles API Calls to the RidePilot back-end 
// to load and update Runs data
@Injectable()
export class RunProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;

  constructor(public http: Http,
              private auth: AuthProvider,
              public events: Events) {}
              
  // Constructs a request options hash with auth headers
  requestOptions(): RequestOptions {
    return new RequestOptions({ headers: this.auth.authHeaders() });
  }

  // Get list of today's run
  getRuns(): Observable<Run[]> {
    return this.http
               .get(this.baseAvlUrl + 'runs', this.requestOptions())
               .map( response => this.unpackRunsResponse(response))
               .catch((error: Response) =>  this.handleError(error));
  }

  // Parse Runs response
  private unpackRunsResponse(response): Run[] {
    let json_resp = response.json();
    let runs = json_resp.data || [];
    let vehicles = json_resp.included || [];
    let runModels: Run[] = runs.map(run => this.parseRun(run, vehicles));
    return  runModels;
  }

  // Parse individual run
  private parseRun(run_data, vehicles_data): Run {
    let run: Run = new Run();
    Object.assign(run, run_data.attributes);
    run.id = run_data.id;
    if(run_data.relationships && vehicles_data && vehicles_data.length > 0) {
      let vehicle_id = run_data.relationships.vehicle.data.id;
      let vehicle: Vehicle = new Vehicle();
      Object.assign(vehicle, vehicles_data.find(x => x.id === vehicle_id).attributes);
      vehicle.id = vehicle_id;
      run.vehicle = vehicle;
    }

    return run;
  }

  // Handle errors by console logging the error, and publishing an error event
  // for consumption by the app's home page.
  private handleError(error: Response | any): Observable<any> {
    console.error('An error occurred', error, this); // for demo purposes only
    this.events.publish('error:http', error);
    return Observable.empty(); // return an empty observable so subscribe calls don't break
  }
}