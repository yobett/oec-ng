import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { BaseService } from '../base.service';
import { AssetSnapshot, AssetSnapshotQueryForm } from '../../models/per/asset-snapshot';
import { ListResult, Result } from '../../models/result';
import { map } from 'rxjs/operators';

@Injectable()
export class AssetSnapshotService extends BaseService<AssetSnapshot> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/per/asset-snapshots`;
  }


  getAssetCodes(): Observable<string[]> {
    const url = `${this.baseUrl}/codes`;
    return this.pipeDefault(this.http.get<ListResult<string>>(url))
      .pipe(map(result => {
          if (result.code !== Result.CODE_SUCCESS) {
            this.showError(result);
            return [];
          }
          return result.list;
        })
      );
  }

  query(queryForm: AssetSnapshotQueryForm): Observable<AssetSnapshot[]> {
    const {ccy, limit, olderThan, hourMod} = queryForm;
    const params: any = {limit};
    if (olderThan) {
      params.olderThan = olderThan;
    }
    if (hourMod) {
      params.hourMod = hourMod;
    }
    const url = `${this.baseUrl}/ccy/${ccy}`;
    return super.list2(url, params);
  }

}
