import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events, Platform } from 'ionic-angular';

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
import { Geolocation, Geoposition } from '@ionic-native/geolocation';

// GpsProvider handles API Calls to the RidePilot Core back-end
// to send GPS data
@Injectable()
export class GpsProvider {
  private foregroundGeolocationWatch: any;
  private backgroundGeolocation: any;
  private is_tracking:boolean = false;
  private bgGeolocationConfigured: boolean = false;

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;
  public etaUrl = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + environment.GOOGLE_MAPS_KEY;

  public lastGpsLogTime: Date;

  private lastLocation: GpsLocation;
  private etaTracker: any;

  constructor(public platform: Platform,
              public http: Http,
              private auth: AuthProvider,
              private global: GlobalProvider,
              private geolocation: Geolocation,
              public events: Events) {
                this.platform.ready().then(() => {
                  this.backgroundGeolocation = (<any>window).BackgroundGeolocation;
                });
              }
              
  // Constructs a request options hash with auth headers
  requestOptions(): RequestOptions {
    return new RequestOptions({ headers: this.auth.authHeaders() });
  }

  // send gps info
  startTracking() {
    let activeRun = this.global.activeRun;
    let activeItin = this.global.activeItin;

    if(this.is_tracking || !(activeRun && activeRun.inProgress() && activeItin)) {
      return;
    }

    if(this.backgroundGeolocation) {
      this.startMotionTracking();
    } else {
      // foreground geolocation tracking ()
      if(!this.foregroundGeolocationWatch) {
        this.startForegroundTracking();
      }
    }

    // enable eta update
    let _scope = this;
    this.etaTracker = Observable.interval(this.global.etaInterval * 1000).subscribe(() => {
      this.getETA(this.lastLocation).subscribe();
    });
  }

  // both background and foreground tracking
  startMotionTracking() {
    if(!this.bgGeolocationConfigured) {
      this.backgroundGeolocation.ready({
        desiredAccuracy: 0,
        distanceFilter: 0,
        stationaryRadius: 0,
        locationUpdateInterval: 1000,
        startOnBoot: true
      }, (state) => {
        if (!state.enabled) {
          this.backgroundGeolocation.start();
          this.bgGeolocationConfigured = true;
        }
      });
    } else {
      this.backgroundGeolocation.start();
    }

    this.is_tracking = true;
    this.toggleBackgroundGeolocation(true);
  }

  startForegroundTracking() {
    this.is_tracking = true;
    let interval: number = (this.global.gpsInterval) * 1000;

    let posOptions = {
      timeout: 30 * 1000, 
      enableHighAccuracy: true
    };

    this.foregroundGeolocationWatch = this.geolocation.watchPosition(posOptions)
      .filter((p: any) => p.code === undefined)
      .subscribe((position: Geoposition) => {

        let newLogTime = new Date(position.timestamp);
        // ignore too frequent updates
        if(this.lastGpsLogTime && newLogTime && (+newLogTime - +this.lastGpsLogTime) < interval) {
          return Observable.empty();
        }

        this.lastGpsLogTime = newLogTime;

        let loc_data = position.coords;
        let location = new GpsLocation();
        location.latitude = loc_data.latitude;
        location.longitude = loc_data.longitude;
        location.speed = loc_data.speed;
        location.accuracy = loc_data.accuracy;
        location.bearing = loc_data.heading;
        location.log_time = newLogTime.toUTCString();
        this.lastLocation = location;
        this.send(location).subscribe();
      });
  }

