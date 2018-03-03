import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ManifestPage } from './manifest';

@NgModule({
  declarations: [
    ManifestPage,
  ],
  imports: [
    IonicPageModule.forChild(ManifestPage),
  ],
})
export class ManifestPageModule {}
