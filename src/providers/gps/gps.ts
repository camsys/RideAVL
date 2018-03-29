import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { environment } from '../../app/environment'

// Models
import { Itinerary } from '../../models/itinerary';
import { GpsLocation } from '../../models/gps-location';

// Providers
import { AuthProvider } from '../../providers/auth/auth';
import { GlobalProvider } from '../../providers/global/global';

// Native providers
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Geolocation } from '@ionic-native/geolocation';

// ItineraryProvider handles API Calls to the RidePilot Core back-end
// to load and update Itinerary data
@Injectable()
export class GpsProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;

  private backgroundLocationConfig: BackgroundGeolocationConfig = {
            desiredAccuracy: 10,
            stationaryRadius: 20,
            distanceFilter: 30
    };

  constructor(public http: Http,
              public zone: NgZone,
              private auth: AuthProvider,
              private global: GlobalProvider,
              private geolocation: Geolocation,
              private backgroundGeolocation: BackgroundGeolocation,
              public events: Events) {}
              
  // Constructs a request options hash with auth headers
  requestOptions(): RequestOptions {
    return new RequestOptions({ headers: this.auth.authHeaders() });
  }

  // send gps info
  track(isBackgroundMode: boolean): Observable<Response> {
    if(isBackgroundMode) {
      return this.getBackgroundModeGps();
    } else {
      return this.getForegroundModeGps();
    }
  }

  // gps in background mode
  getBackgroundModeGps(): Observable<Response>{
    let activeRun = this.global.activeRun;
    let activeItin = this.global.activeItin;

    // there must be an active in progress run and itinerary
    if(!(activeRun && activeRun.inProgress() && activeItin)) {
      this.backgroundGeolocation.stop();
      return Observable.empty();
    }

    this.backgroundGeolocation.configure(this.backgroundLocationConfig)
        .subscribe(loc_data => {
          this.backgroundGeolocation.finish(); // FOR IOS ONLY
          
          let location = new GpsLocation();
          location.latitude = loc_data.latitude;
          location.longitude = loc_data.longitude;
          location.speed = loc_data.speed;
          location.accuracy = loc_data.accuracy;
          location.bearing = loc_data.bearing;
          location.log_time = new Date(loc_data.time).toUTCString();
          this.send(location);
        });

    // start recording location
    this.backgroundGeolocation.start();
  }

  // gps in foreground mode
  getForegroundModeGps(): Observable<Response> {
    let activeRun = this.global.activeRun;
    let activeItin = this.global.activeItin;

    // there must be an active in progress run and itinerary
    if(!(activeRun && activeRun.inProgress() && activeItin)) {
      return Observable.empty();
    }

    //console.log('watching...');
    this.geolocation.getCurrentPosition()
      .then((resp) => {
        // Run update inside of Angular's zone
        this.zone.run(() => {
          console.log(resp);
          let loc_data = resp.coords;
          let location = new GpsLocation();
          location.latitude = loc_data.latitude;
          location.longitude = loc_data.longitude;
          location.speed = loc_data.speed;
          location.accuracy = loc_data.accuracy;
          location.bearing = loc_data.heading;
          location.log_time = new Date(resp.timestamp).toUTCString();
          this.send(location);
        });
      })
      .catch((error: Response) =>  this.handleError(error));
  }

  send(location: GpsLocation): Observable<Response>{
    console.log(location); 

    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + this.global.activeItin.id + '/track_location');
    let body = JSON.stringify({gps_location: location});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Handle errors by console logging the error, and publishing an error event
  // for consumption by the app's home page.
  private handleError(error: Response | any): Observable<any> {
    console.error('An error occurred', error, this); // for demo purposes only
    this.events.publish('error:http', error);
    return Observable.empty(); // return an empty observable so subscribe calls don't break
  }
}