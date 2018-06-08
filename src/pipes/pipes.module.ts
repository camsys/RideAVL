import { NgModule } from '@angular/core';
import { PrettyTimeFromSecondsPipe } from './pretty-time-from-seconds/pretty-time-from-seconds';
import { PhoneNumberPipe } from './phone-number/phone-number';
import { TitleCasePipe } from './title-case/title-case';
@NgModule({
	declarations: [
    PrettyTimeFromSecondsPipe,
    PhoneNumberPipe,
    TitleCasePipe
    ],
	imports: [],
	exports: [
    PrettyTimeFromSecondsPipe,
    PhoneNumberPipe,
    TitleCasePipe
    ]
})
export class PipesModule {}
