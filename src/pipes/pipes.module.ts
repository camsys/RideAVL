import { NgModule } from '@angular/core';
import { PrettyTimePipe } from './pretty-time/pretty-time';
@NgModule({
	declarations: [PrettyTimePipe],
	imports: [],
	exports: [PrettyTimePipe]
})
export class PipesModule {}
