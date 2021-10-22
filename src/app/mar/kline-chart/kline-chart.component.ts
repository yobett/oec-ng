import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';
import { Subscription } from 'rxjs';
import { ECharts, EChartsOption, init as echartsInit } from 'echarts';

import { ThemeService } from '../../services/style/theme.service';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { IntervalOption, Kline, KlineDataHolder, KlineQueryForm } from '../../models/mar/kline';
import { ExPair } from '../../models/mar/ex-pair';
import { PairService } from '../../services/mar/pair.service';
import { KlineService } from '../../services/mar/kline.service';
import { Ccy } from '../../models/mar/ccy';
import { SessionService } from '../../services/sys/session.service';


@Component({
  selector: 'app-kline-chart',
  templateUrl: './kline-chart.component.html',
  styleUrls: ['./kline-chart.component.css']
})
export class KlineChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chart') chartDiv: ElementRef;
  chart: ECharts;
  chartInitialized = false;

  chartWidth = '100%';
  chartHeight = 460;

  CoinLogoPath = Ccy.LogoPath;

  transparentBackground = false;
  lightBackgroundColor = '#FAFAFA'; // #FAFAFA, white
  darkBackgroundColor = '#333'; // #404040, #333, black
  chartDarkTheme: boolean;

  themeSubscription: Subscription;
  navDrawerSubscription: Subscription;
  exchs: Exch[];

  queryForm: KlineQueryForm = new KlineQueryForm();
  intervals: IntervalOption[];
  concernedPairs: ExPair[];
  pairOptions: ExPair[];
  limitOptions: number[];

  currentForm: KlineQueryForm;
  currentData: Kline[];
  dataHolder: KlineDataHolder = new KlineDataHolder();

  autoRenew = true;
  autoUpdateHandler1m: ReturnType<typeof setInterval>;
  windowWidth: number;
  resetChartHandler: ReturnType<typeof setTimeout>;

  processes: { [name: string]: boolean } = {};

  constructor(private sessionService: SessionService,
              private themeService: ThemeService,
              private exchService: ExchService,
              private pairService: PairService,
              private klineService: KlineService) {
  }

  ngOnInit() {
    this.chartDarkTheme = this.themeService.currentTheme.darkTheme;
    this.themeSubscription = this.themeService.themeSubject
      .subscribe(theme => {
        if (theme.darkTheme !== this.chartDarkTheme) {
          this.chartDarkTheme = theme.darkTheme;
          this.resetChart();
        }
      });
    this.navDrawerSubscription = this.sessionService.navDrawerSubject
      .subscribe(open => {
        this.resetChart();
      });

    this.exchService.list2().subscribe(exchs => {
      this.exchs = exchs;
      if (!this.queryForm.pair) {
        this.setupPairOptions();
      }
    });

    this.pairService.findConcerned().subscribe(pairs => {
      this.concernedPairs = pairs;
      if (!this.queryForm.pair) {
        this.setupPairOptions();
      }
    });

    this.setupIntervalOptions();
    this.setupLimitOptions();

    this.windowWidth = window.innerWidth;
  }

  setupPairOptions() {
    if (!this.concernedPairs) {
      return;
    }
    const ex = this.queryForm.ex;
    this.pairOptions = this.concernedPairs.filter(pair => (pair as any)[ex + 'Symbol']);

    if (this.queryForm.pair) {
      if (!this.pairOptions.includes(this.queryForm.pair)) {
        this.queryForm.pair = this.pairOptions[0];
      }
    } else {
      this.queryForm.pair = this.pairOptions[0];
    }
  }

  setupIntervalOptions() {
    this.intervals = KlineQueryForm.ExIntervals[this.queryForm.ex];
    if (!this.intervals) {
      return;
    }
    const curOption = this.queryForm.intervalOption;
    let option;
    if (curOption) {
      option = this.intervals.find(opt => opt.key === curOption.key);
    }
    if (!option) {
      option = this.intervals.find(it => it.key === KlineQueryForm.IntervalKey15m);
    }
    if (!option) {
      option = this.intervals[0];
    }
    this.queryForm.intervalOption = option;
  }

  setupLimitOptions() {
    this.limitOptions = KlineQueryForm.ExLimits[this.queryForm.ex];
    if (!this.limitOptions) {
      return;
    }
    if (!this.limitOptions.includes(this.queryForm.limit)) {
      this.queryForm.limit = KlineQueryForm.DefaultLimit;
    }
  }

  datasourceChanged(event: MatButtonToggleChange) {
    this.queryForm.ex = event.value;
    this.setupPairOptions();
    this.setupIntervalOptions();
    this.setupLimitOptions();
  }

  pairSelected(option: ExPair) {
    const queryForm = this.queryForm;
    queryForm.pair = option;
    if (queryForm.ex && queryForm.intervalOption) {
      this.loadData();
    }
  }

  intervalSelected(option: IntervalOption) {
    const queryForm = this.queryForm;
    queryForm.intervalOption = option;
    if (queryForm.ex && queryForm.pair) {
      this.loadData();
    }
  }

  ngAfterViewInit() {
    // this.resetChart();
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.navDrawerSubscription) {
      this.navDrawerSubscription.unsubscribe();
    }
    if (this.autoUpdateHandler1m) {
      clearInterval(this.autoUpdateHandler1m);
      this.autoUpdateHandler1m = null;
    }
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

          this.checkAutoUpdate();
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

  loadNew() {
    let form = this.currentForm;
    if (!form) {
      return;
    }
    form = {...form};

    const currentData: Kline[] = this.dataHolder.getData(form);
    if (!currentData || currentData.length === 0) {
      return;
    }

    let tmpLimit: number;
    const intervalKey = form.intervalOption.key;
    if (intervalKey === '1m') {
      tmpLimit = 10;
    } else if (intervalKey.endsWith('m')) {
      tmpLimit = 3;
    } else {
      tmpLimit = 1;
    }
    if (form.ex !== 'hb') {
      const newest = currentData[currentData.length - 1];
      form.olderThan = undefined;
      form.newerThan = newest.ts;
    }

    this.processes.renewData = true;
    this.klineService.queryKlines({...form, limit: tmpLimit})
      .subscribe(klines => {
          this.processes.renewData = false;
          this.onDataLoaded(form, klines);
        },
        error => this.processes.renewData = false,
        () => this.processes.renewData = false);
  }

  private autoRenewAction(intervalKey: string, limit: number = 1) {
    let form = this.currentForm;
    if (!form) {
      return;
    }
    if (form.intervalOption.key !== intervalKey) {
      return;
    }
    form = {...form};

    form.newerThan = undefined;
    form.olderThan = undefined;

    this.klineService.queryKlines({...form, limit})
      .subscribe(klines => {
        this.onDataLoaded(form, klines);
      });
  }

  checkAutoUpdate() {
    if (this.autoRenew) {
      if (this.autoUpdateHandler1m) {
        return;
      }
      this.autoUpdateHandler1m = setInterval(() => {
        this.autoRenewAction('1m');
      }, 30 * 1000);
    } else {
      if (this.autoUpdateHandler1m) {
        clearInterval(this.autoUpdateHandler1m);
        this.autoUpdateHandler1m = null;
      }
    }
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
        subtext: `数据源：${form.ex.toUpperCase()}，条数：${timeLabels.length}`
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        borderWidth: 1,
        padding: 10,
        // position: function (pos,
        //                     params,
        //                     el,
        //                     elRect,
        //                     size) {
        //   const obj = {top: 10};
        //   obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
        //   return obj;
        // }
      },
      // axisPointer: {
      //   link: [
      //     {xAxisIndex: 'all'}
      //   ],
      //   label: {
      //     backgroundColor: '#777'
      //   }
      // },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: false
          },
          brush: {
            type: ['lineX', 'clear']
          }
        }
      },
      brush: {
        xAxisIndex: 'all',
        brushLink: 'all',
        outOfBrush: {
          colorAlpha: 0.1
        }
      },
      grid: {
        top: '80',
        left: '60',
        right: '40',
        height: '66%'
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
        tooltip: {
          /*formatter: function (param) {
            // console.log(param)
            // param = param[0];
            const paramData = param.data;
            const volStr = paramData[5]?.toFixed(2);
            const volQuoteStr = paramData[6]?.toFixed(2);
            const itemDiv = (name, value) => {
              return `<div style="display: block">` +
                `<span style="float: left; display: inline-block; margin-right: 8px;">${name}</span>` +
                `<span style="float: right; display: inline-block;">${value}</span></div>` +
                `<div style="clear:both"></div>`;
            };
            return [
              `<div style="display: block; font-weight: bold;"><span style="float: left; display: inline-block; margin-right: 8px;">${param.marker} Date</span><span style="float: right">${param.name}</span></div>`,
              `<div style="clear:both"></div>`,
              '<hr size="1" style="display: block; margin: 3px 0; border-color: lightskyblue">',
              `<div style="clear:both"></div>`,
              itemDiv('Open', paramData[1]),
              itemDiv('Close', paramData[2]),
              itemDiv('Lowest', paramData[3]),
              itemDiv('Highest', paramData[4]),
              itemDiv('Volume', volStr),
              itemDiv('Vol(Quote)', volQuoteStr),
            ].join('');
          }*/
        }
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
