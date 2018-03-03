import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the ManifestPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// Models
import { Itinerary } from '../../models/itinerary';

// Providers
import { RidepilotProvider } from '../../providers/ridepilot/ridepilot';

@IonicPage()
@Component({
  selector: 'page-manifest',
  templateUrl: 'manifest.html',
})
export class ManifestPage {
  itineraries: Itinerary[] = [];
  runId: number;
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              private ridepilotProvider: RidepilotProvider) {
    this.runId = null;
  }

  ionViewDidLoad() {
    this.ridepilotProvider.getItineraries(this.runId)
                          .subscribe((itins) => 
                            this.itineraries = itins
                          );
  }

}
