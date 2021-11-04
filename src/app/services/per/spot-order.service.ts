import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ModelCurdService } from '../model-curd.service';
import { OrderTimeLineQueryForm, SpotOrder, SpotOrderFilter } from '../../models/per/spot-order';
import { CancelOrderForm, OrderForm, BatchPlaceOrderResult, PlaceOrderResult } from '../../models/per/order-form';
import { ListResult, ValueResult } from '../../models/result';


@Injectable()
export class SpotOrderService extends ModelCurdService<SpotOrder> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/per/spot-orders`;
  }

  getByClientOrderId(clientOrderId: string): Observable<SpotOrder> {
    const url = `${this.baseUrl}/clientOrderId/${clientOrderId}`;
    return super.getOne2(url);
  }

  findByExCcy(ex: string, ccy: string): Observable<SpotOrder[]> {
    return this.list2(`${this.baseUrl}/exCcy/${ex}/${ccy}`);
  }

  findByCcy(ccy: string): Observable<SpotOrder[]> {
    return this.list2(`${this.baseUrl}/ccy/${ccy}`);
  }

  findByBaseQuote(baseCcy: string, quoteCcy: string): Observable<SpotOrder[]> {
    const filter: SpotOrderFilter = {baseCcy, quoteCcy};
    return super.page2(null, filter).pipe(map(cl => cl.list));
  }

  fetchPendingOrders(): Observable<SpotOrder[]> {
    return this.postForList2(this.baseUrl + '/pending/all');
  }

  fetchPendingOrdersFor(ex: string): Observable<SpotOrder[]> {
    return this.postForList2(this.baseUrl + '/pending/ex/' + ex);
  }

  timeLineQuery(form: OrderTimeLineQueryForm): Observable<SpotOrder[]> {
    const url = `${this.baseUrl}/timeLine`;
    const params: any = {limit: form.limit};
    if (form.ex) {
      params.ex = form.ex;
    }
    if (form.olderThan) {
      params.olderThan = form.olderThan;
    }
    return super.list2(url, params);
  }

  placeOrder(form: OrderForm): Observable<PlaceOrderResult> {
    const url = this.baseUrl + '/placeOrder';
    return this.pipeDefault(this.http.post<ValueResult<PlaceOrderResult>>(url, form))
      .pipe(map(result => result.value));
  }

  placeMultiOrders(forms: OrderForm[]): Observable<BatchPlaceOrderResult[]> {
    const url = this.baseUrl + '/placeMultiOrders';
    return this.pipeDefault(this.http.post<ListResult<BatchPlaceOrderResult>>(url, forms))
      .pipe(map(result => result.list));
  }

  cancelOrder(form: CancelOrderForm): Observable<any> {
    const url = this.baseUrl + '/cancelOrder';
    return this.pipeDefault(this.http.post<ValueResult<any>>(url, form))
      .pipe(map(result => result.value));
  }

}
