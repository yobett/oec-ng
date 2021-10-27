import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ECharts, EChartsOption, init as echartsInit } from 'echarts';

import { ThemeService } from '../../services/style/theme.service';
import { IntervalOption, Kline, KlineDataHolder, KlineQueryForm } from '../../models/mar/kline';
import { KlineService } from '../../services/mar/kline.service';
import { Ccy } from '../../models/mar/ccy';
import { upDownPercent } from '../../common/utils';


@Component({template: ''})
export abstract class KlineChartBaseComponent implements OnInit {
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

  constructor(protected themeService: ThemeService,
              protected klineService: KlineService) {
    this.chartDarkTheme = this.themeService.currentTheme.darkTheme;
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

  protected onDataLoaded(form: KlineQueryForm, klines: Kline[]) {
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
      this.klineService.showErrorMessage('未选择交易对');
      return;
    }
    if (!form.intervalOption) {
      this.klineService.showErrorMessage('未选择间隔');
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
    const oclhvs: any[][] = [];
    for (const kline of this.currentData) {
      timeLabels.push(kline.dts);
      oclhvs.push([
        kline.open, kline.close,
        kline.low, kline.high,
        upDownPercent(kline.open, kline.close, true),
        upDownPercent(kline.low, kline.high, false, true),
        // kline.vol, kline.volQuote
      ]);
    }
    return {timeLabels, oclhvs};
  }

  buildChartOption(): EChartsOption {
    const form = this.currentForm;
    const data = this.currentData;
    if (!form || !data) {
      return null;
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
        height: (typeof this.chartHeight === 'number') ? (this.chartHeight - 160) : '60%'
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
          {name: 'highest', displayName: '最高'},
          {name: 'open-close', displayName: '开盘-收盘'},
          {name: 'lowest-highest', displayName: '最低-最高'}
        ],
        encode: {
          x: 'date',
          y: ['open', 'close', 'lowest', 'highest'],
          tooltip: ['open', 'close', 'open-close', 'lowest', 'highest', 'lowest-highest']
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

    return option;
  }


  setChartOption(): void {
    const option: EChartsOption = this.buildChartOption();
    if (!option) {
      return;
    }
    this.chart.setOption(option, true);
  }


  updateChartData(): void {
    const form = this.currentForm;
    const data = this.currentData;
    if (!form || !data) {
      return;
    }

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
        renderer: 'svg',
        locale: 'ZH'
      });

    this.setChartOption();
    this.chartInitialized = true;
  }
}
