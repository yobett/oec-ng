import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ECharts, EChartsOption, init as echartsInit } from 'echarts';

import { ThemeService } from '../../services/style/theme.service';
import { ExchService } from '../../services/sys/exch.service';
import { IntervalOption, Kline, KlineDataHolder, KlineQueryForm } from '../../models/mar/kline';
import { ExPair } from '../../models/mar/ex-pair';
import { PairService } from '../../services/mar/pair.service';
import { KlineService } from '../../services/mar/kline.service';
import { Ccy } from '../../models/mar/ccy';

export interface KlineChartData {
  ex: string;
  pair: ExPair;
}

@Component({
  selector: 'app-kline-chart-dialog',
  templateUrl: './kline-chart-dialog.component.html',
  styleUrls: ['./kline-chart-dialog.component.css']
})
export class KlineChartDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('chart') chartDiv: ElementRef;
  chart: ECharts;
  chartInitialized = false;

  chartWidth = '100%';
  chartHeight = 400;

  CoinLogoPath = Ccy.LogoPath;

  transparentBackground = false;
  lightBackgroundColor = '#FAFAFA'; // #FAFAFA, white
  darkBackgroundColor = '#333'; // #404040, #333, black
  chartDarkTheme: boolean;

  queryForm: KlineQueryForm = new KlineQueryForm();
  intervals: IntervalOption[];
  limitOptions: number[];

  currentForm: KlineQueryForm;
  currentData: Kline[];
  dataHolder: KlineDataHolder = new KlineDataHolder();

  windowWidth: number;
  resetChartHandler: ReturnType<typeof setTimeout>;

  processes: { [name: string]: boolean } = {};

  constructor(private themeService: ThemeService,
              private exchService: ExchService,
              private pairService: PairService,
              private klineService: KlineService,
              public dialogRef: MatDialogRef<KlineChartDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: KlineChartData) {
    this.queryForm.ex = data.ex;
    this.queryForm.pair = data.pair;

    this.chartDarkTheme = this.themeService.currentTheme.darkTheme;
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

  intervalSelected(option: IntervalOption) {
    const queryForm = this.queryForm;
    queryForm.intervalOption = option;
    if (queryForm.ex && queryForm.pair) {
      this.loadData();
    }
  }

  ngAfterViewInit() {
    this.resetChart();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (this.windowWidth === window.innerWidth) {
      return;
    }
    this.windowWidth = window.innerWidth;
    if (!this.chartInitialized) {
      return;
    }
    if (this.resetChartHandler) {
      clearTimeout(this.resetChartHandler);
    }
    this.resetChartHandler = setTimeout(() => {
      this.resetChart();
    }, 200);
  }

  private onDataLoaded(form: KlineQueryForm, klines: Kline[]) {
    // console.log('klines: ' + klines.length);

    this.currentData = this.dataHolder.merge(form, klines);

    this.currentForm = form;
    if (this.chartInitialized) {
      this.updateChartData();
    } else {
      this.resetChart();
    }
  }

  loadData() {
    const form = {...this.queryForm};
    if (!form.ex) {
      return;
    }
    if (!form.pair) {
      this.pairService.showErrorMessage('未选择交易对');
      return;
    }
    if (!form.intervalOption) {
      this.pairService.showErrorMessage('未选择间隔');
      return;
    }

    form.newerThan = undefined;
    form.olderThan = undefined;

    const currentData: Kline[] = this.dataHolder.getData(form);
    if (currentData && currentData.length >= form.limit) {
      this.onDataLoaded(form, currentData);
      return;
    }

    this.processes.queryKlines = true;
    this.klineService.queryKlines(form)
      .subscribe(klines => {
          this.processes.queryKlines = false;
          if (klines.length < form.limit) {
            form.noMoreData = true;
          }
          this.onDataLoaded(form, klines);
          const maxSize = KlineQueryForm.ExMaxDataSizes[form.ex];
          if (this.currentData >= maxSize) {
            form.noMoreData = true;
          }
        },
        error => this.processes.queryKlines = false,
        () => this.processes.queryKlines = false);
  }


  loadMore() {
    let form = this.currentForm;
    if (!form) {
      return;
    }
    if (form.ex === 'hb') {
      // not support
      return;
    }
    form = {...form};

    const currentData: Kline[] = this.dataHolder.getData(form);
    if (!currentData || currentData.length === 0) {
      return;
    }

    const oldest = currentData[0];
    form.newerThan = undefined;
    form.olderThan = oldest.ts;
    form.limit = this.queryForm.limit;

    this.processes.loadMore = true;
    this.klineService.queryKlines(form)
      .subscribe(klines => {
          this.processes.loadMore = false;
          if (klines.length < form.limit) {
            form.noMoreData = true;
          }
          this.onDataLoaded(form, klines);
          const maxSize = KlineQueryForm.ExMaxDataSizes[form.ex];
          if (this.currentData >= maxSize) {
            form.noMoreData = true;
          }
        },
        error => this.processes.loadMore = false,
        () => this.processes.loadMore = false);
  }

  transformData() {
    const timeLabels: string[] = [];
    const oclhvs: number[][] = [];
    for (const kline of this.currentData) {
      timeLabels.push(kline.dts);
      oclhvs.push([
        kline.open, kline.close,
        kline.low, kline.high,
        // kline.vol, kline.volQuote
      ]);
    }
    return {timeLabels, oclhvs};
  }

  setChartOption(): void {
    const form = this.currentForm;
    const data = this.currentData;
    if (!form || !data) {
      return;
    }

    const {timeLabels, oclhvs} = this.transformData();

    const pairSymbol = `${form.pair.baseCcy}-${form.pair.quoteCcy}`;
    const option: EChartsOption = {
      animation: false,
      backgroundColor: this.transparentBackground ?
        'transparent' :
        (this.chartDarkTheme ? this.darkBackgroundColor : this.lightBackgroundColor),
      legend: null,
      title: {
        text: `${pairSymbol} ${form.intervalOption.key}`,
        subtext: `数据源：${form.ex.toUpperCase()}，条数：${timeLabels.length}`,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        borderWidth: 1,
        padding: 10,
      },
      toolbox: null,
      grid: {
        top: '80',
        left: '60',
        right: '40',
        height: '60%'
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        scale: true,
        boundaryGap: false,
        axisLine: {onZero: false},
        splitLine: {show: true},
        splitNumber: 20,
        min: 'dataMin',
        max: 'dataMax',
        axisPointer: {
          z: 100
        }
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitArea: {
          show: true
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 40,
          end: 100
        },
        {
          show: true,
          type: 'slider',
          top: '90%',
          start: 40,
          end: 100
        }
      ],
      series: {
        name: pairSymbol,
        type: 'candlestick',
        data: oclhvs,
        dimensions: [
          {name: 'date', displayName: '时间'},
          {name: 'open', displayName: '开盘'},
          {name: 'close', displayName: '收盘'},
          {name: 'lowest', displayName: '最低'},
          {name: 'highest', displayName: '最高'}
        ],
        encode: {
          x: 'date',
          y: ['open', 'close', 'lowest', 'highest'],
          tooltip: ['open', 'close', 'lowest', 'highest']
        },
        itemStyle: {
          color: '#00ca3c',
          color0: '#cc001c',
          opacity: 0.7,
          borderColor: null,
          borderColor0: null
        },
        tooltip: {}
      }
    };

    this.chart.setOption(option, true);
  }


  updateChartData(): void {
    const form = this.currentForm;
    const data = this.currentData;
    if (!form || !data) {
      return;
    }
    // console.log('update Chart Data... ');

    const {timeLabels, oclhvs} = this.transformData();

    const pairSymbol = `${form.pair.baseCcy}-${form.pair.quoteCcy}`;
    const option: EChartsOption = {
      title: {
        text: `${pairSymbol} ${form.intervalOption.key}`,
        subtext: `数据源：${form.ex.toUpperCase()}，条数：${timeLabels.length}`
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
      },
      series: {
        name: pairSymbol,
        type: 'candlestick',
        data: oclhvs
      }
    };

    this.chart.setOption(option);
  }

  resetChart(): void {
    // console.log('reset Chart ...');

    if (!this.currentForm || !this.currentData) {
      return;
    }

    if (this.chart) {
      this.chart.dispose();
    }
    const holder: HTMLDivElement = this.chartDiv.nativeElement as HTMLDivElement;
    this.chart = echartsInit(holder,
      this.chartDarkTheme ? 'dark' : null,
      {
        // renderer: 'svg',
        locale: 'ZH'
      });

    this.setChartOption();
    this.chartInitialized = true;
  }
}
