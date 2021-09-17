import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'effectdigits'})
export class EffectDigitsPipe implements PipeTransform {

  constructor() {
  }

  transform(val: string | number, digits: number = 5): string {
    if (typeof val === 'undefined') {
      return '';
    }
    if (val == null) {
      return '';
    }
    if (val === 0) {
      return '0';
    }
    let str: string;
    let num: number;
    if (typeof val === 'number') {
      if (isNaN(val)) {
        return '';
      }
      str = '' + val;
      num = val;
    } else {
      if (val === '') {
        return '';
      }
      str = val;
      num = +val;
    }
    if (/\d[eE]-\d+$/.test(str)) {
      const index = /[eE]-\d+$/.exec(str).index;
      const ns = str.substring(0, index);
      const ep = str.substring(index);
      const nss = this.transform(ns, digits);
      return nss + ep;
    }
    const di = str.indexOf('.');
    if (di === -1) {
      return str;
    }
    if (str.length - 1 <= digits) {
      return str;
    }
    if (!str.startsWith('0.')) {
      let frac = digits - di;
      if (frac < 0) {
        frac = 0;
      }
      return num.toFixed(frac);
    }
    let fraction = digits;
    for (let i = 2; i < str.length; i++) {
      if (str.charAt(i) === '0') {
        fraction++;
      } else {
        break;
      }
    }
    if (fraction > str.length - di - 1) {
      return str;
    }
    return num.toFixed(fraction);
  }
}
