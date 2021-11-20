import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';

import { AppMaterialModule } from './app-material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './20-home/home.component';
import { UsersComponent } from './90-sys/user/users.component';
import { LoginDialogComponent } from './90-sys/account/login-dialog.component';
import { UserDetailComponent } from './90-sys/user/user-detail.component';
import { ChangePwdComponent } from './90-sys/account/change-pwd.component';
import { UserEditComponent } from './90-sys/user/user-edit.component';
import { UserPwdResetComponent } from './90-sys/user/user-pwd-reset.component';
import { MessageDialogComponent } from './10-common/message-dialog/message-dialog.component';
import { ExchsComponent } from './90-sys/exch/exchs.component';
import { DateStringPipe } from './10-common/pipe/date-string.pipe';
import { ExchEditComponent } from './90-sys/exch/exch-edit.component';
import { CcysComponent } from './30-market/ccy/ccys.component';
import { CcyEditComponent } from './30-market/ccy/ccy-edit.component';
import { PairsComponent } from './30-market/pair/pairs.component';
import { PairEditComponent } from './30-market/pair/pair-edit.component';
import { AssetsComponent } from './40-asset/asset/assets.component';
import { SpotOrdersComponent } from './50-order/order/spot-orders.component';
import { PendingOrdersComponent } from './50-order/order-pending/pending-orders.component';
import { AssetsMergedComponent } from './40-asset/asset/assets-merged.component';
import { CcyQuotesComponent } from './30-market/ccy-quote/ccy-quotes.component';
import { MoneyPipe } from './10-common/pipe/money.pipe';
import { LastTransComponent } from './50-order/last-trans/last-trans.component';
import { LastTransEditComponent } from './50-order/last-trans/last-trans-edit.component';
import { InstPriceComponent } from './30-market/pair-inst-price/inst-price.component';
import { RawPercentPipe } from './10-common/pipe/raw-percent.pipe';
import { MoneySumPipe } from './10-common/pipe/moneysum.pipe';
import { CcyMetaComponent } from './30-market/ccy/ccy-meta.component';
import { ThemeSwitchComponent } from './20-home/theme-switch.component';
import { SyncResultDialogComponent } from './10-common/sync-result/sync-result-dialog.component';
import { SyncResultGroupDialogComponent } from './10-common/sync-result/sync-result-group-dialog.component';
import { ExapiEditComponent } from './90-sys/exapi/exapi-edit.component';
import { ExapisComponent } from './90-sys/exapi/exapis.component';
import { TruncatePipe } from './10-common/pipe/truncate.pipe';
import { OrderFormComponent } from './50-order/order-form/order-form.component';
import { EffectDigitsPipe } from './10-common/pipe/effect-digits-pipe';
import { StrategiesComponent } from './60-strategy/strategy/strategies.component';
import { StrategyNewComponent } from './60-strategy/strategy-edit/strategy-new.component';
import { StrategyEditComponent } from './60-strategy/strategy-edit/strategy-edit.component';
import { HistoryStrategiesComponent } from './60-strategy/strategy-history/history-strategies.component';
import { ServiceModule } from './services/service.module';
import { KlineChartComponent } from './30-market/kline-chart/kline-chart.component';
import { KlineChartDialogComponent } from './30-market/kline-chart/kline-chart-dialog.component';
import { SpotOrdersDialogComponent } from './50-order/order/spot-orders-dialog.component';
import { OrderDetailDialogComponent } from './50-order/order/order-detail-dialog.component';
import { StrategyEditManyComponent } from './60-strategy/strategy-edit/strategy-edit-many.component';
import { StrategyEditCandidatesComponent } from './60-strategy/strategy-edit/strategy-edit-candidates.component';
import { SnapshotsChartComponent } from './40-asset/asset-snapshot/snapshots-chart.component';
import { AssetsStructureComponent } from './40-asset/asset-structure/assets-structure.component';
import { OrdersChartComponent } from './50-order/order-chart/orders-chart.component';
import { RoundDownPipe } from './10-common/pipe/round-down-pipe';
import { StrategyDetailDialogComponent } from './60-strategy/strategy/strategy-detail-dialog.component';
import { SnapshotsComponent } from './40-asset/asset-snapshot/snapshots.component';
import { CcyQuoteDialogComponent } from './30-market/ccy-quote/ccy-quote-dialog.component';
import { CcyInfoDialogComponent } from './30-market/ccy/ccy-info-dialog.component';
import { CcyPairsDialogComponent } from './30-market/pair/ccy-pairs-dialog.component';
import { AssetsClearoutDialogComponent } from './40-asset/asset-trading/assets-clearout-dialog.component';
import { PendingOrdersDialogComponent } from './50-order/order-pending/pending-orders-dialog.component';
import { AssetsDialogComponent } from './40-asset/asset/assets-dialog.component';
import { Rolling24hPriceComponent } from './30-market/rolling24h-price/rolling24h-price.component';
import { StrategiesDialogComponent } from './60-strategy/strategy/strategies-dialog.component';
import { StrategyEditDialogComponent } from './60-strategy/strategy-edit/strategy-edit-dialog.component';
import { CcyListingsComponent } from './30-market/ccy-listing/ccy-listings.component';
import { BignumZhPipe } from './10-common/pipe/bignum-zh.pipe';


@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    LayoutModule,
    AppMaterialModule,
    AppRoutingModule,
    ServiceModule
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    LoginDialogComponent,
    ChangePwdComponent,
    UsersComponent,
    UserDetailComponent,
    UserEditComponent,
    UserPwdResetComponent,
    MessageDialogComponent,
    ExchsComponent,
    DateStringPipe,
    ExchEditComponent,
    CcysComponent,
    CcyEditComponent,
    PairsComponent,
    PairEditComponent,
    AssetsComponent,
    SpotOrdersComponent,
    PendingOrdersComponent,
    AssetsMergedComponent,
    CcyQuotesComponent,
    MoneyPipe,
    MoneySumPipe,
    EffectDigitsPipe,
    RoundDownPipe,
    RawPercentPipe,
    BignumZhPipe,
    TruncatePipe,
    LastTransComponent,
    LastTransEditComponent,
    InstPriceComponent,
    CcyMetaComponent,
    ThemeSwitchComponent,
    SyncResultDialogComponent,
    SyncResultGroupDialogComponent,
    ExapiEditComponent,
    ExapisComponent,
    OrderFormComponent,
    StrategiesComponent,
    StrategyNewComponent,
    StrategyEditComponent,
    HistoryStrategiesComponent,
    KlineChartComponent,
    KlineChartDialogComponent,
    SpotOrdersDialogComponent,
    OrderDetailDialogComponent,
    StrategyEditManyComponent,
    StrategyEditCandidatesComponent,
    SnapshotsChartComponent,
    AssetsStructureComponent,
    OrdersChartComponent,
    StrategyDetailDialogComponent,
    SnapshotsComponent,
    CcyQuoteDialogComponent,
    CcyInfoDialogComponent,
    CcyPairsDialogComponent,
    AssetsDialogComponent,
    AssetsClearoutDialogComponent,
    PendingOrdersDialogComponent,
    Rolling24hPriceComponent,
    StrategiesDialogComponent,
    StrategyEditDialogComponent,
    CcyListingsComponent
  ],
  entryComponents: [],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
