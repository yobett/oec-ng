import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTable} from '@angular/material/table';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

import {Exch} from '../../models/sys/exch';
import {TableDatasource} from '../../common/table-datasource';
import {SessionSupportComponent} from '../../common/session-support.component';
import {SessionService} from '../../services/sys/session.service';
import {ExchService} from '../../services/sys/exch.service';
import {User} from '../../models/sys/user';
import {ExchEditComponent} from './exch-edit.component';

@Component({
  selector: 'app-exchs',
  templateUrl: './exchs.component.html',
  styleUrls: ['./exchs.component.css']
})
export class ExchsComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Exch>;

  dataSource: TableDatasource<Exch>;

  displayedColumns: string[] = ['index', 'code', 'name', 'createdAt', 'actions'];

  constructor(protected sessionService: SessionService,
              private exchService: ExchService,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<Exch>();
  }

  protected withSession(user: User) {
    this.dataSource.setObservable(this.exchService.list2());
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }


  edit(exch) {
    const dialogRef: MatDialogRef<ExchEditComponent, Exch> = this.dialog.open(
      ExchEditComponent, {
        disableClose: true,
        width: '480px',
        data: exch
      });

    const isNewRecord = !exch.id;
    dialogRef.afterClosed().subscribe((exch1: Exch) => {
      console.log(exch1);
    });
  }

}
