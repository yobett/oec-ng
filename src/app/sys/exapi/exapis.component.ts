import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { Exapi } from '../../models/sys/exapi';
import { Result } from '../../models/result';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { ExapiEditComponent } from './exapi-edit.component';
import { TableDatasource } from '../../common/table-datasource';
import { ExapiService } from '../../services/sys/exapi.service';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';


@Component({
  selector: 'app-exapis',
  templateUrl: './exapis.component.html',
  styleUrls: ['./exapis.component.css']
})
export class ExapisComponent extends SessionSupportComponent implements AfterViewInit, OnInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Exapi>;

  dataSource: TableDatasource<Exapi>;

  displayedColumns: string[] = ['ex', 'phase', 'key', 'secret', 'createdAt', 'updatedAt', 'enabled', 'memo', 'actions'];


  processes: { [name: string]: boolean } = {};
  $exchs: Observable<Exch[]>;


  constructor(protected sessionService: SessionService,
              private exapiService: ExapiService,
              private exchService: ExchService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<Exapi>();
  }

  protected withSession(user: User) {
    this.dataSource.setObservable(this.exapiService.list2())
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  edit(exapi: Exapi) {
    if (!this.$exchs) {
      this.$exchs = this.exchService.list2();
    }
    const dialogRef: MatDialogRef<ExapiEditComponent, Exapi> = this.dialog.open(
      ExapiEditComponent, {
        disableClose: true,
        width: '480px',
        maxWidth: '90vw',
        data: {exapi, $exchs: this.$exchs}
      });

    const isNewRecord = !exapi.id;
    dialogRef.afterClosed().subscribe((exapi1: Exapi) => {
      // console.log(exapi1);
      if (!exapi1) {
        return;
      }
      if (isNewRecord) {
        this.dataSource.append(exapi1);
      }
    });
  }

  editNew() {
    const exapi = new Exapi();
    exapi.ex = Exapi.EX_CMC;
    exapi.enabled = true;
    this.edit(exapi);
  }

  remove(exapi: Exapi) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.exapiService.remove(exapi)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.exapiService.showError(opr);
          return;
        }
        this.dataSource.remove(exapi);
      });
  }

}
