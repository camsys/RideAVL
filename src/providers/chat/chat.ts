import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { Ng2Cable, Broadcaster } from 'ng2-cable';

import { environment } from '../../app/environment'

// Models

// Providers
import { AuthProvider } from '../../providers/auth/auth';
import { GlobalProvider } from '../../providers/global/global';

// ChatProvider handles chats to dispatcher via websockets using actioncable
@Injectable()
export class ChatProvider {
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;
  public baseActionCableUrl = environment.ACTION_CABLE_HOST;
  public connected:boolean = false;

  constructor(public http: Http,
              private auth: AuthProvider,
              private global: GlobalProvider,
              public events: Events,
              private ngcable: Ng2Cable,
              private broadcaster: Broadcaster) {}
              
  // Constructs a request options hash with auth headers
  requestOptions(): RequestOptions {
    return new RequestOptions({ headers: this.auth.authHeaders() });
  }

  getActionCableUrl() {
    let session = this.auth.session();
    return this.baseActionCableUrl + "?username=" + session.username + "&authentication_token=" + session.authentication_token;
  }

  connect() {
    let url = this.getActionCableUrl();
    this.ngcable.subscribe(url, 'ChatChannel', {
      provider_id: this.global.user.provider_id,
      driver_id: this.global.user.driver_id
    });
    this.connected = true;

    this.broadcaster.on<string>('CreateMessage').subscribe(
      (data) => {
        //TODO: show message 
        console.log(data);
      }
    );
  }

  disconnect() {
    this.ngcable.unsubscribe();
    this.connected = false;
  }

  create(): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + '/send_routine_message');
    let body = JSON.stringify({});

    return this.http
        .post(uri, body, this.requestOptions())
        .map((response) => {
          return response;
        })
        .catch((error: Response) =>  this.handleError(error));
  }

  // Handle errors by console logging the error, and publishing an error event
  // for consumption by the app's home page.
  private handleError(error: Response | any): Observable<any> {
    console.error('An error occurred', error, this); // for demo purposes only
    //this.events.publish('error:http', error);
    return Observable.empty(); // return an empty observable so subscribe calls don't break
  }
}