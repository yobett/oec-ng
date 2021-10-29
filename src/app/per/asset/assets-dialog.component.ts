import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { Ccy } from '../../models/mar/ccy';
import { TableDatasource } from '../../common/table-datasource';
import { Asset } from '../../models/per/asset';
import { AssetService } from '../../services/per/asset.service';

class Asset2 extends Asset {
  available: number;
  availableValue?: number;
}


@Component({
  selector: 'app-assets-dialog',
  templateUrl: './assets-dialog.component.html',
  styleUrls: ['./assets-dialog.component.css']
})
export class AssetsDialogComponent implements AfterViewInit {

  @ViewChild(MatTable) table: MatTable<Asset2>;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: TableDatasource<Asset2>;

  assets: Asset2[];
  availableValueThreshold = 10; // $

  displayedColumns: string[] = ['index', 'ex', 'ccy', 'price', 'available', 'availableValue'];

  CoinLogoPath = Ccy.LogoPath;

  constructor(public dialogRef: MatDialogRef<AssetsDialogComponent, number>,
              @Inject(MAT_DIALOG_DATA) public data: { assets: Asset[], threshold: number }) {
    if (data.threshold) {
      this.availableValueThreshold = data.threshold;
    }
    this.assets = data.assets.map(asset => {
      let available: number = asset.holding - asset.frozen;
      if (available <= 0) {
        return null;
      }
      let availableValue: number;
      if (typeof asset.holdingValue !== 'undefined'
        && typeof asset.frozenValue !== 'undefined') {
        availableValue = asset.holdingValue - asset.frozenValue;
        if (availableValue < this.availableValueThreshold) {
          return null;
        }
      }
      return {...asset, available, availableValue} as Asset2
    }).filter(a => a);
    this.dataSource = new TableDatasource<Asset2>();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
    this.dataSource.setData(this.assets);
  }

  static showCurrentAssets(assetService: AssetService,
                           dialog: MatDialog,
                           threshold = 10): void {

    assetService.list2(null, {filterValue: threshold})
      .subscribe(assets => {
        dialog.open(
          AssetsDialogComponent, {
            disableClose: true,
            width: '500px',
            maxWidth: '96vw',
            data: {assets, threshold}
          });
      });
  }

}
