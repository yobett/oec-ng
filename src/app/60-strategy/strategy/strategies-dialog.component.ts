import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TableDatasource } from '../../10-common/table-datasource';
import { StrategyService } from '../../services/str/strategy.service';
import { BaseQuoteStrategyCounts, Strategy, StrategyFilter } from '../../models/str/strategy';
import { Result } from '../../models/result';
import { Ccy } from '../../models/mar/ccy';
import { StrategyDetailDialogComponent } from './strategy-detail-dialog.component';
import { PairBQ } from '../../models/mar/ex-pair';


interface StrategiesDialogData {
  strategies?: Strategy[];
  pairBQ?: PairBQ;
  side?: 'buy' | 'sell';
  status?: string;
}

interface CountChange extends PairBQ {
  originalRunning: boolean;
  running?: boolean;
  removed?: boolean;
}


@Component({
  selector: 'app-strategies-dialog',
  templateUrl: './strategies-dialog.component.html',
  styleUrls: ['./strategies-dialog.component.css']
})
export class StrategiesDialogComponent implements AfterViewInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Strategy>;

  CoinLogoPath = Ccy.LogoPath;
  getTypeLabel = Strategy.getTypeLabel;

  dataSource: TableDatasource<Strategy>;

  filter: StrategyFilter = {};
  strategyCountChanges = new Map<number, CountChange>();

  processes: { [name: string]: boolean } = {};

  displayedColumns: string[] = ['index', 'baseCcy', 'quoteCcy', 'ex', 'type', 'side',
    'basePoint', 'expectingPercent', 'beyondExpect', 'tradingPoint', 'lastCheckAt', 'status',
    'updateBasePoint', 'autoStartNext', 'executor', /*'createdAt',*/ 'actions'];

  constructor(private strategyService: StrategyService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              public dialogRef: MatDialogRef<StrategiesDialogComponent, BaseQuoteStrategyCounts[]>,
              @Inject(MAT_DIALOG_DATA) public data: StrategiesDialogData) {
    if (data.pairBQ) {
      this.filter.baseCcy = data.pairBQ.baseCcy;
      this.filter.quoteCcy = data.pairBQ.quoteCcy;
    }
    if (data.status) {
      this.filter.status = data.status;
    }
    if (data.side) {
      this.filter.side = data.side;
    }
    this.dataSource = new TableDatasource<Strategy>();
    this.dataSource.setData(data.strategies);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  getCountChange(strategy: Strategy): CountChange {
    let cc = this.strategyCountChanges.get(strategy.id);
    if (!cc) {
      cc = {
        baseCcy: strategy.baseCcy,
        quoteCcy: strategy.quoteCcy,
        originalRunning: strategy.status === 'started'
      }
      this.strategyCountChanges.set(strategy.id, cc);
    }
    return cc;
  }

  start(strategy: Strategy) {
    this.strategyService.setStatus(strategy.id, 'started')
      .subscribe(result => {
        let cc = this.getCountChange(strategy);
        cc.running = true;
        strategy.status = 'started';
        this.snackBar.open('已开始');
      });
  }

  pause(strategy: Strategy) {
    this.strategyService.setStatus(strategy.id, 'paused')
      .subscribe(result => {
        let cc = this.getCountChange(strategy);
        cc.running = false;
        strategy.status = 'paused';
        this.snackBar.open('已暂停');
      });
  }

  clearPeak(strategy: Strategy) {
    this.strategyService.clearPeak(strategy.id)
      .subscribe(result => {
        strategy.peak = null;
        strategy.peakTime = null;
        strategy.valley = null;
        strategy.valleyTime = null;
        strategy.beyondExpect = false;
        this.snackBar.open('已清除峰/谷值');
      });
  }

  execute(strategy: Strategy) {
    this.processes['execute-' + strategy.id] = true;
    this.strategyService.executeStrategy(strategy.id)
      .subscribe((strategy1: Strategy) => {
          this.processes['execute-' + strategy.id] = false;
          let cc = this.getCountChange(strategy);
          cc.running = strategy1.status === 'started';
          Object.assign(strategy, strategy1);
          this.snackBar.open('检查已完成');
        },
        error => this.processes['execute-' + strategy.id] = false,
        () => this.processes['execute-' + strategy.id] = false);
  }

  showDetail(strategy: Strategy) {
    StrategyDetailDialogComponent.showStrategyDetail(this.dialog, strategy);
  }

  remove(strategy: Strategy) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.strategyService.remove(strategy)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.strategyService.showError(opr);
          return;
        }
        let cc = this.getCountChange(strategy);
        cc.removed = true;
        this.dataSource.remove(strategy);
      });
  }

  closeDialog() {
    const scs: BaseQuoteStrategyCounts[] = [];
    if (this.strategyCountChanges.size > 0) {
      const scMap = new Map<string, BaseQuoteStrategyCounts>();
      for (const cc of this.strategyCountChanges.values()) {
        const key = `${cc.baseCcy}-${cc.quoteCcy}`;
        let sc = scMap.get(key);
        if (!sc) {
          sc = {
            baseCcy: cc.baseCcy,
            quoteCcy: cc.quoteCcy,
            running: 0,
            all: 0
          }
          scMap.set(key, sc);
        }
        if (cc.removed) {
          sc.all--;
          if (cc.originalRunning) {
            sc.running--;
          }
        } else {
          if (cc.originalRunning && !cc.running) {
            sc.running--;
          } else if (!cc.originalRunning && cc.running) {
            sc.running++;
          }
        }
      }
    }
    this.dialogRef.close(scs);
  }

  static showStrategies(data: StrategiesDialogData, dialog: MatDialog):
    MatDialogRef<StrategiesDialogComponent, BaseQuoteStrategyCounts[]> {
    return dialog.open(
      StrategiesDialogComponent, {
        disableClose: true,
        width: '100',
        maxWidth: '96vw',
        data
      });
  }

}
