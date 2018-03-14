import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

// Models
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';

// Providers
import { GlobalProvider } from '../../providers/global/global';
import { ItineraryProvider } from '../../providers/itinerary/itinerary';

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
  active: Boolean = false;
  currentTime: Date = new Date();
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public global: GlobalProvider,
              private itinProvider: ItineraryProvider) {
              this.itin = this.navParams.data.itin || {};
              this.itins = this.navParams.data.itins || [];
              this.active = this.navParams.data.active || false;
              setInterval(() => this.currentTime = new Date(), 500);
  }

  ionViewDidLoad() {
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

  showNavigateButton() {
    return this.itin.address && this.itin.departed() && !this.itin.arrived();
  }

  // status action buttons
  startRun() {
    this.itin.flagCompleted();
    this.navToNextItin();
  }

  endRun() {
    this.itin.flagCompleted();
    this.navCtrl.setRoot(RunsPage);
  }

  depart() {
    this.itin.flagInProgress();
    this.itin.is_departed = true;
  }
  
  arrive() {
    this.itin.is_arrived = true;
  }

  pickup() {
    this.itin.flagCompleted();
  }

  dropoff() {
    this.itin.flagCompleted();
  }

  noshow() {
    this.itin.flagOther();
  }

  getNextItin() {
    return this.itins.find(r => (r.pending() || r.in_progress()));
  }

  navToNextItin() {
    let itin: Itinerary = this.getNextItin();
    this.navCtrl.setRoot(ItineraryPage, { itin: itin, run: this.run, active: true, itins: this.itins});
  }

  loadManifest() {
    this.navCtrl.setRoot(ManifestPage, {run: this.run, itineraries: this.itins});
  }
  
}

