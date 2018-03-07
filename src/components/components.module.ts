import { NgModule } from '@angular/core';
import { ItineraryInfoComponent } from './itinerary-info/itinerary-info';
import { RunInfoComponent } from './run-info/run-info';
@NgModule({
	declarations: [ItineraryInfoComponent,
    RunInfoComponent],
	imports: [],
	exports: [ItineraryInfoComponent,
    RunInfoComponent]
})
export class ComponentsModule {}
