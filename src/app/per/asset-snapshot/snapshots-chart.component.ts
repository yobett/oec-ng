import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ECharts, EChartsOption, init as echartsInit } from 'echarts';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { Moment } from 'moment';

import { Ccy } from '../../models/mar/ccy';
import { SessionService } from '../../services/sys/session.service';
import { ThemeService } from '../../services/style/theme.service';
import { AssetSnapshotService } from '../../services/per/asset-snapshot.service';
import { AssetSnapshot, AssetSnapshotDataHolder, AssetSnapshotQueryForm } from '../../models/per/asset-snapshot';
import { moneySumValue } from '../../common/utils';
import { EffectDigitsPipe } from '../../common/pipe/effect-digits-pipe';

@Component({
  selector: 'app-asset-snapshots-chart',
  templateUrl: './snapshots-chart.component.html',
  styleUrls: ['./snapshots-chart.component.css']
})
export class SnapshotsChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chart') chartDiv: ElementRef;
  chart: ECharts;
  chartInitialized = false;

  ccyAll = AssetSnapshot.CcyAll;
  ccyAllLabel = '（全部）';
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
  latestCcys: string[] = [];
  limitOptions: number[] = [24, 100, 300];
  queryForm: AssetSnapshotQueryForm = {ccy: AssetSnapshot.CcyAll, limit: this.limitOptions[0], noMoreData: false};
  currentForm: AssetSnapshotQueryForm;

  dataHolder: AssetSnapshotDataHolder = new AssetSnapshotDataHolder();
  today = moment().startOf('day');
  createTsTo: Moment;

  constructor(private sessionService: SessionService,
              private themeService: ThemeService,
              private snapshotService: AssetSnapshotService,
              private effectDigitsPipe: EffectDigitsPipe) {

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

    this.snapshotService.getAssetCodes()
      .subscribe(ccys => {
        this.ccys = ccys;
        this.latestCcys = ccys;
      });

    this.windowWidth = window.innerWidth;

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

  clearDate() {
    this.createTsTo = null;
    this.ccys = this.latestCcys;
  }

  dateChanged() {
    if (!this.createTsTo) {
      return;
    }
    const dayMills = 24 * 60 * 60 * 1000;
    const ts = this.createTsTo.valueOf() + dayMills;
    this.snapshotService.getAssetCodes(ts)
      .subscribe(ccys => {
        this.ccys = ccys;
      });
  }

  ccySelected(ccy: string): void {
    this.queryForm.ccy = ccy;
    this.loadData();
  }

  private onDataLoaded(form: AssetSnapshotQueryForm, data: AssetSnapshot[]) {
    this.dataHolder.merge(form, data);
    form.noMoreData = this.dataHolder.isNoMoreData(form);
    this.currentForm = form;
    this.resetOrUpdateChart();
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

    const currentData: AssetSnapshot[] = this.dataHolder.getData(form);
    if (currentData && currentData.length > 0) {
      let noMoreData = this.dataHolder.isNoMoreData(form);
      if (currentData.length >= form.limit || noMoreData) {
        form.noMoreData = noMoreData;
        this.currentForm = form;
        this.resetOrUpdateChart();
        return;
      }
    }

    this.snapshotService.query(form)
      .subscribe(snapshots => {
        this.onDataLoaded(form, snapshots);
      });
  }

  loadMore() {
    let form = this.currentForm;
    if (!form) {
      return;
    }
    const currentData: AssetSnapshot[] = this.dataHolder.getData(form);
    if (!currentData || currentData.length === 0) {
      return;
    }

    form = {...form};
    const oldest = currentData[0];
    form.olderThan = oldest.ts;
    form.limit = this.queryForm.limit;

    this.snapshotService.query(form)
      .subscribe(snapshots => {
        this.onDataLoaded(form, snapshots);
      });
  }

  transformData(snapshots: AssetSnapshot[]): { dts: string, holdingValue: number, holding: number }[] {
    return snapshots.map(s => {
      return {
        dts: s.dts,
        holdingValue: moneySumValue(s.holdingValue),
        holding: (s.holding === 0) ? undefined : +this.effectDigitsPipe.transform(s.holding),
      };
    });
  }

  updateChartData(): void {

    const form = this.currentForm;
    if (!this.currentForm) {
      return;
    }
    let snapshots = this.dataHolder.getData(form);
    if (!snapshots) {
      snapshots = [];
    }

    const data = this.transformData(snapshots);
    const ccyName = (form.ccy === this.ccyAll) ? this.ccyAllLabel : form.ccy;

    const option: EChartsOption = {
      title: {
        text: `币种：${ccyName}`,
        subtext: `条数：${data.length}`
      },
      dataset: {
        source: data,
      },
      series: [
        {
          name: `${ccyName} 折美元`,
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          encode: {
            x: 'dts',
            y: 'holdingValue',
          }
        },
        {
          name: `${ccyName} 持有量`,
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          encode: {
            x: 'dts',
            y: 'holding',
          }
        }
      ]
    };

    this.chart.setOption(option);
  }

  setChartOption(): void {

    const form = this.currentForm;
    let snapshots = this.dataHolder.getData(form);
    if (!snapshots) {
      snapshots = [];
    }

    const data = this.transformData(snapshots);
    const ccyName = (form.ccy === this.ccyAll) ? this.ccyAllLabel : form.ccy;

    const option: EChartsOption = {
      animation: false,
      backgroundColor: this.transparentBackground ?
        'transparent' :
        (this.chartDarkTheme ? this.darkBackgroundColor : this.lightBackgroundColor),
      legend: {},
      title: {
        text: `币种：${ccyName}`,
        subtext: `条数：${data.length}`
      },
      tooltip: {
        trigger: 'axis',
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
        height: '63%'
      },
      dataset: {
        dimensions: [
          {name: 'dts', type: 'ordinal', displayName: '时间'},
          {name: 'holdingValue', type: 'number', displayName: '折美元'},
          {name: 'holding', type: 'number', displayName: '持有量'}
        ],
        source: data,
      },
      xAxis: {
        type: 'category',
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
      yAxis: [{
        type: 'value',
        name: '折美元',
        scale: true,
        splitArea: {
          show: true
        }
      }, {
        type: 'value',
        name: '持有量',
        scale: true,
        splitArea: {
          show: true
        }
      }],
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
      series: [
        {
          name: `${ccyName} 折美元`,
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          encode: {
            x: 'dts',
            y: 'holdingValue',
          }
        },
        {
          name: `${ccyName} 持有量`,
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          encode: {
            x: 'dts',
            y: 'holding',
          }
        }
      ]
    };

    this.chart.setOption(option, true);
  }

  resetOrUpdateChart(): void {
    if (!this.chartInitialized) {
      this.resetChart();
    } else {
      this.updateChartData();
    }
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
