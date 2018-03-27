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
import { Fare } from '../../models/fare';

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

  // Update itinerary
  update(itinId: Number, changes: {}): Observable<Itinerary> {
    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + itinId);
    let body = JSON.stringify({itinerary: changes});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => this.parseItinerary(response))
        .catch((error: Response) =>  this.handleError(error));
  }

  // Depart
  depart(itinId: Number): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + itinId + '/depart');
    let body = JSON.stringify({});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Arrive
  arrive(itinId: Number): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + itinId + '/arrive');
    let body = JSON.stringify({});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Pickup
  pickup(itinId: Number): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + itinId + '/pickup');
    let body = JSON.stringify({});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Dropoff
  dropoff(itinId: Number): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + itinId + '/dropoff');
    let body = JSON.stringify({});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // No-show
  noshow(itinId: Number): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + itinId + '/noshow');
    let body = JSON.stringify({});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }


  // save trip fare
  updateTripFare(tripId: Number, amount: number): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'trips/' + tripId + '/update_fare');
    let body = JSON.stringify({fare_amount: amount});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Undo
  undo(itinId: Number): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + itinId + '/undo');
    let body = JSON.stringify({});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Parse individual itinerary
  private parseItinerary(response): Itinerary {
    let json_resp = response.json();
    let itin_data = json_resp.data || {};
    let addresses_data = json_resp.included || [];
    let rel_data = json_resp.relationships || [];

    let itin: Itinerary = new Itinerary();
    Object.assign(itin, itin_data.attributes);
    itin.id = itin_data.id;

    if(itin.fare) {
      let fare_attrs = itin.fare;
      let fare = new Fare();
      Object.assign(fare, fare_attrs);
      itin.fare = fare;
    }
    
    if(rel_data && rel_data.address.data && addresses_data && addresses_data.length > 0) {
      let addr_id = rel_data.address.data.id;
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