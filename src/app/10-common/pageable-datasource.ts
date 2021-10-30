import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject, EMPTY } from 'rxjs';
import { ModelCurdService } from '../services/model-curd.service';
import { QueryParams } from '../models/query-params';


export class PageableDatasource<T> extends DataSource<T> {

  paginator: MatPaginator;
  sort: MatSort;
  filter: any;

  data: T[];
  total: number;

  paramsTransformer: (params: any) => any;

  protected reloadEmitter: BehaviorSubject<number> = new BehaviorSubject<number>(1);

  constructor(private service: ModelCurdService<T>) {
    super();
  }


  connect(): Observable<T[]> {
    const dataMutations = [
      this.reloadEmitter,
      this.paginator.page,
      this.sort.sortChange
    ];

    return merge(...dataMutations).pipe(switchMap(() => {
      const params = new QueryParams();
      if (this.filter) {
        let filter = this.filter;
        if (this.paramsTransformer) {
          filter = this.paramsTransformer(filter);
        }
        Object.assign(params, filter);
      }

      if (this.sort.active && this.sort.direction !== '') {
        params.sort = this.sort.active;
        let dir = this.sort.direction;
        params.sortDir = dir.toUpperCase();
      }

      let pag = this.paginator;
      params.page = pag.pageIndex;
      params.pageSize = pag.pageSize;

      return this.service.page2(null, params)
        .pipe(
          map((cl) => {
            this.total = cl.count;
            this.data = cl.list;
            return cl.list;
          }),
          catchError(err => EMPTY)
        );
    }));
  }

  refresh(filter?: any) {
    if (filter) {
      this.filter = filter;
    }
    this.paginator.pageIndex = 0;
    this.reloadEmitter.next(1);
  }

  disconnect() {
  }

}
