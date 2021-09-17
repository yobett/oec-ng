import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SyncResult, SyncResultGroup } from '../../models/sync-result';
import { BaseService } from '../base.service';
import { Result, ValueResult } from '../../models/result';
import { ExchangePair } from '../../models/mar/ex-pair';


@Injectable()
export class DataSyncService extends BaseService<SyncResult> {

  personalBaseUrl: string;

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/sys/sync`;
    this.personalBaseUrl = this.apiBase + `/sys/sync-pri`;
  }

  protected groupSync(url: string, body?: any): Observable<SyncResultGroup> {
    return this.pipeDefault(this.http.post<ValueResult<SyncResultGroup>>(url, body))
      .pipe(map(result => result.value));
  }

  // public data

  syncCurrencies(limit = 1000): Observable<SyncResult> {
    const url = `${this.baseUrl}/currencies?limit=${limit}`;
    return this.postForResult2(url);
  }

  syncCurrenciesFromPairs(): Observable<SyncResult> {
    const url = `${this.baseUrl}/currencies/from-pairs`;
    return this.postForResult2(url);
  }

  syncPairs(): Observable<SyncResultGroup> {
    const url = `${this.baseUrl}/pairs`;
    return this.groupSync(url);
  }

  syncExPairs(ex: string): Observable<SyncResult> {
    const url = `${this.baseUrl}/pairs/ex/` + ex;
    return this.postForResult2(url);
  }

  // personal data

  syncAssets(): Observable<SyncResultGroup> {
    const url = `${this.personalBaseUrl}/assets`;
    return this.groupSync(url);
  }

  syncExAssets(ex: string): Observable<SyncResult> {
    const url = `${this.personalBaseUrl}/assets/ex/` + ex;
    return this.postForResult2(url);
  }

  // max 3m
  syncOrdersOe(): Observable<SyncResult> {
    const url = `${this.personalBaseUrl}/oe-orders`;
    return this.postForResult2(url);
  }

  // concerned pairs
  syncOrdersBa(): Observable<SyncResult> {
    const url = `${this.personalBaseUrl}/ba-orders/concerned`;
    return this.postForResult2(url);
  }

  // latest 2 days
  syncOrdersHb(): Observable<SyncResult> {
    const url = `${this.personalBaseUrl}/hb-orders/latest2d`;
    return this.postForResult2(url);
  }

  syncOrders(): Observable<SyncResultGroup> {
    const url = `${this.personalBaseUrl}/orders`;
    return this.groupSync(url);
  }

  syncAfterPlacedOrder(exp: ExchangePair): Observable<boolean> {
    const url = this.personalBaseUrl + '/syncAfterPlacedOrder';
    return this.pipeDefault(this.http.post<ValueResult<boolean>>(url, exp))
      .pipe(map(result => result.value));
  }

}
