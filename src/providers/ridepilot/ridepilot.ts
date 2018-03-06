import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { environment } from '../../app/environment'

// Models
import { User } from '../../models/user';
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';

// Providers
import { AuthProvider } from '../../providers/auth/auth';

// RidePilot Provider handles API Calls to the RidePilot Core back-end.
@Injectable()
export class RidepilotProvider {

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

  // Get run manifest
  getItineraries(runId?: number): Observable<Itinerary[]> {
    let uri: string = encodeURI(this.baseAvlUrl + 'manifest');
    if(runId && runId != 0) {
      uri += "?run_id=" + runId;
    }
    return this.http
               .get(uri, this.requestOptions())
               .map( response => this.unpackItinerariesResponse(response))
               .catch((error: Response) =>  this.handleError(error));
  }

  // Parse Runs response
  private unpackRunsResponse(response): Run[] {
    let runs = response.json().data || [];
    let runModels: Run[] = runs.map(run => this.parseRun(run));
    return  runModels;
  }

  // Parse individual run
  private parseRun(response): Run {
    let run: Run = response.attributes as Run;
    run.id = response.id;

    return run;
  }

  // Parse itineraries response
  private unpackItinerariesResponse(response): Itinerary[] {
    let itineraries = response.json().data || [];
    let itinModels: Itinerary[] = itineraries.map(itin => this.parseItinerary(itin));
    return  itinModels;
  }

  // Parse individual itinerary
  private parseItinerary(response): Itinerary {
    let itin: Itinerary = response.attributes as Itinerary;
    itin.id = response.id;

    return itin;
  }

  // Handle errors by console logging the error, and publishing an error event
  // for consumption by the app's home page.
  private handleError(error: Response | any): Observable<any> {
    console.error('An error occurred', error, this); // for demo purposes only
    this.events.publish('error:http', error);
    return Observable.empty(); // return an empty observable so subscribe calls don't break
  }
}