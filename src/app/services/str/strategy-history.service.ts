import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';

import { ModelCurdService } from '../model-curd.service';
import { StrategyHistory } from '../../models/str/strategy-history';


@Injectable()
export class StrategyHistoryService extends ModelCurdService<StrategyHistory> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/str/hist-strategies`;
  }

}
