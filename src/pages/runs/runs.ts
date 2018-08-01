import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';

/**
 * Generated class for the RunsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// Models
import { Run } from '../../models/run';

// Pages
import { ManifestPage } from '../manifest/manifest';

// Providers
import { RunProvider } from '../../providers/run/run';

@IonicPage()
@Component({
  selector: 'page-runs',
  templateUrl: 'runs.html',
})
export class RunsPage {
  dataLoaded: Boolean = false;
  runs: Run[] = [];

  highlightedRun: Run = {} as Run;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public events: Events,
              private runProvider: RunProvider) {

              if(this.navParams.data.runs) {
                this.runs = this.navParams.data.runs;
                if(this.runs.length > 0) {
                  this.dataLoaded = true;
                }
              }

              if(this.navParams.data.highlightedRun) {
                this.highlightedRun = this.navParams.data.highlightedRun;
              }
  }

  doRefresh(refresher) {
    this.runProvider.loadDriverRunData().subscribe();
    this.runProvider.getRuns()
                      .subscribe((runs) => {
                        this.loadRuns(runs);
                        refresher.complete();
                      });
  }

  ionViewDidLoad() {
    if(!this.dataLoaded) {
      console.log('loading runs...');
      this.runProvider.getRuns()
                      .subscribe((runs) => this.loadRuns(runs));
    }
  }

  ionViewWillLoad() {
    this.events.unsubscribe("runs:reload");
    this.events.subscribe("runs:reload", () => {
      this.runProvider.getRuns()
                      .subscribe((runs) => {
                        this.loadRuns(runs);
                      });
    });
  }

  ionViewDidUnload() {
    this.events.unsubscribe("runs:reload");
  }

  loadRuns(runs: Run[]) {
    this.dataLoaded = true;
    this.runs = runs || [];
    if(!this.hasHighlightedRun()) {
      this.highlightedRun = this.runs.find(r => !r.completed()) || (new Run());
    }
  }

  setHighlightedRun(run: Run) {
    this.highlightedRun = run;
  }

  checkIfHighlightedRun(run: Run) {
    return this.hasHighlightedRun() && (run === this.highlightedRun || run.id == this.highlightedRun.id);
  }

  hasHighlightedRun() {
    return this.highlightedRun && this.highlightedRun.id;
  }

  loadManifest(run: Run) {
    this.setHighlightedRun(run);
    this.navCtrl.setRoot(ManifestPage, {run: run, runs: this.runs});
  }

}
