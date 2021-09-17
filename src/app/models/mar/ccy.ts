import { Model } from '../model';
import { StaticResource } from '../../config';

export class Ccy extends Model {

  code: string;

  slug: string;

  name: string;

  nameZh: string;

  logoPath: string;

  concerned: boolean;

  // cmc rank
  no: number;

  static LogoPath(code: string): string {
    return `${StaticResource.BASE}${StaticResource.coinsLogoDir}/${code}.png`;
  }
}

export class CcyFilter {
  code: string;
  name: string;
  concerned: boolean;
}
