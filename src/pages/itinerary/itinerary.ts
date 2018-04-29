import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

// Third-party native plugins
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';
import { Geolocation } from '@ionic-native/geolocation';

// Models
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';
import { Address } from '../../models/address';
import { Inspection } from '../../models/inspection';
import { Fare } from '../../models/fare';

// Providers
import { GlobalProvider } from '../../providers/global/global';
import { ItineraryProvider } from '../../providers/itinerary/itinerary';
import { RunProvider } from '../../providers/run/run';
import { GeocodingProvider } from '../../providers/geocoding/geocoding';

// Page
import {RunsPage} from '../runs/runs';
import {ManifestPage} from '../manifest/manifest';

@IonicPage()
@Component({
  selector: 'page-itinerary',
  templateUrl: 'itinerary.html',
})
export class ItineraryPage {
  run: Run = new Run();
  itin: Itinerary = new Itinerary();
  itins: Itinerary[] = [];
  inspections: Inspection[] = [];
  inspectionLoaded: boolean;
  driver_notes: string;
  run_start_odometer: number;
  run_end_odometer: number;
  active: Boolean = false;
  currentTime: Date = new Date();
  endRunFormGroup: FormGroup;
  
  constructor(public navCtrl: NavController, 
              public formBuilder: FormBuilder,
              public navParams: NavParams,
              public global: GlobalProvider,
              private geocoder: GeocodingProvider,
              private geolocation: Geolocation,
              private itinProvider: ItineraryProvider,
              private runProvider: RunProvider,
              private navigator: LaunchNavigator) {

              if(this.navParams.data.itin) {
                this.itin = this.navParams.data.itin;
              }

              if(this.navParams.data.itins) {
                this.itins = this.navParams.data.itins;
                if(this.itin) {
                  let matchItin = this.itins.find(r => r.id == this.itin.id);
                  if(matchItin) {
                    this.itin.eta = matchItin.eta;
                    this.itin.eta_seconds = matchItin.eta_seconds;
                  }
                }
              }

              if(this.navParams.data.run) {
                this.run = this.navParams.data.run;
                this.driver_notes = this.run.driver_notes;
                this.run_start_odometer = this.run.start_odometer;
                this.run_end_odometer = this.run.end_odometer;
              }

              this.active = this.navParams.data.active || false;
              
              // set system-wide active itinerary
              if(this.active) {
                global.activeItin = this.itin;
                let nextItin = null;
                if(this.itins) {
                  let activeItinId = global.activeItin.id;
                  let idx = this.itins.findIndex(r => r.id == activeItinId);
                  if(idx >=0 && idx < this.itins.length - 1) {
                    nextItin = this.itins[idx + 1];
                  }
                }
                global.nextItin = nextItin;
                global.activeItinEtaDiff = 0;
                global.activeRun = this.run;
              }

              if(this.itin.endRun()) {
                this.endRunFormGroup = formBuilder.group({
                  formControlEndOdometer: new FormControl('', Validators.min(this.run_start_odometer + 0.00001))
                });
              }

              setInterval(() => this.currentTime = new Date(), 500);
              setInterval(() => this.updateETA(), global.gpsInterval * 1000);
  }

  ionViewDidLoad() {
    if(this.itin.beginRun() && !this.inspectionLoaded) {
      this.requestInspections();
    }
  }

  // apply calculated eta_diff in all incomplete itins
  updateETA() {
    if(!this.itins) {
      return;
    }

    this.global.updateManifestETA(this.itins);
  }

  requestInspections() {
    this.inspectionLoaded = true;
    this.runProvider.getInspections(this.run.id)
                          .subscribe((resp) => this.loadInspections(resp));
  }

  loadInspections(insps: Inspection[]) {
    this.inspections = insps;
  }

  // button display checks when itinerary is active
  
  // Start Run button should only show for a beginRun leg
  showStartRunButton() {
    if (!this.active || !this.itin.beginRun()) {
      return false;
    }

    return true;
  }

  // End Run button should only show for a endRun leg
  showEndRunButton() {
    if (!this.active || !this.itin.endRun()) {
      return false;
    }

    return true;
  }

  // only a Pending itin should see Depart button
  showDepartButton() {
    if (!this.active || !this.itin.id || this.itin.beginRun() || this.itin.departed() || !this.itin.pending()) {
      return false;
    }

    return true;
  }

  // only a In Progress itin should see Arrive button
  showArriveButton() {
    if (!this.active || !this.itin.id || this.itin.beginRun() ||  !this.itin.flaged_in_progress() || this.itin.arrived()) {
      return false;
    }

    return true;
  }

  // only a In Progress Arrived Pickup itin should see Pickup button
  showPickupButton() {
    if (!this.active || !this.itin.id || !this.itin.pickup() || !this.itin.arrived() || !this.itin.flaged_in_progress()) {
      return false;
    }

    return true;
  }

  // only a In Progress Arrived Pickup itin should see No Show button
  showNoshowButton() {
    if (!this.active || !this.itin.id || !this.itin.pickup() || !this.itin.arrived() || !this.itin.flaged_in_progress()) {
      return false;
    }

    return true;
  }

  // only a In Progress Arrived Dropoff itin should see Dropoff button
  showDropoffButton() {
    if (!this.active || !this.itin.id || !this.itin.dropoff() || !this.itin.arrived() || !this.itin.flaged_in_progress()) {
      return false;
    }

    if(this.itin.hasFare() && !this.itin.fare.collected()) {
      return false;
    }

    return true;
  }

  // Show Undo once departed 
  showUndoButton() {
    return this.active && this.itin.departed() && this.itin.hasTrip();
  }

