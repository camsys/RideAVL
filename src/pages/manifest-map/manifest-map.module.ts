import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ManifestMapPage } from './manifest-map';

@NgModule({
  declarations: [
    ManifestMapPage,
  ],
  imports: [
    IonicPageModule.forChild(ManifestMapPage),
  ],
})
export class ManifestMapPageModule {}
