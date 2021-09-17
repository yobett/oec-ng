import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';


@Pipe({name: 'money'}) // quantity/money sum/price
export class MoneyPipe implements PipeTransform {

  constructor(private dp: DecimalPipe) {
  }

  transform(mon: any): string {
    if (mon === 0) {
      return '0';
    }
    if (!mon) {
      return '';
    }
    const money = +mon;
    if (money > 1000) {
      return this.dp.transform(money, '1.0-0');
    }
    if (money > 100) {
      return this.dp.transform(money, '1.1-2');
    }
    if (money > 10) {
      return this.dp.transform(money, '1.1-3');
    }
    if (money > 1) {
      return this.dp.transform(money, '1.2-4');
    }
    if (money > 0.1) {
      return this.dp.transform(money, '1.3-5');
    }
    if (money > 0.01) {
      return this.dp.transform(money, '1.4-6');
    }
    if (money > 0.001) {
      return this.dp.transform(money, '1.5-7');
    }
    return this.dp.transform(money, '1.6-11');
  }
}