  // Show Undo once departed but not arrived
  showNavigateButton() {
    return this.itin.address && this.itin.departed() && !this.itin.arrived();
  }

  // Show proceed to next stop button when finished
  showProceedButton() {
    return this.active && this.itin.finished() && this.itin.hasTrip();
  }

  // Show skip donation button
  showSkipDonationButton() {
    return this.itin.fare && this.itin.fare.isDonation() && !this.itin.fare.collected();
  }

  // status action buttons
  startRun() {
    this.processStartRun();

    let callback = (lat, lng) => {
      this.geocoder.reverseGeocode(lat, lng)
        .subscribe((addr) => this.updateFromAddress(addr));
    }
    this.getCurrentLocation(callback);
  }

  endRun() {
    this.processEndRun();

    let callback = (lat, lng) => {
      this.geocoder.reverseGeocode(lat, lng)
        .subscribe((addr) => this.updateToAddress(addr));
    }
    this.getCurrentLocation(callback);
  }

  getCurrentLocation(callback) {
    let posOptions = {
      timeout: (this.global.gpsInterval) * 1000, 
      enableHighAccuracy: true
    };

    this.geolocation.getCurrentPosition(posOptions)
      .then((resp) => {
        callback(resp.coords.latitude, resp.coords.longitude)
      }, (error) => {
        console.log(error);
      });
  }

  processStartRun() {
    let data = {inspections: this.inspections, driver_notes: this.driver_notes, start_odometer: this.run_start_odometer};
    this.runProvider.startRun(this.run.id, data)
        .subscribe((resp) => {
          this.itin.flagCompleted();
          this.run.flagInProgress();
          this.run.start_odometer = this.run_start_odometer;
          this.run.driver_notes = this.driver_notes;
          this.navToNextItin();
        });
  }

  processEndRun() {
    let data = {end_odometer: this.run_end_odometer};

    this.runProvider.endRun(this.run.id, data)
        .subscribe((resp) => {
          this.itin.flagCompleted();
          this.run.flagCompleted();
          this.run.end_odometer = this.run_end_odometer;
          this.global.activeItin = null;
          this.global.nextItin = null;
          this.global.activeRun = null;
          this.navCtrl.setRoot(RunsPage);
        });
  }

  updateFromAddress(addr) {
    this.runProvider.updateFromAddress(this.run.id, addr).subscribe();
  }

  updateToAddress(addr) {
    this.runProvider.updateToAddress(this.run.id, addr).subscribe();
  }

  depart() {
    this.itinProvider.depart(this.itin.id)
        .subscribe((resp) => {
          this.itin.flagInProgress();
          this.itin.departure_time = this.getCurrentUTC();
        });
  }
  
  arrive() {
    this.itinProvider.arrive(this.itin.id)
        .subscribe((resp) => {
          this.itin.arrival_time = this.getCurrentUTC();
        });
  }

  pickup() {
    this.itinProvider.pickup(this.itin.id)
        .subscribe((resp) => {
          this.itin.flagCompleted();
          this.itin.finish_time = this.getCurrentUTC();
        });
  }

  dropoff() {
    this.itinProvider.dropoff(this.itin.id)
        .subscribe((resp) => {
          this.itin.flagCompleted();
          this.itin.finish_time = this.getCurrentUTC();
        });
  }

  noshow() {
    this.itinProvider.noshow(this.itin.id)
        .subscribe((resp) => {
          this.itin.flagOther();
          this.itin.finish_time = this.getCurrentUTC();
        });
  }

  skipDonation() {
    this.itinProvider.updateTripFare(this.itin.trip_id, 0)
        .subscribe((resp) => {
          this.itin.fare.collected_time = this.getCurrentUTC();
        });
  }

  processFare() {
    this.itinProvider.updateTripFare(this.itin.trip_id, this.itin.fare.amount)
        .subscribe((resp) => {
          this.itin.fare.collected_time = this.getCurrentUTC();
        });
  }

  executeUndo() {
    this.itinProvider.undo(this.itin.id)
        .subscribe((resp) => {
          this.itin.undo();
        });
  }

  filterNoShowItin() {
    if(this.itin.hasTrip() && this.itin.finished() && !this.itin.completed()) {
      // Other status (No show), need to remove the dropoff leg
      let trip_id: Number = this.itin.trip_id;
      this.itins = this.itins.filter(r => !(r.dropoff() && r.trip_id == trip_id));
    }
  }

  markInspectionChecked(insp: Inspection) {
    insp.checked = true;
  }

  markInspectionUnchecked(insp: Inspection) {
    insp.checked = false;
  }

  inspectionsResponded(): Boolean {
    return !this.inspections.find(r => r.checked == null);
  }

  getNextItin() {
    return this.itins.find(r => (!r.finished()));
  }

  navToNextItin() {
    this.filterNoShowItin();

    let itin: Itinerary = this.getNextItin();
    this.navCtrl.setRoot(ItineraryPage, { itin: itin, run: this.run, active: true, itins: this.itins});
  }

  loadManifest() {
    this.filterNoShowItin();
    this.navCtrl.setRoot(ManifestPage, {run: this.run, itineraries: this.itins});
  }
  
  launchNavigator() {
    let addr: Address = this.itin.address;
    let options: LaunchNavigatorOptions = {};

    this.navigator.navigate([addr.latitude, addr.longitude], options)
      .then(
        success => console.log('Launched navigator'),
        error => console.log('Error launching navigator', error)
      );
  }

  getCurrentUTC() {
    return (new Date()).toUTCString();
  }
}

