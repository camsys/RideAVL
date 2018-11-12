import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';

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
import { RunProvider } from '../../providers/run/run';
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
              public events: Events,
              public global: GlobalProvider,
              public runProvider: RunProvider,
              private manifestProvider: ManifestProvider) {

              if(this.navParams.data.run) {
                this.run = this.navParams.data.run;
              }

              if(this.navParams.data.itineraries) {
                this.itineraries = this.navParams.data.itineraries;
                if(this.itineraries.length > 0) {
                  this.dataLoaded = true;
                }
              }
              
              setInterval(() => this.currentTime = new Date(), 500);
              setInterval(() => this.updateETA(), global.etaInterval * 1000);
  }

  ionViewDidLoad() {
    this.requestManifest();
  }

  ionViewWillLoad() {
    this.events.unsubscribe("manifest:reload");
    this.events.subscribe("manifest:reload", () => {
      // reload run
      this.runProvider.getRun(this.run.id)
                      .subscribe((run) => {
                        this.run = run;
                        if(!this.run.id) {
                          this.events.publish("app:notification", "Run was removed by dispatcher.");
                          this.loadRunList();
                        }
                      });

      // reload itins
      this.manifestProvider.getItineraries(this.run.id)
                      .subscribe((itins) => {
                        this.loadItins(itins);
                        this.setActiveItin();
                      });
    });
  }

  ionViewDidUnload() {
    this.events.unsubscribe("manifest:reload");
  }

  ionViewWillEnter() {
    this.setActiveItin();
  }

  doRefresh(refresher) {
    this.manifestProvider.getItineraries(this.run.id)
                      .subscribe((itins) => {
                        this.loadItins(itins);
                        this.setActiveItin();
                        refresher.complete();
                      });
  }


  // apply calculated eta_diff in all incomplete itins
  updateETA() {
    if(!this.itineraries) {
      return;
    }

    this.global.updateManifestETA(this.itineraries);
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
    this.activeItin = this.itineraries.find(r => !r.finished()) || (new Itinerary());
  }

  setActiveItin() {
    this.activeItin = this.itineraries.find(r => !r.finished()) || (new Itinerary());
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
