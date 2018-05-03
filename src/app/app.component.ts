import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import {Observable} from 'rxjs/Rx';
import { Nav, Platform, Events, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

// PAGES
import { SignInPage } from '../pages/sign-in/sign-in';
import { RunsPage } from '../pages/runs/runs';
import { ManifestPage } from '../pages/manifest/manifest';
import { AboutPage } from '../pages/about/about';

// MODELS
import { User } from '../models/user';
import { PageModel } from '../models/page';

// PROVIDERS
import { GlobalProvider} from '../providers/global/global';
import { AuthProvider } from '../providers/auth/auth';
import { RunProvider } from '../providers/run/run';
import { GpsProvider } from '../providers/gps/gps';

// NATIVE
import { Network } from '@ionic-native/network';

@Component({
  templateUrl: 'app.html'
})

export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = SignInPage;
  showSpinner: Boolean = false;
  wasOffline: Boolean = false;

  signedInPages: PageModel[];
  universalPages: PageModel[]; //Pages for both signed in and signed out users
  signInPage: PageModel;
  user: User;

  constructor(public platform: Platform,
              public statusBar: StatusBar,
              public splashScreen: SplashScreen,
              public global: GlobalProvider,
              private auth: AuthProvider,
              private gps: GpsProvider,
              private runProvider: RunProvider,
              private changeDetector: ChangeDetectorRef,
              private network: Network,
              public events: Events,
              private toastCtrl: ToastController) {

    this.initializeApp();

    this.initializeEvents();
  }

  // define global events
  initializeEvents() {
    // When a server error occurs, show an error message and return to the home page.
    this.events.subscribe("error:http", (error) => {
      this.handleError(error);
    });

    // init app data
    this.events.subscribe("app:init", () => {
      console.log('init app data...');
      this.loadDriverRunData();
    });

    // listen to gps ping request
    this.events.subscribe("gps:start", () => {
      this.startGpsTracking();
    });

    // listen to stopping gps ping request
    this.events.subscribe("gps:stop", () => {
      this.stopGpsTracking();
    });

    // network connect/disconnect
    this.registerNetworkEvents();
  }

  // Handles errors based on their status code
  handleError(error) {

    switch(error.status) {
      case 401: // Unauthorized--sign user out and send to sign in page
        console.error("USER TOKEN EXPIRED");
        this.signOut();
        this.nav.setRoot(SignInPage);
        this.showToast('Please sign in again.');
        break;
      case 503:
        this.showToast('Sorry. Service unavailable. Please check your internet connection.');
        break;
      default:
        this.goHome();
        this.showToast('Sorry. An error happened.');
        break;
    }

    this.events.publish('spinner:hide'); // stop the spinner once we're back on the home page
  }

  // Shows an error toast at the top of the screen for 3 sec, with the given message
  showToast(message: string) {
    let errorToast = this.toastCtrl.create({
      message: message,
      position: 'top',
      duration: 3000
    });
    errorToast.present();

    return errorToast;
  }

  registerNetworkEvents() {
    // watch network for a disconnect
    this.network.onDisconnect().subscribe(() => {
      this.wasOffline = true;
      this.showToast("Network disconnected.");
    });

    // watch network for a connection
    this.network.onConnect().subscribe(() => {
      if(this.wasOffline) {
        this.wasOffline = false;
        this.showToast("Network connected.");
      }
    });
  }

  initializeApp() {

    this.statusBar.styleDefault();
    this.splashScreen.hide();

    // Set up the page links for the sidebar menu
    this.setMenu();

    // Set up the spinner div
    this.setupSpinner();

    this.platform.ready().then(() => {
      // go to home screen
      this.goHome();

      // check app network state
      setTimeout(() => {
        if (this.network.type === 'none') {
          this.showToast("No network access.");
        }
      }, 3000);
    });
  }

  // Set up the menu with pages for signed in and signed out scenarios
  setMenu(){
    // Pages to display if user is signed in
    this.signedInPages = [
      //{ title: 'Runs for Today', component: RunsPage},
      { title: 'Sign Out', component: "sign_out"},
      { title: 'About This App', component: AboutPage }
    ] as PageModel[];

    this.signInPage = { title: 'Sign In', component: SignInPage} as PageModel;
  }

  // Open the appropriate page, or do something special for certain pages
  openPage(page) {
    switch(page.component) {
      case "sign_out":
        this.signOut();
        break;
      default:
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        this.nav.push(page.component, page.params);
    }
  }

  // Check if we're already at the home page; if not, go there.
  goHome() {
    if(this.auth.isSignedIn()) {
      if((this.nav.getActive() && this.nav.getActive().name) !== "RunsPage") {
        this.nav.setRoot(RunsPage); 
      }
      this.events.publish('app:init');
      this.events.publish('gps:start');
    } else {
      this.nav.setRoot(SignInPage);
    }
  }

  signOut() {
    this.auth.signOut()
    .subscribe(
      data => {
        this.onSignOut();
      },
      error => {
        console.error('Error Signing Out');
        this.onSignOut();
      }
    );
  }

  onSignOut() {
    this.nav.setRoot(SignInPage);
    this.setMenu();
    this.events.publish('gps:stop');
  }

  // load app data
  loadDriverRunData() {
    this.runProvider.loadDriverRunData()
      .subscribe(); 
  }

  startGpsTracking() {
    this.gps.startTracking();
  }

  stopGpsTracking() {
    this.gps.stopTracking();
  }

  // Subscribe to spinner:show and spinner:hide events that can be published by child pages
  setupSpinner() {
    this.events.subscribe('spinner:show', () => {
      this.showSpinner = true;
      this.changeDetector.markForCheck(); // Makes sure spinner doesn't lag
    });
    this.events.subscribe('spinner:hide', () => {
      this.showSpinner = false;
      this.changeDetector.detectChanges(); // Makes sure spinner doesn't lag
    });
  }

}

