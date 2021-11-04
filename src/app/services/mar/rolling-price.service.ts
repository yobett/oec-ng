import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';

import { PairKline } from '../../models/mar/kline';
import { BaseService } from '../base.service';


@Injectable()
export class RollingPriceService extends BaseService<PairKline> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/mar/rolling24h`;
  }

}
