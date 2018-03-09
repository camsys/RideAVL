import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { environment } from '../../app/environment'

// Models
import { Itinerary } from '../../models/itinerary';
import { Address } from '../../models/address';

// Providers
import { AuthProvider } from '../../providers/auth/auth';

// ItineraryProvider handles API Calls to the RidePilot Core back-end
// to load and update Itinerary data
@Injectable()
export class ItineraryProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;

  constructor(public http: Http,
              private auth: AuthProvider,
              public events: Events) {}
              
  // Constructs a request options hash with auth headers
  requestOptions(): RequestOptions {
    return new RequestOptions({ headers: this.auth.authHeaders() });
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

  // Parse itineraries response
  private unpackItinerariesResponse(response): Itinerary[] {
    let json_resp = response.json();
    let itineraries = json_resp.data || [];
    let addresses = json_resp.included || [];
    let itinModels: Itinerary[] = itineraries.map(itin => this.parseItinerary(itin, addresses));
    return  itinModels;
  }

  // Parse individual itinerary
  private parseItinerary(itin_data, addresses_data): Itinerary {
    let itin: Itinerary = new Itinerary();
    Object.assign(itin, itin_data.attributes);
    itin.id = itin_data.id;
    if(itin_data.relationships && addresses_data && addresses_data.length > 0) {
      let addr_id = itin_data.relationships.address.data.id;
      let addr_data = addresses_data.find(x => x.id === addr_id).attributes;
      let addr = new Address();
      addr.id = addr_id;
      Object.assign(addr, addr_data);
      itin.address = addr;
    }

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