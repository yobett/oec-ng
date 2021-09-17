import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';


@Pipe({name: 'rawpercent'})
export class RawPercentPipe implements PipeTransform {

  constructor(private dp: DecimalPipe) {
  }

  transform(p: any): string {
    if (!p) {
      return '';
    }
    const text = this.dp.transform(+p, '1.0-2');
    if (text) {
      return text + '%';
    }
    return '';
  }
}
