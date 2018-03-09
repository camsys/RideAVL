import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

// Models
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';

// Providers
import { GlobalProvider } from '../../providers/global/global';
import { ItineraryProvider } from '../../providers/itinerary/itinerary';

@IonicPage()
@Component({
  selector: 'page-itinerary',
  templateUrl: 'itinerary.html',
})
export class ItineraryPage {
  run: Run = new Run();
  itin: Itinerary = new Itinerary();
  currentTime: Date = new Date();
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public global: GlobalProvider,
              private itinProvider: ItineraryProvider) {
              this.itin = this.navParams.data.itin || {};
              setInterval(() => this.currentTime = new Date(), 500);
  }

  ionViewDidLoad() {
  }

}

