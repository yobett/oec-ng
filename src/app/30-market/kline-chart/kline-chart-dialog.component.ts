import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { ThemeService } from '../../services/style/theme.service';
import { KlineQueryForm } from '../../models/mar/kline';
import { ExPair } from '../../models/mar/ex-pair';
import { KlineService } from '../../services/mar/kline.service';
import { KlineChartBaseComponent } from './kline-chart-base.component';

export interface KlineChartData {
  ex: string;
  pair: ExPair;
}

@Component({
  selector: 'app-kline-chart-dialog',
  templateUrl: './kline-chart-dialog.component.html',
  styleUrls: ['./kline-chart-dialog.component.css']
})
export class KlineChartDialogComponent extends KlineChartBaseComponent implements OnInit, AfterViewInit {
  @ViewChild('chart') chartDiv: ElementRef;


  constructor(protected themeService: ThemeService,
              protected klineService: KlineService,
              @Inject(MAT_DIALOG_DATA) public data: KlineChartData) {

    super(themeService, klineService);
    this.queryForm.ex = data.ex;
    this.queryForm.pair = data.pair;

    this.intervals = KlineQueryForm.ExIntervals[this.queryForm.ex];
    this.queryForm.intervalOption = this.intervals.find(it => it.key === KlineQueryForm.IntervalKey15m);
    this.limitOptions = KlineQueryForm.ExLimits[this.queryForm.ex];
  }

  static showKlineChart(dialog: MatDialog, data: KlineChartData) {
    return dialog.open(
      KlineChartDialogComponent, {
        disableClose: true,
        width: '100%',
        maxWidth: '96vw',
        data
      });
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.resetChart();
  }

}
