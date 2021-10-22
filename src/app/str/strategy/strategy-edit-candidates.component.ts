import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { combineLatest } from 'rxjs';

import { Ccy } from '../../models/mar/ccy';
import { Strategy } from '../../models/str/strategy';
import { StrategyService } from '../../services/str/strategy.service';
import { PairService } from '../../services/mar/pair.service';
import { CurrentPrices, PairPrice } from '../../models/mar/pair-price';
import { Asset } from '../../models/per/asset';
import { AssetService } from '../../services/per/asset.service';
import { TableDatasource } from '../../common/table-datasource';
import { StrategyExPair } from './strategy-edit-many.component';
import { KlineChartDialogComponent } from '../../mar/kline-chart/kline-chart-dialog.component';


@Component({
  selector: 'app-strategy-edit-candidates',
  templateUrl: './strategy-edit-candidates.component.html',
  styleUrls: ['./strategy-edit-candidates.component.css']
})
export class StrategyEditCandidatesComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<StrategyExPair>;

  CoinLogoPath = Ccy.LogoPath;

  @Input() ex: string;
  @Input() strategyType: string;
  @Input() strategyExPairs: StrategyExPair[];
  @Input() strategy: Strategy;

  getTypeLabel = Strategy.getTypeLabel;

  showAll = false;
  dataSource: TableDatasource<StrategyExPair>;
  strategyExPairsMap: Map<string, StrategyExPair>;
  assetUsdt: Asset;

  refreshingAssets = false;
  refreshingPrices = false;

  displayedColumns: string[] = ['selected', 'index', 'newStrategy', 'baseCcy',
    /*'baseAssetPrice',*/ 'baseAssetHoldingValue', 'baseAssetFrozenValue',
    'quoteCcy', 'currentPrice',
    'basePoint', 'expectingPercent', 'tradingPoint', 'tradeVol', 'peak', 'valley', 'createdAt',
    'actions'];

  constructor(private strategyService: StrategyService,
              private pairService: PairService,
              private assetService: AssetService,
              private dialog: MatDialog) {

  }

  private pairKey(baseCcy: string, quoteCcy: string): string {
    return `${baseCcy}-${quoteCcy}`;
  }

  ngOnInit() {
    this.dataSource = new TableDatasource<StrategyExPair>();
    this.dataSource.compareFieldMappers = {
      baseCcy: p => p.pair.baseCcy,
      quoteCcy: p => p.pair.quoteCcy,
      currentPrice: p => p.currentPrice && p.currentPrice.price || 0,
      baseAssetPrice: p => p.baseAsset && p.baseAsset.price || 0,
      baseAssetHoldingValue: p => p.baseAsset && p.baseAsset.holdingValue || 0,
      baseAssetFrozenValue: p => p.baseAsset && p.baseAsset.frozenValue || 0,
      createdAt: p => p.strategy && p.strategy.createdAt || 0,
    }

    combineLatest([
      this.pairService.findConcerned(),
      this.strategyService.findByType(this.strategyType, {ex: this.ex})
    ]).subscribe(([pairs, strategies]) => {

      this.strategyExPairs.splice(0, this.strategyExPairs.length);
      this.strategyExPairsMap = new Map<string, StrategyExPair>()

      for (const pair of pairs) {
        const sep: StrategyExPair = {
          selected: false,
          newStrategy: true,
          pair: pair
        };
        const symbol = pair[this.ex + 'Symbol'];
        if (!symbol) {
          continue;
        }
        this.strategyExPairs.push(sep);
        const key = this.pairKey(pair.baseCcy, pair.quoteCcy);
        this.strategyExPairsMap.set(key, sep);
      }

      for (const strategy of strategies) {
        if (strategy.status === 'placed') {
          continue;
        }
        const template = this.strategy;
        if (!template.expectingPercent) {
          template.expectingPercent = strategy.expectingPercent;
          template.drawbackPercent = strategy.drawbackPercent;
          template.tradeVolByValue = strategy.tradeVolByValue;
          template.tradeVolPercent = strategy.tradeVolPercent;
          template.tradeVol = strategy.tradeVol;
        }
        const key = this.pairKey(strategy.baseCcy, strategy.quoteCcy);
        const sep: StrategyExPair = this.strategyExPairsMap.get(key);
        sep.strategy = strategy;
        sep.newStrategy = false;
        sep.selected = true;
      }

      this.setDataSource();

      this.refreshAssets();
      this.refreshPrices();
    });
  }

  refreshAssets(): void {
    this.refreshingAssets = true;
    this.assetService.list2ForEx(this.ex)
      .subscribe(assets => {
          this.refreshingAssets = false;
          const assetsMap = new Map<string, Asset>(assets.map(a => [a.ccy, a]));
          for (const sep of this.strategyExPairs) {
            const asset = assetsMap.get(sep.pair.baseCcy);
            if (!asset) {
              continue;
            }
            sep.baseAsset = asset;
            if (asset.holdingValue) {
              const available = asset.holdingValue - asset.frozenValue;
              if (available > 10) { // $10
                sep.selected = true;
              }
            }
          }
          this.assetUsdt = assetsMap.get('USDT');

          this.setDataSource();
        },
        error => this.refreshingAssets = false,
        () => this.refreshingAssets = false);
  }


  refreshPrices(): void {
    this.refreshingPrices = true;
    this.pairService.inquirePrices(this.ex)
      .subscribe((cps: CurrentPrices) => {
          this.refreshingPrices = false;
          for (const sep of this.strategyExPairs) {
            const priceKey = PairPrice.priceKey(sep.pair);
            sep.currentPrice = cps[priceKey];
          }
        },
        error => this.refreshingPrices = false,
        () => this.refreshingPrices = false);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  setDataSource() {
    this.strategyExPairs.sort((s1, s2) => {
      if (s1.selected !== s2.selected) {
        return s1.selected ? -1 : 1;
      }
      if (s1.newStrategy !== s2.newStrategy) {
        return s1.newStrategy ? 1 : -1;
      }
      return s1.pair.baseCcy.localeCompare(s2.pair.baseCcy);
    });
    if (this.showAll) {
      this.dataSource.setData(this.strategyExPairs);
    } else {
      this.dataSource.setData(this.strategyExPairs.filter(sep => sep.selected));
    }

  }

  openKlineChart(exp: StrategyExPair) {
    KlineChartDialogComponent.showKlineChart(
      this.dialog,
      {
        ex: this.ex,
        pair: exp.pair
      });
  }

}
