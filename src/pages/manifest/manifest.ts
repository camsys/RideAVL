import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the ManifestPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// Models
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';

// Pages
import { RunsPage } from '../runs/runs';
import { ItineraryPage } from '../itinerary/itinerary';

// Providers
import { GlobalProvider } from '../../providers/global/global';
import { ManifestProvider } from '../../providers/manifest/manifest';

@IonicPage()
@Component({
  selector: 'page-manifest',
  templateUrl: 'manifest.html',
})
export class ManifestPage {
  itineraries: Itinerary[] = [];
  activeItin: Itinerary = new Itinerary();
  highlightedItin: Itinerary = new Itinerary();
  currentTime: Date = new Date();
  run: Run = {} as Run;
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public global: GlobalProvider,
              private manifestProvider: ManifestProvider) {
              this.run = this.navParams.data.run || {};
              setInterval(() => this.currentTime = new Date(), 500);
  }

  ionViewDidLoad() {
    this.manifestProvider.getItineraries(this.run.id)
                          .subscribe((itins) => this.loadItins(itins));
  }

  loadItins(itins: Itinerary[]) {
    this.itineraries = itins || [];
    if(!this.hasHighlightedItin()) {
      this.activeItin = this.itineraries.find(r => r.pending()) || (new Itinerary());
      this.highlightedItin = this.highlightedItin;
    }
  }

  loadRunList() {
    this.navCtrl.setRoot(RunsPage, { highlightedRun: this.run });
  }

  checkIfActiveItin(itin: Itinerary) {
    return this.hasActiveItin() && itin.sameAs(this.activeItin);
  }

  hasActiveItin() {
    return this.activeItin && this.activeItin.address;
  }

  setActiveItin(itin: Itinerary) {
    this.activeItin = itin;
  }

  checkIfHighlightedItin(itin: Itinerary) {
    return this.hasHighlightedItin() && itin.sameAs(this.highlightedItin);
  }

  hasHighlightedItin() {
    return this.highlightedItin && this.highlightedItin.address;
  }

  setHighlightedItin(itin: Itinerary) {
    this.highlightedItin = itin;
  }

  loadItin(itin: Itinerary) {
    this.setHighlightedItin(itin);
    this.navCtrl.push(ItineraryPage, { itin: itin, run: this.run });
  }

  // Show the info of next/in_progress itin
  getNextItinTitle() {
    if(this.activeItin.in_progress()) {
      return "In Progress: " + this.activeItin.label();
    } else if(this.activeItin.pending()) {
      return "Next: " + this.activeItin.label();
    } 
  }

}
