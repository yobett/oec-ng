import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';

import { Exch } from '../../models/sys/exch';
import { ModelCurdService } from '../model-curd.service';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';


@Injectable()
export class ExchService extends ModelCurdService<Exch> {

  $exchs: Observable<Exch[]>;

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/sys/exchs`;
  }

  list2(url: string = null, params?: any): Observable<Exch[]> {
    if (this.$exchs) {
      return this.$exchs;
    }
    this.$exchs = super.list2().pipe(shareReplay());
    return this.$exchs;
  }

}
