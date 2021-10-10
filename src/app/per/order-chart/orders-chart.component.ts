import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';
import { ECharts, EChartsOption, init as echartsInit, ScatterSeriesOption } from 'echarts';
import { DimensionDefinition } from 'echarts/types/src/util/types';
import { Observable, Subscription } from 'rxjs';
import { groupBy, toPairs } from 'lodash';
import * as moment from 'moment';
import { Moment } from 'moment';

import { Ccy } from '../../models/mar/ccy';
import { SessionService } from '../../services/sys/session.service';
import { ThemeService } from '../../services/style/theme.service';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { SpotOrder, OrderChartDataHolder, OrderTimeLineQueryForm } from '../../models/per/spot-order';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { EffectDigitsPipe } from '../../common/pipe/effect-digits-pipe';

@Component({
  selector: 'app-orders-chart',
  templateUrl: './orders-chart.component.html',
  styleUrls: ['./orders-chart.component.css']
})
export class OrdersChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chart') chartDiv: ElementRef;
  chart: ECharts;
  chartInitialized = false;

  $exchs: Observable<Exch[]>;
  chartWidth = '100%';
  chartHeight = 460;

  CoinLogoPath = Ccy.LogoPath;

  transparentBackground = false;
  lightBackgroundColor = '#FAFAFA'; // #FAFAFA, white
  darkBackgroundColor = '#333'; // #404040, #333, black
  chartDarkTheme: boolean;

  themeSubscription: Subscription;
  navDrawerSubscription: Subscription;
  windowWidth: number;
  resetChartHandler: ReturnType<typeof setTimeout>;

  processes: { [name: string]: boolean } = {};

  ccys: string[] = [];
  limitOptions: number[] = [20, 50, 100];
  queryForm: OrderTimeLineQueryForm = {ex: '', limit: this.limitOptions[0], noMoreData: false};
  currentForm: OrderTimeLineQueryForm;

  dataHolder: OrderChartDataHolder = new OrderChartDataHolder();
  today = moment().startOf('day');
  createTsTo: Moment;

  constructor(private sessionService: SessionService,
              private exchService: ExchService,
              private spotOrderService: SpotOrderService,
              private themeService: ThemeService,
              private effectDigits: EffectDigitsPipe) {

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

    this.windowWidth = window.innerWidth;

    this.$exchs = this.exchService.list2();
    this.loadData();
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

  exChanged(event: MatButtonToggleChange) {
    this.loadData();
  }

  private onDataLoaded(form: OrderTimeLineQueryForm, data: SpotOrder[]) {
    this.dataHolder.merge(form, data);
    form.noMoreData = this.dataHolder.isNoMoreData(form);
    this.currentForm = form;
    this.resetChart();
  }

  loadData(): void {
    const form = {...this.queryForm};
    form.olderThan = undefined;

    const currentForm = this.currentForm;
    if (currentForm) {
      if (this.createTsTo) {
        const dayMills = 24 * 60 * 60 * 1000;
        const olderThan = this.createTsTo.valueOf() + dayMills;
        if (currentForm.olderThan !== olderThan) {
          this.dataHolder.clear();
          form.olderThan = olderThan;
        }
      } else if (currentForm.olderThan) {
        this.dataHolder.clear();
      }
    }

    const currentData: SpotOrder[] = this.dataHolder.getData(form);
    if (currentData && currentData.length >= form.limit) {
      this.onDataLoaded(form, currentData);
      return;
    }

    this.spotOrderService.timeLineQuery(form)
      .subscribe(orders => {
        this.onDataLoaded(form, orders);
      });
  }

  loadMore() {
    let form = this.currentForm;
    if (!form) {
      return;
    }
    const currentData: SpotOrder[] = this.dataHolder.getData(form);
    if (!currentData || currentData.length === 0) {
      return;
    }

    form = {...form};
    const oldest = currentData[0];
    form.olderThan = oldest.ts;
    form.limit = this.queryForm.limit;

    this.spotOrderService.timeLineQuery(form)
      .subscribe(orders => {
        this.onDataLoaded(form, orders);
      });
  }

  setChartOption(): void {

    const form = this.currentForm;
    let orders = this.dataHolder.getData(form);
    if (!orders) {
      orders = [];
    }

    // const timeLabels: string[] = orders.map(s => s.dts);
    // const data = orders.map(s => `${s.baseCcy}-${s.quoteCcy}`);
    const dimensions: DimensionDefinition[] = [
      {name: 'ts', type: 'time', displayName: '时间'},
      {name: 'baseCcy', type: 'ordinal', displayName: '基础币种'},
      {name: 'quoteCcy', type: 'ordinal', displayName: '报价币种'},
      {name: 'ex', type: 'ordinal', displayName: '交易所'},
      {name: 'type', type: 'ordinal', displayName: '类型'},
      {name: 'side', type: 'ordinal', displayName: '方向'},
      {name: 'avgPrice', type: 'float', displayName: '均价'},
      {name: 'execQty', type: 'float', displayName: '执行数量'},
      {name: 'quoteAmount', type: 'float', displayName: '报价币种数量'},
    ];
    const effectDigits = this.effectDigits;
    const data = orders.map(o => [
      o.ts,
      o.baseCcy,
      o.quoteCcy,
      o.ex,
      o.type,
      o.side,
      +effectDigits.transform(o.avgPrice, 4),
      +effectDigits.transform(o.execQty, 4),
      +effectDigits.transform(o.quoteAmount, 4)
    ]);

    const baseCcyDataPairs = toPairs(groupBy(data, o => o[1]))
      .sort((a, b) => a[0].localeCompare(b[0]));
    const baseCcys = baseCcyDataPairs.map(p => p[0]);

    const datasets = baseCcyDataPairs.map(p => {
      return {
        dimensions,
        source: p[1],
      };
    });

    const seriesNameBuy = '买入';
    const seriesNameSell = '卖出';

    const legendData = baseCcys;
    const legendData0 = [
      {name: seriesNameBuy, icon: 'circle'},
      {name: seriesNameSell, icon: 'rect'}
    ];

    const symbolStyle = (item) => {
      // side
      return item[5] === 'buy' ? 'circle' : 'rect';
    };

    const symbolSize = (item) => {
      // side
      return item[5] === 'buy' ? 10 : 9;
    };

    const series: ScatterSeriesOption[] = [
      {
        name: seriesNameBuy,
        type: 'scatter',
        data: []
      }, {
        name: seriesNameSell,
        type: 'scatter',
        data: []
      }
    ];
    baseCcys.forEach((baseCcy, index) => {
      series.push({
        name: baseCcy,
        type: 'scatter',
        symbol: symbolStyle,
        symbolSize,
        datasetIndex: index,
        encode: {
          x: 'ts',
          y: 'quoteAmount',
          tooltip: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
      });
    });

    const option: EChartsOption = {
      animation: false,
      backgroundColor: this.transparentBackground ?
        'transparent' :
        (this.chartDarkTheme ? this.darkBackgroundColor : this.lightBackgroundColor),
      legend: [
        {
          top: 0,
          itemWidth: 8,
          itemHeight: 8,
          selectedMode: false,
          data: legendData0
        },
        {
          bottom: 0,
          data: legendData
        }
      ],
      title: {
        text: `交易所：${form.ex || '（全部）'}`,
        subtext: `条数：${data.length}`
      },
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'cross'
        },
        borderWidth: 1,
        padding: 10
      },
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
        top: '90',
        left: '60',
        right: '40',
      },
      dataset: datasets,
      xAxis: {
        type: 'time',
        scale: true,
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
        name: '交易额（报价币种）',
        // scale: true,
        splitArea: {
          show: true
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ],
      series
    };

    this.chart.setOption(option, true);
  }

  resetChart(): void {

    if (this.chart) {
      this.chart.dispose();
    }
    if (!this.currentForm) {
      return;
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
