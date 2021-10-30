import { NgModule, Provider } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { JwtModule } from '@auth0/angular-jwt';

import { UserService } from './sys/user.service';
import { SessionService } from './sys/session.service';
import { UserProfileService } from './sys/user-profile.service';
import { ExchService } from './sys/exch.service';
import { CcyService } from './mar/ccy.service';
import { PairService } from './mar/pair.service';
import { AssetService } from './per/asset.service';
import { SpotOrderService } from './per/spot-order.service';
import { DataSyncService } from './sys/data-sync.service';
import { QuoteService } from './mar/quote.service';
import { EffectDigitsPipe } from '../10-common/pipe/effect-digits-pipe';
import { LastTransService } from './per/last-trans.service';
import { ThemeService } from './style/theme.service';
import { StyleManagerService } from './style/style-manager.service';
import { ExapiService } from './sys/exapi.service';
import { KlineService } from './mar/kline.service';
import { StrategyService } from './str/strategy.service';
import { StrategyHistoryService } from './str/strategy-history.service';
import { LocalStorageKeys, DATE_FORMATS, PaginatorIntl } from '../config';
import { AssetSnapshotService } from './per/asset-snapshot.service';
import { NotificationService } from './sys/notification.service';
import { RoundDownPipe } from '../10-common/pipe/round-down-pipe';


@NgModule({
  imports: [
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => localStorage.getItem(LocalStorageKeys.AccessToken),
        allowedDomains: ['localhost'],
        // disallowedRoutes: [""],
      },
    }),
  ],
  declarations: [],
  providers: [
    UserService,
    SessionService,
    UserProfileService,
    ExchService,
    CcyService,
    PairService,
    AssetService,
    AssetSnapshotService,
    SpotOrderService,
    DataSyncService,
    QuoteService,
    DecimalPipe,
    PercentPipe,
    EffectDigitsPipe,
    RoundDownPipe,
    LastTransService,
    ThemeService,
    StyleManagerService,
    ExapiService,
    KlineService,
    StrategyService,
    StrategyHistoryService,
    NotificationService,
    {provide: MatPaginatorIntl, useValue: PaginatorIntl},
    {provide: MAT_DATE_LOCALE, useValue: 'zh-cn'},
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS},
    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2000, verticalPosition: 'top'}}
  ],
  exports: []
})
export class ServiceModule {
}
