import {Pipe, PipeTransform} from '@angular/core';
import {Model} from '../../models/model';


@Pipe({name: 'dateString'})
export class DateStringPipe implements PipeTransform {

  transform(date: any): string {

    return Model.dateString(date);
  }
}
