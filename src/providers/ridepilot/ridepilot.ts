import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { environment } from '../../app/environment'
import { User } from '../../models/user';
import { AuthProvider } from '../../providers/auth/auth';

// RidePilot Provider handles API Calls to the RidePilot Core back-end.
@Injectable()
export class RidepilotProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;

  constructor(public http: Http,
              private auth: AuthProvider,
              public events: Events) {}
              
  // Constructs a request options hash with auth headers
  requestOptions(): RequestOptions {
    return new RequestOptions({ headers: this.auth.authHeaders() });
  }

  // Unpacks a session response and stores the user in the session
  unpackSignInResponse(response): User {
    let user = JSON.parse(response.text()).data.session as User;
    return this.auth.updateSessionUser(user); // store user info in session storage
  }

  // Handle errors by console logging the error, and publishing an error event
  // for consumption by the app's home page.
  private handleError(error: any): any {
    console.error('An error occurred', error, this); // for demo purposes only
    this.events.publish('error:http', error);
    return Observable.empty(); // return an empty observable so subscribe calls don't break
  }
}
