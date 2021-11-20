import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SessionSupportComponent } from '../../10-common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { CcyService } from '../../services/mar/ccy.service';
import { Ccy } from '../../models/mar/ccy';
import { PageableDatasource } from '../../10-common/pageable-datasource';
import { CcyInfoDialogComponent } from '../ccy/ccy-info-dialog.component';
import { CcyListingItem, ListingOptions } from '../../models/mar/ccy-listing-item';
import { CcyListingService } from '../../services/mar/ccy-listing.service';
import { Result } from '../../models/result';


@Component({
  selector: 'app-ccy-listings',
  templateUrl: './ccy-listings.component.html',
  styleUrls: ['./ccy-listings.component.css']
})
export class CcyListingsComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<CcyListingItem>;

  dataSource: PageableDatasource<CcyListingItem>;

  displayedColumns: string[] = ['index', 'concerned', 'symbol', 'name', 'cmc_rank',
    'date_added', 'max_supply', 'circulating_supply',
    'volume_24h', 'price', 'percent_change_1h', 'percent_change_24h', 'percent_change_7d'];

  CoinLogoPath = Ccy.LogoPath;

  volume24hMinOptions = [
    {value: undefined, label: '不限'},
    {value: 1e6, label: '> 100万'},
    {value: 1e8, label: '> 1 亿'}
  ];
  filterForm: ListingOptions = {volume_24h_min: this.volume24hMinOptions[1].value};

  ranking = 'market_cap'; // date_added,market_cap;
  currentRanking: string;

  processes: { [name: string]: boolean } = {};

  constructor(protected sessionService: SessionService,
              private ccyService: CcyService,
              private ccyListingService: CcyListingService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new PageableDatasource<CcyListingItem>(this.ccyListingService);
  }

  protected withSession(user: User) {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.filter = this.filterForm;
    this.table.dataSource = this.dataSource;

    this.filter();
  }

  filter() {
    const ranking = this.ranking;
    let sort = ranking;
    let dir = 'desc';
    const ci = ranking.indexOf(':');
    if (ci > 0) {
      sort = ranking.substring(0, ci);
      dir = ranking.substring(ci + 1);
    }
    this.filterForm.sort = sort;
    this.filterForm.sort_dir = dir;

    this.dataSource.oneShotOnLoaded = () => {
      this.currentRanking = ranking;
    };
    this.dataSource.refresh(this.filterForm);
  }

  toggleConcern(ccy: Ccy) {
    const ori = ccy.concerned;
    this.ccyService.updateConcerned(ccy.id, !ori)
      .subscribe((opr: Result) => {
        if (opr.code === Result.CODE_SUCCESS) {
          ccy.concerned = !ori;
          this.snackBar.open(ori ? '已取消关注' : '已加入关注');
        }
      });
  }

  showBaseCcyInfo(symbol: string) {
    CcyInfoDialogComponent.showCcyInfo(symbol, this.ccyService, this.dialog);
  }

}
