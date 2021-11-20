import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsersComponent } from './90-sys/user/users.component';
import { ExchsComponent } from './90-sys/exch/exchs.component';
import { CcysComponent } from './30-market/ccy/ccys.component';
import { PairsComponent } from './30-market/pair/pairs.component';
import { AssetsComponent } from './40-asset/asset/assets.component';
import { SpotOrdersComponent } from './50-order/order/spot-orders.component';
import { PendingOrdersComponent } from './50-order/order-pending/pending-orders.component';
import { AssetsMergedComponent } from './40-asset/asset/assets-merged.component';
import { CcyQuotesComponent } from './30-market/ccy-quote/ccy-quotes.component';
import { LastTransComponent } from './50-order/last-trans/last-trans.component';
import { InstPriceComponent } from './30-market/pair-inst-price/inst-price.component';
import { ExapisComponent } from './90-sys/exapi/exapis.component';
import { StrategiesComponent } from './60-strategy/strategy/strategies.component';
import { StrategyEditComponent } from './60-strategy/strategy-edit/strategy-edit.component';
import { HistoryStrategiesComponent } from './60-strategy/strategy-history/history-strategies.component';
import { KlineChartComponent } from './30-market/kline-chart/kline-chart.component';
import { StrategyEditManyComponent } from './60-strategy/strategy-edit/strategy-edit-many.component';
import { SnapshotsChartComponent } from './40-asset/asset-snapshot/snapshots-chart.component';
import { OrdersChartComponent } from './50-order/order-chart/orders-chart.component';
import { SnapshotsComponent } from './40-asset/asset-snapshot/snapshots.component';
import { Rolling24hPriceComponent } from './30-market/rolling24h-price/rolling24h-price.component';
import { CcyListingsComponent } from './30-market/ccy-listing/ccy-listings.component';

const routes: Routes = [
  // {path: '', component: HomeComponent},
  {path: 'ccys', component: CcysComponent},
  {path: 'pairs', component: PairsComponent},
  {path: 'quotes', component: CcyQuotesComponent},
  {path: 'listings', component: CcyListingsComponent},
  {path: 'prices', component: InstPriceComponent},
  {path: 'klines', component: KlineChartComponent},
  {path: 'prices24h', component: Rolling24hPriceComponent},

  {path: 'strategies/:type', component: StrategiesComponent},
  {path: 'strategies/:type/edit-many/:ex', component: StrategyEditManyComponent},
  {path: 'strategies/:type/:id', component: StrategyEditComponent},
  {path: 'hist-strategies', component: HistoryStrategiesComponent},

  {path: 'assets', component: AssetsComponent},
  {path: 'assets-merged', component: AssetsMergedComponent},
  {path: 'snapshots', component: SnapshotsComponent},
  {path: 'assets-trend', component: SnapshotsChartComponent},

  {path: 'orders', component: SpotOrdersComponent},
  {path: 'orders-chart', component: OrdersChartComponent},
  {path: 'orders-pending', component: PendingOrdersComponent},
  {path: 'last-trans', component: LastTransComponent},

  {path: 'users', component: UsersComponent},
  {path: 'exchs', component: ExchsComponent},
  {path: 'exapis', component: ExapisComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // enableTracing: true,
    // useHash: true
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
