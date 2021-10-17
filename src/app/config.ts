import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatDateFormats } from '@angular/material/core';
import { environment } from '../environments/environment';

const PaginatorIntl = new MatPaginatorIntl();
PaginatorIntl.itemsPerPageLabel = '每页条数';
PaginatorIntl.nextPageLabel = '';
PaginatorIntl.previousPageLabel = '';
PaginatorIntl.firstPageLabel = '';
PaginatorIntl.lastPageLabel = '';
PaginatorIntl.getRangeLabel = (page: number,
                               pageSize: number,
                               length: number): string => {
  // let to = (page + 1) * pageSize;
  // return `${page * pageSize + 1} – ${to > length ? length : to} of ${length}`;
  const pages = Math.ceil(length / pageSize);
  return `第 ${page + 1}/${pages} 页`;
};


const DATE_FORMAT = 'YYYY-MM-DD';
const MONTH_PICKER_FORMAT = 'YYYY-MM';

const DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: DATE_FORMAT
  },
  display: {
    dateInput: DATE_FORMAT,
    monthYearLabel: 'YYYY-MM',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY MMMM'
  },
};

// const DEBUG = window?.location?.href?.indexOf('_DEBUG_') > 0 || false;

const LocalStorageKeys = {
  AccessToken: 'access_token',
  StrategiesFilterEx: 'strategies-filterEx',
  StrategiesFilterStatus: 'strategies-filterStatus',
  Notifications: 'notifications' // on/off
};

const StaticResource = {
  BASE: environment.staticBase,
  coinsLogoDir: '/coins'
};

const PlaceOrderRefreshDelay = 6 * 1000;

const StableCoins = ['USDT', 'USDC', 'DAI', 'BUSD'];

export {
  PaginatorIntl,
  DATE_FORMATS,
  DATE_FORMAT,
  MONTH_PICKER_FORMAT,
  // DEBUG,
  StaticResource,
  LocalStorageKeys,
  PlaceOrderRefreshDelay,
  StableCoins
};
