import { Injectable } from '@angular/core';
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

// GpsProvider handles API Calls to the RidePilot Core back-end
// to send GPS data
@Injectable()
export class GpsProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;
  public etaUrl = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + environment.GOOGLE_MAPS_KEY;

  private backgroundLocationConfig: BackgroundGeolocationConfig = {
            desiredAccuracy: 10,
            stationaryRadius: 20,
            distanceFilter: 30
    };

  constructor(public http: Http,
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
          this.send(location).subscribe();
          this.getETA(location).subscribe();
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

    let posOptions = {
      timeout: (this.global.gpsInterval) * 1000, 
      enableHighAccuracy: true
    };
    this.geolocation.getCurrentPosition(posOptions)
      .then((resp) => {
        let loc_data = resp.coords;
        let location = new GpsLocation();
        location.latitude = loc_data.latitude;
        location.longitude = loc_data.longitude;
        location.speed = loc_data.speed;
        location.accuracy = loc_data.accuracy;
        location.bearing = loc_data.heading;
        location.log_time = new Date(resp.timestamp).toUTCString();
        this.send(location).subscribe();
        this.getETA(location).subscribe();

      }, (error) => {
        console.log(error);
      });
  }

  getETA(location: GpsLocation): Observable<Response>{
    let dest = this.global.activeItin.address;
    let uri = this.etaUrl + "&departure_time=now" + 
      "&origins=" + location.latitude + "," + location.longitude + 
      "&destinations=" + dest.latitude + "," + dest.longitude;

    return this.http
        .get(uri, this.requestOptions())
        .map( response => this.parseEtaResponse(response))
        .catch((error: Response) => this.handleError(error));
  }

  parseEtaResponse(response): void {
    let json_resp = response.json();
    let drive_duration = parseInt(json_resp["rows"][0]["elements"][0]["duration"]["value"]);
    let current_time = new Date();
    let new_eta_seconds = current_time.getHours() * 3600 + current_time.getMinutes() * 60 + current_time.getSeconds() + drive_duration;
    let activeItin = this.global.activeItin;

    if(new_eta_seconds && activeItin) {
      if(activeItin.eta_seconds) {
        this.global.activeItinEtaDiff = new_eta_seconds - activeItin.eta_seconds;
      } 

      this.global.activeItin.eta_seconds = new_eta_seconds;
      console.log(new_eta_seconds);

      let new_eta: Date = new Date(current_time.getTime() + drive_duration * 1000);;
      this.uploadEta(activeItin.id, new_eta).subscribe();
    }
  }

  uploadEta(itin_id: number, eta: Date) {
    let uri: string = encodeURI(this.baseAvlUrl + 'itineraries/' + itin_id + '/update_eta');
    let body = JSON.stringify({eta: eta.toISOString()});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
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
    //this.events.publish('error:http', error);
    return Observable.empty(); // return an empty observable so subscribe calls don't break
  }
}