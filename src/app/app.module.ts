// Angular Imports
import { BrowserModule } from '@angular/platform-browser';
//import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, NgModule } from '@angular/core';
import { Http, HttpModule } from '@angular/http';

// Environment
import { environment } from './environment';

// Ionic Imports
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

// Pages
import { MyApp } from './app.component';
import { SignInPage } from '../pages/sign-in/sign-in';
import { ResetPasswordPage } from '../pages/reset-password/reset-password';
import { RunsPage } from '../pages/runs/runs';
import { ManifestPage } from '../pages/manifest/manifest';
import { AboutPage } from '../pages/about/about';

// Providers
import { AuthProvider } from '../providers/auth/auth';
import { RidepilotProvider } from '../providers/ridepilot/ridepilot';
import { GlobalProvider } from '../providers/global/global';

// Components
import { RunInfoComponent } from '../components/run-info/run-info';
import { ItineraryInfoComponent } from '../components/itinerary-info/itinerary-info';

// Pipes
import { PrettyTimePipe } from '../pipes/pretty-time/pretty-time';

@NgModule({
  declarations: [
    MyApp,
    SignInPage,
    RunsPage,
    ManifestPage,
    ResetPasswordPage,
    AboutPage,
    RunInfoComponent,
    ItineraryInfoComponent,
    PrettyTimePipe
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    SignInPage,
    RunsPage,
    ManifestPage,
    ResetPasswordPage,
    AboutPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    AuthProvider,
    RidepilotProvider,
    GlobalProvider
  ]
})
export class AppModule {}
