import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';
import { Subscription } from 'rxjs';
import { EChartsOption } from 'echarts';

import { ThemeService } from '../../services/style/theme.service';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { Kline, KlineQueryForm } from '../../models/mar/kline';
import { ExPair } from '../../models/mar/ex-pair';
import { PairService } from '../../services/mar/pair.service';
import { KlineService } from '../../services/mar/kline.service';
import { SessionService } from '../../services/sys/session.service';
import { KlineChartBaseComponent } from './kline-chart-base.component';


@Component({
  selector: 'app-kline-chart',
  templateUrl: './kline-chart.component.html',
  styleUrls: ['./kline-chart.component.css']
})
export class KlineChartComponent extends KlineChartBaseComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chartDiv: ElementRef;

  chartHeight = 460;

  themeSubscription: Subscription;
  navDrawerSubscription: Subscription;
  exchs: Exch[];

  concernedPairs: ExPair[];
  pairOptions: ExPair[];

  autoRenew = true;
  autoUpdateHandler1m: ReturnType<typeof setInterval>;

  constructor(protected themeService: ThemeService,
              protected klineService: KlineService,
              protected exchService: ExchService,
              protected sessionService: SessionService,
              protected pairService: PairService) {
    super(themeService, klineService);
  }

  ngOnInit() {
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

  protected onDataLoaded(form: KlineQueryForm, klines: Kline[]) {
    super.onDataLoaded(form, klines);
    this.checkAutoUpdate();
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


  setChartOption() {
    const option: EChartsOption = super.buildChartOption();
    if (!option) {
      return;
    }
    this.chart.setOption(option, true);
    this.chart.setOption(
      {
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
      } as EChartsOption);
  }

}
