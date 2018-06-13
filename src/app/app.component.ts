import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import {Observable} from 'rxjs/Rx';
import { Nav, Platform, Events, AlertController, ToastController } from 'ionic-angular';

// NATIVE
import { Network } from '@ionic-native/network';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Insomnia } from '@ionic-native/insomnia';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { BackgroundMode } from '@ionic-native/background-mode';

// PAGES
import { SignInPage } from '../pages/sign-in/sign-in';
import { RunsPage } from '../pages/runs/runs';
import { ChatPage } from '../pages/chat/chat';
import { AboutPage } from '../pages/about/about';

// MODELS
import { User } from '../models/user';
import { PageModel } from '../models/page';

// PROVIDERS
import { GlobalProvider} from '../providers/global/global';
import { AuthProvider } from '../providers/auth/auth';
import { RunProvider } from '../providers/run/run';
import { GpsProvider } from '../providers/gps/gps';
import { EmergencyProvider } from '../providers/emergency/emergency';
import { ManifestChangeProvider } from '../providers/manifest-change/manifest-change';

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
              public insomnia: Insomnia,
              public global: GlobalProvider,
              private auth: AuthProvider,
              private gps: GpsProvider,
              private runProvider: RunProvider,
              private emergencyProvider: EmergencyProvider,
              private manifestChangeProvider: ManifestChangeProvider,
              private changeDetector: ChangeDetectorRef,
              private network: Network,
              private localNotifications: LocalNotifications,
              private backgroundMode: BackgroundMode,
              public events: Events,
              private toastCtrl: ToastController,
              private alertCtrl: AlertController) {

    this.initializeApp();

    this.initializeEvents();
  }

  // define global events
  initializeEvents() {
    // When a server error occurs, show an error message and return to the home page.
    this.events.subscribe("error:http", (error) => {
      this.handleError(error);
    });

    // toast events
    this.events.subscribe('app:toast', (text) => {
      this.showToast(text);
    });

    // network connect/disconnect
    this.registerNetworkEvents();

    // init app data
    this.events.subscribe("app:init", () => {
      // events after signed in
      this.registerDriverEvents();  

      this.loadDriverRunData(true, false); 
    });
  }

  notifyDriver(text) {
    this.localNotifications.requestPermission().then((permission) => {
      this.localNotifications.schedule({
         id: 1,
         text: text,
         vibrate: true,
         launch: true,
         autoClear: true
      });
    });
  }

  presentAlert(text) {
    let alert = this.alertCtrl.create({
      title: 'Alert',
      subTitle: text,
      buttons: ['Dismiss']
    });
    alert.present();
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

  // Shows a toast at the top of the screen for 3 sec, with the given message
  showToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      position: 'top',
      duration: 3000
    });
    toast.present();

    return toast;
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

  registerDriverEvents() {

    // start checking manifest change periodically
    this.events.subscribe("manifest:change", (run_id) => {
      this.fireManifestChangeEvents(run_id);
    });

    // listen to gps ping request
    this.events.subscribe("gps:start", () => {
      this.startGpsTracking();
    });

    // listen to stopping gps ping request
    this.events.subscribe("gps:stop", () => {
      this.stopGpsTracking();
    });

    // turn on emergency alert
    this.events.subscribe("emergency:on", () => {
      this.turnOnEmergency();
    });

    // turn off emergency alert
    this.events.subscribe("emergency:off", () => {
      this.turnOffEmergency();
    });

    // notification events
    this.events.subscribe('app:notification', (text) => {
      if(this.platform.is('cordova')) {
        this.notifyDriver(text);
      }

      this.presentAlert(text);
    });
  }

  unregisterDriverEvents() {
    this.events.unsubscribe("manifest:change");
    this.events.unsubscribe("gps:start");
    this.events.unsubscribe("gps:stop");
    this.events.unsubscribe("emergency:on");
    this.events.unsubscribe("emergency:off");
    this.events.unsubscribe("app:notification");
  }

  initializeApp() {

    // Set up the page links for the sidebar menu
    this.setMenu();

    // Set up the spinner div
    this.setupSpinner();

    // enable background mode
    this.backgroundMode.enable();

    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.insomnia.keepAwake()
        .then(
          () => console.log("keep awake"),
          () => console.log("failed to keep awake")
        );

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
      { title: 'Chat', component: ChatPage},
      { title: 'Emergency', component: "emergency"},
      { title: 'About This App', component: AboutPage },
      { title: 'Sign Out', component: "sign_out"}
    ] as PageModel[];

    this.signInPage = { title: 'Sign In', component: SignInPage} as PageModel;
  }

  // Open the appropriate page, or do something special for certain pages
  openPage(page) {
    switch(page.component) {
      case "sign_out":
        this.signOut();
        break;
      case "emergency":
        this.sendEmergencyAlert();
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
    this.manifestChangeProvider.disconnect();
    this.unregisterDriverEvents();

    this.nav.setRoot(SignInPage);
    this.setMenu();
  }

  // load app data
  loadDriverRunData(init_emergency, check_current_dest_change) {
    let prevActiveItin = this.global.activeItin;

    this.runProvider.loadDriverRunData()
      .subscribe(() => {
        if(init_emergency) {
          this.events.publish('emergency:on');
        }

        // active itin changed
        if(check_current_dest_change) {
          if((prevActiveItin && !this.global.activeItin) || (!prevActiveItin && this.global.activeItin) || ( prevActiveItin && this.global.activeItin && prevActiveItin.id != this.global.activeItin.id)) {
            this.events.publish("app:notification", "Your current destination has changed. Please re-route.");
          }
        }
      }); 
  }

  startGpsTracking() {
    this.gps.startTracking();
  }

  stopGpsTracking() {
    this.gps.stopTracking();
  }

  turnOnEmergency() {
    this.emergencyProvider.connect();
  }

  turnOffEmergency() {
    this.emergencyProvider.disconnect();
  }

  sendEmergencyAlert() {
    this.emergencyProvider.trigger().subscribe();
  }

  fireManifestChangeEvents(run_id) {
    if(!this.global.activeRun || this.global.activeRun.id != run_id) {
      return;
    }

    this.loadDriverRunData(false, true);

    let activePageName = this.nav.getActive().name;

    if(activePageName == "RunsPage") {
      this.events.publish("runs:reload");
    } else if(activePageName == "ManifestPage") {
      this.events.publish("manifest:reload");
    } else if(activePageName == "ItineraryPage") {
      this.events.publish("itinerary:reload");
    } 
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