  toggleBackgroundGeolocation(is_on: boolean) {
    //This callback will be executed every time a geolocation is recorded in the background.
    let _scope = this;
    let callbackFn = function(position, taskId) {
      let newLogTime = new Date(position.timestamp);
      // ignore too frequent updates
      //if(_scope.lastGpsLogTime && newLogTime && (+newLogTime - +_scope.lastGpsLogTime) < interval) {
      //  return Observable.empty();
      //}
    
      if(_scope.lastGpsLogTime && (+_scope.lastGpsLogTime - +newLogTime) == 0) {
        // ignore same location
        console.log('same location');
      } else {
        let loc_data = position.coords;
        _scope.lastGpsLogTime = newLogTime;
        let location = new GpsLocation();
        location.latitude = loc_data.latitude;
        location.longitude = loc_data.longitude;
        location.speed = loc_data.speed;
        location.accuracy = loc_data.accuracy;
        location.bearing = loc_data.heading;
        location.log_time = newLogTime.toUTCString();
        _scope.lastLocation = location;
        _scope.send(location).subscribe();
      }

      _scope.backgroundGeolocation.finish(taskId);   
    };

    // This callback will be executed if a location-error occurs.
    let failureFn = function(errorCode) {
      console.log('- BackgroundGeoLocation error: '+  errorCode);
    }

    if(is_on) {
      this.backgroundGeolocation.on('location', callbackFn, failureFn);
    } else {
      this.backgroundGeolocation.un('location', callbackFn);
      this.backgroundGeolocation.stop();
    }
  }


  // stop gps tracking
  stopTracking() {
    if(this.backgroundGeolocation) {
      this.toggleBackgroundGeolocation(false);
    } else {
      if(this.foregroundGeolocationWatch) {
        this.foregroundGeolocationWatch.unsubscribe();
      }
    }

    if(this.etaTracker) {
      this.etaTracker.unsubscribe();
    }

    this.is_tracking = false;
  }

  // calculate ETA based on location
  getETA(location: GpsLocation): Observable<Response> {
    if(!location) {
      return Observable.empty();
    }

    let itin;
    if(this.global.activeItin && !this.global.activeItin.arrived()) {
      itin = this.global.activeItin;
    } else {
      itin = this.global.nextItin;
    }

    if(!itin) {
      return Observable.empty();
    }

    let dest = itin.address;
    let uri = this.etaUrl + "&departure_time=now" + 
      "&origins=" + location.latitude + "," + location.longitude + 
      "&destinations=" + dest.latitude + "," + dest.longitude;

    return this.http
        .get(uri, this.requestOptions())
        .map( response => this.parseEtaResponse(itin, response))
        .catch((error: Response) => this.handleError(error));
  }

  parseEtaResponse(itin, response): void {
    let json_resp = response.json();
    let drive_duration = parseInt(json_resp["rows"][0]["elements"][0]["duration"]["value"]);

    let new_eta_seconds;
    let new_eta;
    let start_time = null;
    let is_processing = false;
    if(itin == this.global.activeItin) {
      // on the way to current leg dest
      start_time = new Date();
    } else {
      let activeItin = this.global.activeItin;
      if(activeItin.finished()) {
        // ready to go to next leg
        start_time = new Date();
      } else {
        if(activeItin.early_pickup_not_allowed && activeItin.time) {
          // need to wait until pickup schedule time
          let sch_time = new Date(activeItin.time);
          start_time = new Date();
          if(start_time < sch_time) {
            start_time = sch_time;
          }
        } else {
          // add current leg processing time
          start_time = new Date();
          is_processing = true; 
        }
      }
    }

    if(start_time) {
      // add current leg processing time
      new_eta = new Date(start_time.getTime() + drive_duration * 1000);
    }

    if(is_processing) {
      new_eta = new Date(new_eta.getTime() + this.global.activeItin.processing_time_seconds);
    }

    if(new_eta && itin) {
      let new_eta_seconds: number = (new_eta.getHours() * 3600 + new_eta.getMinutes() * 60 + new_eta.getSeconds());
      let is_new_day: boolean = false;
      if(itin.eta) {
        let eta_date = +new Date(itin.eta);
        this.global.activeItinEtaDiff = Math.floor((new_eta - eta_date) / 1000);
      } 

      // update global object
      itin.eta = new_eta.toISOString();
      itin.eta_seconds = new_eta_seconds;

      this.uploadEta(itin.id, new_eta).subscribe();
    } else {
      this.global.activeItinEtaDiff = 0;
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
    if(!this.global.activeItin) {
      return Observable.empty();
    }

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