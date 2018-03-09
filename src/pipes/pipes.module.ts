import { NgModule } from '@angular/core';
import { PrettyTimeFromSecondsPipe } from './pretty-time-from-seconds/pretty-time-from-seconds';
import { PhoneNumberPipe } from './phone-number/phone-number';
@NgModule({
	declarations: [
    PrettyTimeFromSecondsPipe,
    PhoneNumberPipe
    ],
	imports: [],
	exports: [
    PrettyTimeFromSecondsPipe,
    PhoneNumberPipe
    ]
})
export class PipesModule {}
