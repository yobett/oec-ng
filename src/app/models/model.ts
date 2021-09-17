import * as moment from 'moment';
import {Moment} from 'moment';

import {DATE_FORMAT} from '../config';

export class Model {

  id?: number;
  createdAt?: string;


  static createdTime(model: Model): Date {
    if (!model) {
      return null;
    }
    if (model.createdAt) {
      return new Date(model.createdAt);
    }
    return null;
  }

  static createdTimeString(model: Model, precise: string = 'date'): string {
    const ct = Model.createdTime(model);
    if (!ct) {
      return '';
    }
    return Model._timeString(ct, precise);
  }

  private static _timeString(date: Date | Moment | string, precise: string = 'date'): string {
    if (!date) {
      return '';
    }
    let format = DATE_FORMAT;
    if (precise === 'minute' || precise === 'time') {
      format += ' HH:mm';
    } else if (precise === 'second') {
      format += ' HH:mm:ss';
    }
    let dz;
    if (date.constructor.name === 'Moment' || date['_isAMomentObject'] === true) {
      dz = date as Moment;
    } else {
      dz = moment(date);
    }
    dz.utcOffset(8);
    return dz.format(format);
  }

  static dateString(date: Date | Moment | string): string {
    return Model._timeString(date);
  }

  static timeString(date: Date | Moment | string): string {
    return Model._timeString(date, 'time');
  }

  static timeTStringHms(date: Date | Moment | string): string {
    return Model._timeString(date, 'second');
  }


}
