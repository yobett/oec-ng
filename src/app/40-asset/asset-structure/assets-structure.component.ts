import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ECharts, EChartsOption, init as echartsInit } from 'echarts';

import { Ccy } from '../../models/mar/ccy';
import { ThemeService } from '../../services/style/theme.service';

export interface AssetItem {
  ccy: string;
  holdingValue: number;
}

export interface AssetsStructureData {
  items: AssetItem[];
  ex?: string;
}

@Component({
  selector: 'app-assets-structure',
  templateUrl: './assets-structure.component.html',
  styleUrls: ['./assets-structure.component.css']
})
export class AssetsStructureComponent implements OnInit, AfterViewInit {
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

  windowWidth: number;
  resetChartHandler: ReturnType<typeof setTimeout>;

  assetItems: AssetItem[];
  ex: string;

  constructor(private themeService: ThemeService,
              public dialogRef: MatDialogRef<AssetsStructureComponent>,
              @Inject(MAT_DIALOG_DATA) public data: AssetsStructureData) {
    this.assetItems = data.items;
    this.ex = data.ex;
    this.chartDarkTheme = this.themeService.currentTheme.darkTheme;
  }

  ngOnInit() {
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

  setChartOption(): void {
    const data = this.assetItems
      .sort((a1, a2) => a2.holdingValue - a1.holdingValue)
      .map(ai => ({name: ai.ccy, value: Math.round(ai.holdingValue)}));
    let title = '资产结构';
    if (this.ex) {
      title = title + ` (${this.ex})`;
    }
    const option: EChartsOption = {
      animation: false,
      backgroundColor: this.transparentBackground ?
        'transparent' :
        (this.chartDarkTheme ? this.darkBackgroundColor : this.lightBackgroundColor),
      legend: {
        type: 'scroll',
        orient: 'vertical',
        align: 'right',
        right: 0,
      },
      title: {
        text: title,
      },
      label: {
        formatter: '{b}: {d}%'
      },
      tooltip: {
        formatter: '{b}: ${c} ({d}%)'
      },
      series: {
        name: 'structure',
        type: 'pie',
        radius: ['40%', '70%'],
        data,
      }
    };

    this.chart.setOption(option, true);
  }

  resetChart(): void {
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

  static showAssetsStructureChart(dialog: MatDialog, data: AssetsStructureData) {
    return dialog.open(
      AssetsStructureComponent, {
        disableClose: true,
        width: '700px',
        maxWidth: '90vw',
        data
      });
  }

}
