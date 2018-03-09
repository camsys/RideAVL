import { Component } from '@angular/core';
import {  IonicPage,
          NavController,
          NavParams,
          ToastController,
          Toast} from 'ionic-angular';

// Pages
import { RunsPage } from '../runs/runs';
import { ManifestPage } from '../manifest/manifest';
import { ResetPasswordPage } from '../reset-password/reset-password';

// Providers
import { AuthProvider } from '../../providers/auth/auth';

// Models
import { User } from '../../models/user';

@IonicPage()
@Component({
  selector: 'page-sign-in',
  templateUrl: 'sign-in.html',
})
export class SignInPage {

  user: User = { username: null, password: null } as User;
  signInSubscription: any;
  errorToast: Toast;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private authProvider: AuthProvider,
              private toastCtrl: ToastController) {
    this.errorToast = this.toastCtrl.create({});
  }

  signIn() {
    this.authProvider
        .signIn(this.user.username, this.user.password)
        .subscribe(
          data => {
            // Get the user's profile data and store it in the session
            this.authProvider.unpackSignInResponse(data);
            // Then, redirect the user to the home page
            this.navCtrl.setRoot(RunsPage);
          },
          error => {
            // On failed response, display a pop-up error message and remain on page.
            console.error(error.json().data.errors);
            let errorBody = error.json().data.errors;
            console.log(errorBody);

            this.errorToast.dismissAll();

            let errorToast = this.toastCtrl.create({
              message: "Invalid username or password.",
              position: "top",
              duration: 3000
            });
            errorToast.present();
          }
        );
  }

  resetPassword() {
    this.navCtrl.push(ResetPasswordPage);
  }

}
