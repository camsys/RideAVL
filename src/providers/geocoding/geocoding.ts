import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { environment } from '../../app/environment'

// Models

// Providers
import { AuthProvider } from '../../providers/auth/auth';
import { GlobalProvider } from '../../providers/global/global';

// Native providers
import { Geolocation } from '@ionic-native/geolocation';

// GeocodingProvider handles geocoding/reverse-geocoding locations
@Injectable()
export class GeocodingProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;
  public reverseGeocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json?key=" + environment.GOOGLE_MAPS_KEY;

  constructor(public http: Http,
              private auth: AuthProvider,
              private global: GlobalProvider,
              private geolocation: Geolocation,
              public events: Events) {}
              
  // Constructs a request options hash with auth headers
  requestOptions(): RequestOptions {
    return new RequestOptions({ headers: this.auth.authHeaders() });
  }

  reverseGeocode(latitude: number, longitude: number): Observable<Response> {
    let uri = this.reverseGeocodingUrl + 
      "&latlng=" + latitude + "," + longitude;

    return this.http
        .get(uri, this.requestOptions())
        .map( response => this.parseReverseGeocodeResponse(response, latitude, longitude))
        .catch((error: Response) => this.handleError(error));
  }

  parseReverseGeocodeResponse(response, latitude, longitude){
    let addr = {
      latitude: latitude,
      longitude: longitude
    };
    let address = "", city, zip, state;

    let results = response.json().results;
    if(results.length > 0 && results[0].address_components.length > 0) {
      let match_addr = results[0];
      match_addr.address_components.forEach((obj) => {
        if(obj.types.indexOf('street_number') >= 0) {
          address = obj.long_name + address;
        } 

        if(obj.types.indexOf('route') >= 0) {
          address =  address + " " + obj.long_name;
        } 

        if(obj.types.indexOf('locality') >= 0) {
          city =  obj.short_name;
        }

        if(obj.types.indexOf('administrative_area_level_1') >= 0) {
          state =  obj.short_name;
        } 

        if(obj.types.indexOf('postal_code') >= 0) {
          zip =  obj.short_name;
        } 
      });
    }
    if(address) {
      addr["address"] = address;
    }
    if(city) {
      addr["city"] = city;
    }
    if(state) {
      addr["state"] = state;
    }
    if(zip) {
      addr["zip"] = zip;
    }

    return addr;
  }

  // Handle errors by console logging the error, and publishing an error event
  // for consumption by the app's home page.
  private handleError(error: Response | any): Observable<any> {
    console.error('An error occurred', error, this); // for demo purposes only
    //this.events.publish('error:http', error);
    return Observable.empty(); // return an empty observable so subscribe calls don't break
  }
}