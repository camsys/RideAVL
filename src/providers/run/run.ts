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

// Runs Provider handles API Calls to the RidePilot back-end 
// to load and update Runs data
@Injectable()
export class RunProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;

  constructor(public http: Http,
              private auth: AuthProvider,
              private global: GlobalProvider,
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
    if(json_resp.active_run) {
      let run_data = json_resp.active_run.data;
      let run: Run = new Run();
      Object.assign(run, run_data.attributes);
      run.id = run_data.id;

      this.global.activeRun = run;
    }

    if(json_resp.active_itin) {
      let itin_data = json_resp.active_itin.data;
      let itin: Itinerary = new Itinerary();
      Object.assign(itin, itin_data.attributes);
      itin.id = itin_data.id;

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

    }
    return response;
  }

  // Handle errors by console logging the error, and publishing an error event
  // for consumption by the app's home page.
  private handleError(error: Response | any): Observable<any> {
    console.error('An error occurred', error, this); // for demo purposes only
    this.events.publish('error:http', error);
    return Observable.empty(); // return an empty observable so subscribe calls don't break
  }
}