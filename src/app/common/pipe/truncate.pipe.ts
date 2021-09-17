import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 25, completeWords = false, ellipsis = '...') {
    if (!value) {
      return '';
    }
    if (value.length <= limit) {
      return value;
    }

    value = value.substr(0, limit);
    if (completeWords) {
      const lsi = value.lastIndexOf(' ');
      if (lsi > 0) {
        value = value.substr(0, lsi);
      }
    }
    if (ellipsis) {
      value += ellipsis;
    }
    return value;
  }
}
