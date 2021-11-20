import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';


@Pipe({name: 'bignumzh'})
export class BignumZhPipe implements PipeTransform {

  constructor(private dp: DecimalPipe) {
  }

  transform(mon: any): string {
    if (mon === 0) {
      return '0';
    }
    if (!mon) {
      return '';
    }
    let num = +mon;
    let ts = '';
    while (num > 1e8) {
      num /= 1e8;
      ts += '亿';
    }
    if (num > 1e4) {
      num /= 1e4;
      ts = '万' + ts;
    }
    if (ts) {
      ts = ' ' + ts;
    }
    let dn;
    if (num >= 100) {
      dn = 0;
    } else if (num >= 10) {
      dn = 1;
    } else {
      dn = 2;
    }
    const ds = this.dp.transform(num, '1.0-' + dn);
    return `${ds}${ts}`;
  }
}
