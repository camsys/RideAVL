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
  dataLoaded: Boolean = false;
  itineraries: Itinerary[] = [];
  activeItin: Itinerary = new Itinerary();
  nextItin: Itinerary = new Itinerary();
  currentTime: Date = new Date();
  run: Run = {} as Run;
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public global: GlobalProvider,
              private manifestProvider: ManifestProvider) {
              this.run = this.navParams.data.run || (new Run());
              this.itineraries = this.navParams.data.itineraries || [];
              if(this.itineraries && this.itineraries.length > 0) {
                this.dataLoaded = true;
              }
              setInterval(() => this.currentTime = new Date(), 500);
  }

  ionViewDidLoad() {
    console.log('loading manifest...');
    this.requestManifest();
  }

  ionViewWillEnter() {
    console.log('entering manifest screen...');
    this.activeItin = this.itineraries.find(r => (r.pending() || r.in_progress())) || (new Itinerary());
  }

  requestManifest() {
    if(!this.dataLoaded) {
      this.manifestProvider.getItineraries(this.run.id)
                          .subscribe((itins) => this.loadItins(itins));
    }
  }

  loadItins(itins: Itinerary[]) {
    this.dataLoaded = true;
    this.itineraries = itins || [];
    this.activeItin = this.itineraries.find(r => (r.pending() || r.in_progress())) || (new Itinerary());
  }

  loadRunList() {
    this.navCtrl.setRoot(RunsPage);
  }

  loadItin(itin: Itinerary) {
    this.navCtrl.setRoot(ItineraryPage, { itin: itin, run: this.run, active: (this.activeItin == itin), itins: this.itineraries});
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
