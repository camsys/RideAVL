// Angular Imports
import { BrowserModule } from '@angular/platform-browser';
//import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, NgModule } from '@angular/core';
import { Http, HttpModule } from '@angular/http';
import { Ng2CableModule } from 'ng2-cable';

// Native imports
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { Geolocation } from '@ionic-native/geolocation';
import { Network } from '@ionic-native/network';
import { Insomnia } from '@ionic-native/insomnia';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { BackgroundMode } from '@ionic-native/background-mode';
import { IonicStorageModule } from '@ionic/storage';

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
import { ChatPage } from '../pages/chat/chat';
import { AboutPage } from '../pages/about/about';

// Components
import { RunInfoComponent } from '../components/run-info/run-info';
import { ItineraryInfoComponent } from '../components/itinerary-info/itinerary-info';
import { ChatAlertButtonComponent } from '../components/chat-alert-button/chat-alert-button';

// Pipes
import { PrettyTimeFromSecondsPipe } from '../pipes/pretty-time-from-seconds/pretty-time-from-seconds';
import { PhoneNumberPipe } from '../pipes/phone-number/phone-number';
import { TitleCasePipe } from '../pipes/title-case/title-case';
import {TimeAgoPipe} from 'time-ago-pipe';

// Providers
import { AuthProvider } from '../providers/auth/auth';
import { GlobalProvider } from '../providers/global/global';
import { RunProvider } from '../providers/run/run';
import { ManifestProvider } from '../providers/manifest/manifest';
import { ItineraryProvider } from '../providers/itinerary/itinerary';
import { GpsProvider } from '../providers/gps/gps';
import { GeocodingProvider } from '../providers/geocoding/geocoding';
import { EmergencyProvider } from '../providers/emergency/emergency';
import { ChatProvider } from '../providers/chat/chat';
import { ManifestChangeProvider } from '../providers/manifest-change/manifest-change';
import { ChatAlertProvider } from '../providers/chat-alert/chat-alert';

@NgModule({
  declarations: [
    MyApp,
    SignInPage,
    RunsPage,
    ManifestPage,
    ItineraryPage,
    ResetPasswordPage,
    ChatPage,
    AboutPage,
    RunInfoComponent,
    ChatAlertButtonComponent,
    ItineraryInfoComponent,
    PrettyTimeFromSecondsPipe,
    PhoneNumberPipe,
    TitleCasePipe,
    TimeAgoPipe
  ],
  imports: [
    BrowserModule,
    HttpModule,
    MomentModule,
    Ng2CableModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    SignInPage,
    RunsPage,
    ManifestPage,
    ItineraryPage,
    ResetPasswordPage,
    ChatPage,
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
    GpsProvider,
    GeocodingProvider,
    LaunchNavigator,
    Geolocation,
    Network,
    LocalNotifications,
    Insomnia,
    BackgroundMode,
    EmergencyProvider,
    ChatProvider,
    ManifestChangeProvider,
    ChatAlertProvider
  ]
})
export class AppModule {}
