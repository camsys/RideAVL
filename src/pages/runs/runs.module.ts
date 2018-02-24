import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RunsPage } from './runs';

@NgModule({
  declarations: [
    RunsPage,
  ],
  imports: [
    IonicPageModule.forChild(RunsPage),
  ],
})
export class RunsPageModule {}
