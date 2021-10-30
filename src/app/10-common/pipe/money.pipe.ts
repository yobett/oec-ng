import { Pipe } from '@angular/core';
import { EffectDigitsPipe } from './effect-digits-pipe';


@Pipe({name: 'money'}) // quantity/money sum/price
export class MoneyPipe extends EffectDigitsPipe {

}
