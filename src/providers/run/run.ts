import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { environment } from '../../app/environment'

// Models
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';
import { Vehicle } from '../../models/vehicle';
import { Address } from '../../models/address';
import { Inspection } from '../../models/inspection';

// Providers
import { AuthProvider } from '../../providers/auth/auth';
import { GlobalProvider } from '../../providers/global/global';
import { ManifestChangeProvider } from '../../providers/manifest-change/manifest-change';

// Runs Provider handles API Calls to the RidePilot back-end 
// to load and update Runs data
@Injectable()
export class RunProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;

  constructor(public http: Http,
              private auth: AuthProvider,
              private global: GlobalProvider,
              private manifestChangeProvider: ManifestChangeProvider,
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

  // Get one run
  getRun(run_id): Observable<Run> {
    return this.http
               .get(this.baseAvlUrl + 'runs/' + run_id, this.requestOptions())
               .map( response => this.unpackRun(response))
               .catch((error: Response) =>  this.handleError(error));
  }

  // Update run
  update(runId: Number, changes: {}): Observable<Run> {
    let uri: string = encodeURI(this.baseAvlUrl + 'runs/' + runId);
    let body = JSON.stringify({run: changes});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => this.unpackRun(response))
        .catch((error: Response) =>  this.handleError(error));
  }

  // Start Run
  startRun(runId: Number, data: {}): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'runs/' + runId + '/start');
    let body = JSON.stringify(data);

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // End Run
  endRun(runId: Number, data: {}): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'runs/' + runId + '/end');
    let body = JSON.stringify(data);

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Update from address
  updateFromAddress(runId: Number, data: {}): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'runs/' + runId + '/update_from_address');
    let body = JSON.stringify({address: data});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Update from address
  updateToAddress(runId: Number, data: {}): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'runs/' + runId + '/update_to_address');
    let body = JSON.stringify({address: data});

    return this.http
        .put(uri, body, this.requestOptions())
        .map( response => response)
        .catch((error: Response) =>  this.handleError(error));
  }

  // Get run inspection items
  getInspections(runId: Number): Observable<Inspection[]> {
    let uri: string = encodeURI(this.baseAvlUrl + 'runs/' + runId + '/inspections');
    return this.http
               .get(uri, this.requestOptions())
               .map( response => this.unpackInspectionsResponse(response))
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

  // Unpack individual run
  private unpackRun(response): Run {
    let json_resp = response.json();
    let run_data = json_resp.data || [];
    let vehicles = json_resp.included || [];
    let run: Run = this.parseRun(run_data, vehicles);

    return run;
  }

  // Parse individual run
  private parseRun(run_data, vehicles_data): Run {
    let run: Run = new Run();
    Object.assign(run, run_data.attributes);
    run.id = run_data.id;

    if(run.scheduled_start_time_seconds != null) {
      run.scheduled_start_time_seconds += (this.global.timeZoneDiffSeconds || 0);
    }
    if(run.scheduled_end_time_seconds) {
      run.scheduled_end_time_seconds += (this.global.timeZoneDiffSeconds || 0);
    }

    if(run_data.relationships && vehicles_data && vehicles_data.length > 0) {
      let vehicle_id = run_data.relationships.vehicle.data.id;
      let vehicle: Vehicle = new Vehicle();
      Object.assign(vehicle, vehicles_data.find(x => x.id === vehicle_id).attributes);
      vehicle.id = vehicle_id;
      run.vehicle = vehicle;
    }

    return run;
  }

  // Parse inspections response
  private unpackInspectionsResponse(response): Inspection[] {
    let json_resp = response.json();
    let inspections = json_resp.data || [];
    let insps: Inspection[] = inspections.map(insp => this.parseInspection(insp));
    return  insps;
  }

  // Parse individual inspections
  private parseInspection(insp_data): Inspection {
    let insp: Inspection = new Inspection();
    Object.assign(insp, insp_data);

    return insp;
  }

  loadDriverRunData(): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'driver_run_data');

    return this.http
        .get(uri, this.requestOptions())
        .map( response => this.parseDriverRunData(response))
        .catch((error: Response) =>  this.handleError(error));
  }

  parseDriverRunData(response) {
    let json_resp = response.json();

    let server_timezone_offset = json_resp.timezone_offset; // hours
    if(server_timezone_offset != null) {
      // convert to seconds
      // also positive offset in local is equal to negative server offset
      let local_timezone_offset = (new Date().getTimezoneOffset()) * -60; 
      this.global.timeZoneDiffSeconds = local_timezone_offset - server_timezone_offset * 3600;
    }

    // application level time intervals
    this.global.gpsInterval = json_resp.gps_interval_seconds;
    this.global.manifestCheckInterval = json_resp.manifest_change_check_interval_seconds;
    
    if(json_resp.active_run) {
      let run_data = json_resp.active_run.data;
      let run: Run = new Run();
      Object.assign(run, run_data.attributes);
      run.id = run_data.id;

      if(run.scheduled_start_time_seconds != null) {
        run.scheduled_start_time_seconds += (this.global.timeZoneDiffSeconds || 0);
      }
      if(run.scheduled_end_time_seconds) {
        run.scheduled_end_time_seconds += (this.global.timeZoneDiffSeconds || 0);
      }

      this.global.activeRun = run;

      this.manifestChangeProvider.connect();
    } else {
      this.global.activeRun = null;
      this.manifestChangeProvider.disconnect();
    }

    if(json_resp.active_itin) {
      let itin_data = json_resp.active_itin.data;
      let itin: Itinerary = new Itinerary();
      Object.assign(itin, itin_data.attributes);
      itin.id = itin_data.id;

      if(itin.eta_seconds != null) {
        itin.eta_seconds += (this.global.timeZoneDiffSeconds || 0);
      }
      if(itin.time_seconds) {
        itin.time_seconds += (this.global.timeZoneDiffSeconds || 0);
      }

      let included_data = json_resp.active_itin.included;
      if(included_data && included_data.length > 0) {
        let addr_data = included_data[0].attributes;
        let addr_id = included_data[0].id;
        let addr = new Address();
        addr.id = addr_id;
        Object.assign(addr, addr_data);
        itin.address = addr;
      }

      this.global.activeItin = itin;

      this.events.publish('gps:start');
    } else {
      this.global.activeItin = null;
    }

    if(json_resp.next_itin) {
      let next_itin_data = json_resp.next_itin.data;
      let nextItin: Itinerary = new Itinerary();
      Object.assign(nextItin, next_itin_data.attributes);
      nextItin.id = next_itin_data.id;

      if(nextItin.eta_seconds != null) {
        nextItin.eta_seconds += (this.global.timeZoneDiffSeconds || 0);
      }
      if(nextItin.time_seconds) {
        nextItin.time_seconds += (this.global.timeZoneDiffSeconds || 0);
      }

      let next_itin_included_data = json_resp.next_itin.included;
      if(next_itin_included_data && next_itin_included_data.length > 0) {
        let next_itin_addr_data = next_itin_included_data[0].attributes;
        let next_itin_addr_id = next_itin_included_data[0].id;
        let next_itin_addr = new Address();
        next_itin_addr.id = next_itin_addr_id;
        Object.assign(next_itin_addr, next_itin_addr_data);
        nextItin.address = next_itin_addr;
      }

      this.global.nextItin = nextItin;

    } else {
      this.global.nextItin = null;
    }
    
    return response;
  }

  checkActiveRunManifestChange(): Observable<Response>{
    let activeRun = this.global.activeRun;
    if(!activeRun) {
      return Observable.empty();
    }

    let url = this.baseAvlUrl + 'runs/' + activeRun.id + '/manifest_published_at';
    return this.http
               .get(url, this.requestOptions())
               .map( response => {
                let changed = false;
                let json_resp = response.json();
                if(json_resp.manifest_published_at && json_resp.manifest_published_at != activeRun.manifest_published_at) {
                  changed = true;
                }

                return changed;
               })
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