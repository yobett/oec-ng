import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';

import { AppMaterialModule } from './app-material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { UsersComponent } from './sys/user/users.component';
import { LoginDialogComponent } from './sys/account/login-dialog.component';
import { UserDetailComponent } from './sys/user/user-detail.component';
import { ChangePwdComponent } from './sys/account/change-pwd.component';
import { UserEditComponent } from './sys/user/user-edit.component';
import { UserPwdResetComponent } from './sys/user/user-pwd-reset.component';
import { MessageDialogComponent } from './common/message-dialog/message-dialog.component';
import { ExchsComponent } from './sys/exch/exchs.component';
import { DateStringPipe } from './common/pipe/date-string.pipe';
import { ExchEditComponent } from './sys/exch/exch-edit.component';
import { CcysComponent } from './mar/ccy/ccys.component';
import { CcyEditComponent } from './mar/ccy/ccy-edit.component';
import { PairsComponent } from './mar/pair/pairs.component';
import { PairEditComponent } from './mar/pair/pair-edit.component';
import { AssetsComponent } from './per/asset/assets.component';
import { SpotOrdersComponent } from './per/order/spot-orders.component';
import { PendingOrdersComponent } from './per/order/pending-orders.component';
import { AssetsMergedComponent } from './per/asset/assets-merged.component';
import { CcyQuotesComponent } from './mar/ccy-quote/ccy-quotes.component';
import { MoneyPipe } from './common/pipe/money.pipe';
import { LastTransComponent } from './per/last-trans/last-trans.component';
import { LastTransEditComponent } from './per/last-trans/last-trans-edit.component';
import { InstPriceComponent } from './mar/pair-inst-price/inst-price.component';
import { RawPercentPipe } from './common/pipe/raw-percent.pipe';
import { MoneySumPipe } from './common/pipe/moneysum.pipe';
import { CcyMetaComponent } from './mar/ccy/ccy-meta.component';
import { ThemeSwitchComponent } from './home/theme-switch.component';
import { SyncResultDialogComponent } from './common/sync-result/sync-result-dialog.component';
import { SyncResultGroupDialogComponent } from './common/sync-result/sync-result-group-dialog.component';
import { ExapiEditComponent } from './sys/exapi/exapi-edit.component';
import { ExapisComponent } from './sys/exapi/exapis.component';
import { TruncatePipe } from './common/pipe/truncate.pipe';
import { OrderFormComponent } from './per/order-form/order-form.component';
import { EffectDigitsPipe } from './common/pipe/effect-digits-pipe';
import { StrategiesComponent } from './str/strategy/strategies.component';
import { StrategyNewComponent } from './str/strategy/strategy-new.component';
import { StrategyEditComponent } from './str/strategy/strategy-edit.component';
import { HistoryStrategiesComponent } from './str/strategy-history/history-strategies.component';
import { ServiceModule } from './services/service.module';
import { KlineChartComponent } from './mar/kline-chart/kline-chart.component';
import { KlineChartDialogComponent } from './mar/kline-chart/kline-chart-dialog.component';
import { SpotOrdersDialogComponent } from './per/order/spot-orders-dialog.component';
import { OrderDetailDialogComponent } from './per/order/order-detail-dialog.component';
import { StrategyEditManyComponent } from './str/strategy/strategy-edit-many.component';
import { StrategyEditCandidatesComponent } from './str/strategy/strategy-edit-candidates.component';
import { SnapshotsChartComponent } from './per/asset-snapshot/snapshots-chart.component';
import { AssetsStructureComponent } from './per/asset/assets-structure.component';
import { OrdersChartComponent } from './per/order-chart/orders-chart.component';


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
    RawPercentPipe,
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
    OrdersChartComponent
  ],
  entryComponents: [],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
