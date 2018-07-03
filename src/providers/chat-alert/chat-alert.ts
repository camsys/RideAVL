import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { RequestOptions } from '@angular/http';
import { Events } from 'ionic-angular';

import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/map';

import { Ng2Cable, Broadcaster } from 'ng2-cable';

import { environment } from '../../app/environment'

// Providers
import { AuthProvider } from '../../providers/auth/auth';
import { GlobalProvider } from '../../providers/global/global';

// ChatAlertProvider notifies new chat message via web socket
@Injectable()
export class ChatAlertProvider {
  public baseAvlUrl = environment.BASE_RIDEPILOT_AVL_URL;
  public baseActionCableUrl = environment.ACTION_CABLE_HOST;
  public connected:boolean = false;
  private newMessageEvent:any;
  private dismissMessageEvent:any;

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
    this.ngcable.subscribe(url, 'ChatAlertChannel', {
      run_id: this.global.getRunId(),
    });
    this.connected = true;

    this.newMessageEvent = this.broadcaster.on<string>('NewChat').subscribe(
      (data: any) => {
        if(this.global.user.id != data.sender_id) {
          this.events.publish("chat:alert");
        }
      }
    );

    this.dismissMessageEvent = this.broadcaster.on<string>('DismissChatAlert').subscribe(
      (data: any) => {
        if(this.global.user.id == data.read_by_id) {
          this.events.publish("chat:dismiss_alert");
        }
      }
    );
  }

  disconnect() {
    if(this.newMessageEvent) {
      this.newMessageEvent.unsubscribe();
    }

    if(this.dismissMessageEvent) {
      this.dismissMessageEvent.unsubscribe();
    }
    if(this.connected) {
      this.ngcable.unsubscribe();
      this.connected = false;
    }
  }

  dismiss(message_id): Observable<Response> {
    let uri: string = encodeURI(this.baseAvlUrl + 'messages/read_message');
    let body = JSON.stringify({
      read_by_id: this.global.user.id,
      run_id: this.global.getRunId(),
      message_id: message_id
    });

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