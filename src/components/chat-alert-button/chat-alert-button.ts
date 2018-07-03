import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ChatPage } from '../../pages/chat/chat';

import { GlobalProvider } from '../../providers/global/global';

/**
 * Generated class for the ChatAlertComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'chat-alert-button',
  templateUrl: 'chat-alert-button.html'
})
export class ChatAlertButtonComponent {

  constructor(public navCtrl: NavController,
              private global: GlobalProvider) {
  }

  showChatAlert() {
    return this.global.showChatAlert;
  }

  openChat() {
    this.navCtrl.push(ChatPage);
  }

}
