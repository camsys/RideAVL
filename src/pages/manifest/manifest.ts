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

// Providers
import { GlobalProvider } from '../../providers/global/global';
import { RidepilotProvider } from '../../providers/ridepilot/ridepilot';

@IonicPage()
@Component({
  selector: 'page-manifest',
  templateUrl: 'manifest.html',
})
export class ManifestPage {
  itineraries: Itinerary[] = [];
  activeItin: Itinerary = {} as Itinerary;
  run: Run = {} as Run;
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public global: GlobalProvider,
              private ridepilotProvider: RidepilotProvider) {
              this.run = this.navParams.data.run || {};
  }

  ionViewDidLoad() {
    this.ridepilotProvider.getItineraries(this.run.id)
                          .subscribe((itins) => 
                            this.itineraries = itins
                          );
  }

  loadRunList() {
    this.navCtrl.setRoot(RunsPage, { activeRun: this.run });
  }

  loadItinerary() {

  }

  setActiveItinerary(itin: Itinerary) {
    this.activeItin = itin;
  }

}
