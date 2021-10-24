import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { map } from 'rxjs/operators';
import { Observable, merge, BehaviorSubject } from 'rxjs';


export class TableDatasource<T> extends DataSource<T> {
  data: T[] = [];
  dataSubject: BehaviorSubject<T[]> = new BehaviorSubject<T[]>(this.data);

  paginator?: MatPaginator;
  sort: MatSort;

  compareFieldMappers: { [column: string]: (s: T) => any };


  setData(data: T[]) {
    this.data = data;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.dataSubject.next(data);
  }

  setPromise(pro: Promise<T[]>) {
    pro.then(data => {
      this.setData(data);
    });
  }

  setObservable(obs: Observable<T[]>) {
    obs.subscribe(data => {
      this.setData(data);
    });
  }

  connect(): Observable<T[]> {
    const dataMutations = [
      this.dataSubject,
      this.paginator?.page,
      this.sort?.sortChange
    ].filter(e => e);

    return merge(...dataMutations).pipe(map(() => {
      const sortedData = this.getSortedData([...this.data]);
      if (this.paginator) {
        return this.getPagedData(sortedData);
      } else {
        return sortedData;
      }
    }));
  }

  disconnect() {
  }

  protected getPagedData(data: T[]) {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  protected getSortedData(data: T[]) {
    if (!this.sort) {
      return data;
    }
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';

      const column = this.sort.active;
      if (this.compareFieldMappers) {
        const fieldMapper = this.compareFieldMappers[column];
        if (fieldMapper) {
          return compare(fieldMapper(a), fieldMapper(b), isAsc);
        }
      }
      const fieldA = a[column];
      const fieldB = b[column];
      if (typeof fieldA === 'undefined' || typeof fieldB === 'undefined') {
        return 0;
      }
      return compare(fieldA, fieldB, isAsc);
    });
  }

  append(model: T) {
    this.data.push(model);
    this.setData(this.data);
  }

  remove(model: T) {
    const index = this.data.indexOf(model);
    if (index === -1) {
      return;
    }
    this.data.splice(index, 1);
    this.setData(this.data);
  }

}

function compare(a: any, b: any, isAsc: boolean) {
  if (a === b) {
    return 0;
  }
  if (a == null) {
    return isAsc ? -1 : 1;
  } else if (b == null) {
    return isAsc ? 1 : -1;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    const r = a.localeCompare(b);
    return isAsc ? r : -r;
  }
  return isAsc ? (a < b ? -1 : 1) : (a < b ? 1 : -1);
}
