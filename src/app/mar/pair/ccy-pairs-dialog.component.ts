import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ccy } from '../../models/mar/ccy';
import { TableDatasource } from '../../common/table-datasource';
import { ExPair } from '../../models/mar/ex-pair';
import { Result } from '../../models/result';
import { PairService } from '../../services/mar/pair.service';

@Component({
  selector: 'app-ccy-pairs-dialog',
  templateUrl: './ccy-pairs-dialog.component.html',
  styleUrls: ['./ccy-pairs-dialog.component.css']
})
export class CcyPairsDialogComponent implements AfterViewInit {

  @ViewChild(MatTable) table: MatTable<ExPair>;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: TableDatasource<ExPair>;
  baseCcy: string;

  displayedColumns: string[] = ['index', 'concerned', 'baseCcy', 'quoteCcy', 'oeSymbol', 'baSymbol', 'hbSymbol'];

  CoinLogoPath = Ccy.LogoPath;

  constructor(private pairService: PairService,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.dataSource = new TableDatasource<ExPair>();
    this.dataSource.data = data.pairs;
    this.baseCcy = data.baseCcy;
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  toggleConcern(pair: ExPair) {
    const ori = pair.concerned;
    this.pairService.updateConcerned(pair.id, !ori)
      .subscribe((opr: Result) => {
        if (opr.code === Result.CODE_SUCCESS) {
          pair.concerned = !ori;
          this.snackBar.open(ori ? '已取消关注' : '已加入关注');
        }
      });
  }

  static showPairs(dialog: MatDialog, data: { baseCcy: string, pairs: ExPair[] }) {
    return dialog.open(
      CcyPairsDialogComponent, {
        disableClose: true,
        width: '640px',
        data
      });
  }

}
