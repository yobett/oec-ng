import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { Moment } from 'moment';

import { TableDatasource } from '../../common/table-datasource';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { Exch } from '../../models/sys/exch';
import { Ccy } from '../../models/mar/ccy';
import { AssetsStructureComponent } from '../asset/assets-structure.component';
import { AssetSnapshotService } from '../../services/per/asset-snapshot.service';
import { AssetSnapshot } from '../../models/per/asset-snapshot';

@Component({
  selector: 'app-snapshots',
  templateUrl: './snapshots.component.html',
  styleUrls: ['./snapshots.component.css']
})
export class SnapshotsComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<AssetSnapshot>;

  CoinLogoPath = Ccy.LogoPath;

  dataSource: TableDatasource<AssetSnapshot>;
  today = moment().startOf('day');
  snapshotDate: Moment = this.today.clone();
  snapshotHour: number = 0;
  nextDayDisabled = true;

  snapshots: AssetSnapshot[];
  holdingValueSum: number;

  displayedColumns: string[] = ['index', 'ts', 'ccy', 'price', 'holding', 'holdingValue'/*, 'actions'*/];

  $exchs: Observable<Exch[]>;

  constructor(protected sessionService: SessionService,
              private snapshotService: AssetSnapshotService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<AssetSnapshot>();
  }

  protected withSession(user: User) {
    this.refresh();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  refresh() {
    const mm = this.snapshotDate;
    mm.set('hour', this.snapshotHour);
    this.nextDayDisabled = mm.isSameOrAfter(this.today);
    const ts = mm.valueOf();
    this.snapshotService.getSnapshots(ts)
      .subscribe(snapshots => {
        const snapshotAll = snapshots.find(ss => ss.ccy === AssetSnapshot.CcyAll);
        if (snapshotAll) {
          this.holdingValueSum = snapshotAll.holdingValue;
        } else {
          this.holdingValueSum = 0;
        }
        this.snapshots = snapshots.filter(ss => ss.ccy !== AssetSnapshot.CcyAll);
        this.dataSource.setData(this.snapshots);
      });
  }

  previousDay() {
    this.snapshotDate = this.snapshotDate.subtract(1, 'day').clone();
    this.refresh();
  }

  nextDay() {
    this.snapshotDate = this.snapshotDate.add(1, 'day').clone();
    this.refresh();
  }

  showStructure() {
    let mas = this.snapshots;
    if (!mas || mas.length === 0) {
      return;
    }
    const items = mas.map(ma => ({ccy: ma.ccy, holdingValue: ma.holdingValue}));
    AssetsStructureComponent.showAssetsStructureChart(
      this.dialog,
      {items});
  }

}
