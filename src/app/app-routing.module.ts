import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { UsersComponent } from './sys/user/users.component';
import { ExchsComponent } from './sys/exch/exchs.component';
import { CcysComponent } from './mar/ccy/ccys.component';
import { PairsComponent } from './mar/pair/pairs.component';
import { AssetsComponent } from './per/asset/assets.component';
import { SpotOrdersComponent } from './per/order/spot-orders.component';
import { PendingOrdersComponent } from './per/order-pending/pending-orders.component';
import { AssetsMergedComponent } from './per/asset/assets-merged.component';
import { CcyQuotesComponent } from './mar/ccy-quote/ccy-quotes.component';
import { LastTransComponent } from './per/last-trans/last-trans.component';
import { InstPriceComponent } from './mar/pair-inst-price/inst-price.component';
import { ExapisComponent } from './sys/exapi/exapis.component';
import { StrategiesComponent } from './str/strategy/strategies.component';
import { StrategyEditComponent } from './str/strategy/strategy-edit.component';
import { HistoryStrategiesComponent } from './str/strategy-history/history-strategies.component';
import { KlineChartComponent } from './mar/kline-chart/kline-chart.component';
import { StrategyEditManyComponent } from './str/strategy/strategy-edit-many.component';
import { SnapshotsChartComponent } from './per/asset-snapshot/snapshots-chart.component';
import { OrdersChartComponent } from './per/order-chart/orders-chart.component';
import { SnapshotsComponent } from './per/asset-snapshot/snapshots.component';

const routes: Routes = [
  // {path: '', component: HomeComponent},
  {path: 'quotes', component: CcyQuotesComponent},
  {path: 'prices', component: InstPriceComponent},
  {path: 'klines', component: KlineChartComponent},

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
  {path: 'ccys', component: CcysComponent},
  {path: 'pairs', component: PairsComponent},
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
