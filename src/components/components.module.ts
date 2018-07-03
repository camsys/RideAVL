import { NgModule } from '@angular/core';
import { ItineraryInfoComponent } from './itinerary-info/itinerary-info';
import { RunInfoComponent } from './run-info/run-info';
import { ChatAlertButtonComponent } from './chat-alert-button/chat-alert-button';
@NgModule({
	declarations: [ItineraryInfoComponent,
    RunInfoComponent,
    ChatAlertButtonComponent],
	imports: [],
	exports: [ItineraryInfoComponent,
    RunInfoComponent,
    ChatAlertButtonComponent]
})
export class ComponentsModule {}
