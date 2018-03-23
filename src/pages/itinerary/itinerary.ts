import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

// Third-party native plugins
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';

// Models
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';
import { Address } from '../../models/address';
import { Inspection } from '../../models/inspection';

// Providers
import { GlobalProvider } from '../../providers/global/global';
import { ItineraryProvider } from '../../providers/itinerary/itinerary';
import { RunProvider } from '../../providers/run/run';

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
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public global: GlobalProvider,
              private itinProvider: ItineraryProvider,
              private runProvider: RunProvider,
              private navigator: LaunchNavigator) {

              if(this.navParams.data.itin) {
                this.itin = this.navParams.data.itin;
              }

              if(this.navParams.data.itins) {
                this.itins = this.navParams.data.itins;
              }

              if(this.navParams.data.run) {
                this.run = this.navParams.data.run;
                this.driver_notes = this.run.driver_notes;
                this.run_start_odometer = this.run.start_odometer;
                this.run_end_odometer = this.run.end_odometer;
              }

              this.active = this.navParams.data.active || false;
              setInterval(() => this.currentTime = new Date(), 500);
  }

  ionViewDidLoad() {
    if(this.itin.beginRun() && !this.inspectionLoaded) {
      this.requestInspections();
    }
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
    if (!this.active || !this.itin.id || !this.itin.hasTrip() || this.itin.departed() || !this.itin.pending()) {
      return false;
    }

    return true;
  }

  // only a In Progress itin should see Arrive button
  showArriveButton() {
    if (!this.active || !this.itin.id || !this.itin.hasTrip() ||  !this.itin.in_progress() || this.itin.arrived()) {
      return false;
    }

    return true;
  }

  // only a In Progress Arrived Pickup itin should see Pickup button
  showPickupButton() {
    if (!this.active || !this.itin.id || !this.itin.pickup() || !this.itin.arrived() || !this.itin.in_progress()) {
      return false;
    }

    return true;
  }

  // only a In Progress Arrived Pickup itin should see No Show button
  showNoshowButton() {
    if (!this.active || !this.itin.id || !this.itin.pickup() || !this.itin.arrived() || !this.itin.in_progress()) {
      return false;
    }

    return true;
  }

  // only a In Progress Arrived Dropoff itin should see Dropoff button
  showDropoffButton() {
    if (!this.active || !this.itin.id || !this.itin.dropoff() || !this.itin.arrived() || !this.itin.in_progress()) {
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

  // status action buttons
  startRun() {
    this.runProvider.startRun(this.run.id, {inspections: this.inspections, driver_notes: this.driver_notes, start_odometer: this.run_start_odometer})
        .subscribe((resp) => {
          this.itin.flagCompleted();
          this.run.flagInProgress();
          this.run.start_odometer = this.run_start_odometer;
          this.run.driver_notes = this.driver_notes;
          this.navToNextItin();
        });
  }

  endRun() {
    this.runProvider.endRun(this.run.id, {end_odometer: this.run_end_odometer})
        .subscribe((resp) => {
          this.itin.flagCompleted();
          this.run.flagCompleted();
          this.run.end_odometer = this.run_end_odometer;
          this.navCtrl.setRoot(RunsPage);
        });
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
    return this.itins.find(r => (r.pending() || r.in_progress()));
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

