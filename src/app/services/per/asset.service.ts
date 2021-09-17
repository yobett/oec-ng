import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { ModelCurdService } from '../model-curd.service';
import { Asset } from '../../models/per/asset';


@Injectable()
export class AssetService extends ModelCurdService<Asset> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/per/assets`;
  }

  list2ForEx(ex: string, params?: any): Observable<Asset[]> {
    const url = `${this.baseUrl}/ex/${ex}`;
    return super.list2(url, params);
  }

  findByCcys(ex: string, ccy1: string, ccy2: string): Observable<Asset[]> {
    const url = `${this.baseUrl}/ebq/${ex}/${ccy1}/${ccy2}`;
    return super.list2(url);
  }
}
