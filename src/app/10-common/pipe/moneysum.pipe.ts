import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';


@Pipe({name: 'moneysum'})
export class MoneySumPipe implements PipeTransform {

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
      return this.dp.transform(money, '1.0-1');
    }
    return this.dp.transform(money, '1.0-2');
  }
}
