import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTable} from '@angular/material/table';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';

import {User} from '../../models/sys/user';
import {TableDatasource} from '../../common/table-datasource';
import {Result} from '../../models/result';
import {UserEditComponent} from './user-edit.component';
import {UserPwdResetComponent} from './user-pwd-reset.component';
import {SessionSupportComponent} from '../../common/session-support.component';
import {SessionService} from '../../services/sys/session.service';
import {UserService} from '../../services/sys/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<User>;

  dataSource: TableDatasource<User>;

  displayedColumns: string[] = ['index', 'username', 'role', 'email', 'createdAt', 'actions'];

  constructor(protected sessionService: SessionService,
              private userService: UserService,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<User>();
  }

  protected withSession(user: User) {
    this.dataSource.setObservable(this.userService.list2());
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }


  edit(user) {
    const dialogRef: MatDialogRef<UserEditComponent, User> = this.dialog.open(
      UserEditComponent, {
        disableClose: true,
        width: '480px',
        maxWidth: '90vw',
        data: user
      });

    const isNewRecord = !user.id;
    dialogRef.afterClosed().subscribe((user1: User) => {
      console.log(user1);
      if (!user1) {
        return;
      }
      if (isNewRecord) {
        this.dataSource.append(user1);
      } else {
        // this.dataSource.update(user1);
      }
    });
  }

  editNew() {
    const user = new User();
    this.edit(user);
  }

  remove(user: User) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.userService.remove(user)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.userService.showError(opr);
          return;
        }
        this.dataSource.remove(user);
      });
  }

  resetPwd(user) {
    this.dialog.open(
      UserPwdResetComponent, {
        disableClose: true,
        width: '480px',
        maxWidth: '90vw',
        data: {user}
      });
  }
}
