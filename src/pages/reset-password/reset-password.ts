import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';

// Pages
import { SignInPage } from '../sign-in/sign-in';

// Providers
import { AuthProvider } from '../../providers/auth/auth';


@IonicPage()
@Component({
  selector: 'page-reset-password',
  templateUrl: 'reset-password.html',
})
export class ResetPasswordPage {

  username: string;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private auth: AuthProvider,
              private toastCtrl: ToastController) {
  }

  ionViewDidLoad() {
  }

  resetPassword() {
    this.auth.resetPassword(this.username)
             .subscribe(
        data => {
          let email: string = JSON.parse(data.text()).data.email;
          let successToast = this.toastCtrl.create({
            message: `Password reset instructions have been sent to ${email}`,
            position: "top",
            duration: 3000
          });
          successToast.present();

          this.navCtrl.setRoot(SignInPage);
        },
        error => {
          console.error(error);
          let errorToast = this.toastCtrl.create({
            message: "Sorry! An error happened. Please try again later.",
            position: "top",
            duration: 3000
          });
          errorToast.present();
        }
      );
  }

}
