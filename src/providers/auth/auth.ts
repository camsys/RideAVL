import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import { environment } from '../../app/environment';
import { Events } from 'ionic-angular';

// Models
import { Session } from '../../models/session';
import { User } from '../../models/user';

@Injectable()
export class AuthProvider {

  public baseUrl = environment.BASE_RIDEPILOT_URL;
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;
  public defaultHeaders: Headers = new Headers({
    'Content-Type': 'application/json'
  })

  constructor(public http: Http,
              public events: Events) { }

  // Pulls the current session from local storage
  session(): Session {
    return (JSON.parse(localStorage.session || "{}") as Session);
  }

  // Pulls the user object out of the session
  user(): User {
    return this.session().user as User;
  }

  // Sets the local storage session variable to the passed object
  setSession(session: Session): void {
    localStorage.setItem('session', JSON.stringify(session));
  }

  // Returns true/false if user is signed in 
  // If optional User param, checks if that particular user is signed in
  isSignedIn(user?: User): Boolean {
    let session = this.session();
    if(user) {
      return !!(session && session.username && session.username === user.username);
    } else {
      return !!(session && session.username);
    }
  }

  // Constructs a hash of necessary Auth Headers for communicating with RidePilot AVL
  authHeaders(): Headers {
    if(this.isSignedIn()) {
      return new Headers({
        'Content-Type': 'application/json',
        'X-User-Username': this.session().username,
        'X-User-Token': this.session().authentication_token
      });
    } else {
      return this.defaultHeaders;
    }
  }

  // Signs in a user via username and password, storing their token to local storage
  signIn(username: string, password: string): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'driver_sign_in');
    let body = JSON.stringify({user: { username: username, password: password }});
    let options: RequestOptions = new RequestOptions({
      headers: this.defaultHeaders
    });

    return this.http
        .post(uri, body, options)
        .map((response: Response) => {

          // Pull the session hash (user username and auth token) out of the response
          let data = response.json().data;
          let session = data.session || {};

          // Store session info in local storage to keep user logged in
          if(session.username && session.authentication_token) {
            this.setSession(session);
          }

          return response;
        });
  }

  // Removes session from local storage and tells backend to reset the user's token
  signOut(): Observable<Response> {

    // If signed in, remove the item from local storage and make sign out call
    if(this.isSignedIn()) {
      let uri: string = encodeURI(this.baseUrl + 'sign_out');
      let options: RequestOptions = new RequestOptions({
        headers: this.authHeaders()
      });

      localStorage.removeItem('session');
      this.events.publish("user:signed_out");

      return this.http
          .delete(uri, options)
          .map((response: Response) => {
            return response;
          });
    } else { // If not signed in, return an empty observable
      return Observable.of();
    }
  }

  // Resets the password of the provided user (only username required)
  resetPassword(username: string): Observable<Response>{
    let uri: string = encodeURI(this.baseUrl + 'users/reset_password');
    let body = JSON.stringify({user: { username: username }});
    let options: RequestOptions = new RequestOptions({
      headers: this.defaultHeaders
    });

    return this.http
        .post(uri, body, options)
        .map((response: Response) => {
          return response;
        });
  }

  // Updates the session based on a user object
  updateSessionUser(user: User): User {
    let session = this.session();
    session.username = user.username;
    session.user = user;
    this.setSession(session);
    this.events.publish('user:updated', user);  // Publish user updated event for pages to listen to
    return this.user();
  }

}
