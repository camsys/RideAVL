// Angular Imports
import { BrowserModule } from '@angular/platform-browser';
//import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, NgModule } from '@angular/core';
import { Http, HttpModule } from '@angular/http';

// Native imports
import { LaunchNavigator } from '@ionic-native/launch-navigator';

// Environment
import { environment } from './environment';

// Ionic Imports
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

// Third-party Imports
import { MomentModule } from 'angular2-moment';

// Pages
import { MyApp } from './app.component';
import { SignInPage } from '../pages/sign-in/sign-in';
import { ResetPasswordPage } from '../pages/reset-password/reset-password';
import { RunsPage } from '../pages/runs/runs';
import { ManifestPage } from '../pages/manifest/manifest';
import { ItineraryPage } from '../pages/itinerary/itinerary';
import { AboutPage } from '../pages/about/about';

// Providers
import { AuthProvider } from '../providers/auth/auth';
import { GlobalProvider } from '../providers/global/global';
import { RunProvider } from '../providers/run/run';
import { ManifestProvider } from '../providers/manifest/manifest';
import { ItineraryProvider } from '../providers/itinerary/itinerary';

// Components
import { RunInfoComponent } from '../components/run-info/run-info';
import { ItineraryInfoComponent } from '../components/itinerary-info/itinerary-info';

// Pipes
import { PrettyTimeFromSecondsPipe } from '../pipes/pretty-time-from-seconds/pretty-time-from-seconds';
import { PhoneNumberPipe } from '../pipes/phone-number/phone-number';

@NgModule({
  declarations: [
    MyApp,
    SignInPage,
    RunsPage,
    ManifestPage,
    ItineraryPage,
    ResetPasswordPage,
    AboutPage,
    RunInfoComponent,
    ItineraryInfoComponent,
    PrettyTimeFromSecondsPipe,
    PhoneNumberPipe
  ],
  imports: [
    BrowserModule,
    HttpModule,
    MomentModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    SignInPage,
    RunsPage,
    ManifestPage,
    ItineraryPage,
    ResetPasswordPage,
    AboutPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    AuthProvider,
    GlobalProvider,
    RunProvider,
    ManifestProvider,
    ItineraryProvider,
    LaunchNavigator
  ]
})
export class AppModule {}
