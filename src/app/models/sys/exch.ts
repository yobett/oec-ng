import {Model} from '../model';

export class Exch extends Model {

  static CODE_BA = 'ba'; // 币安
  static CODE_OE = 'oe'; // 欧易
  static CODE_HB = 'hb'; // 火币

  static DefaultExch = Exch.CODE_BA;

  code: string;
  name: string;
}
