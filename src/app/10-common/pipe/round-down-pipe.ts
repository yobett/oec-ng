import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'rounddown'})
export class RoundDownPipe implements PipeTransform {

  constructor() {
  }

  transform(val: string | number, digits: number = 5): string {
    if (typeof val === 'undefined') {
      return '';
    }
    if (val == null) {
      return '';
    }
    let str: string;
    if (typeof val === 'number') {
      if (isNaN(val)) {
        return '';
      }
      str = '' + val;
    } else {
      if (val === '') {
        return '';
      }
      str = val;
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
    if (di >= digits) {
      return str.substr(0, di);
    }
    if (str.length - 1 <= digits) {
      return str;
    }
    if (!str.startsWith('0.')) {
      return str.substr(0, digits + 1);
    }

    // 0.x
    let fraction = digits;

    // 0.0*x
    for (let i = 2; i < str.length; i++) {
      if (str.charAt(i) === '0') {
        fraction++;
      } else {
        break;
      }
    }
    if (str.length <= fraction + 2) {
      return str;
    }
    return str.substr(0, fraction + 2);
  }
}
