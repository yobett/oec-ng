export class Result {
  // 成功
  static CODE_SUCCESS = 0;

  // 未登录
  static CODE_NOT_AUTHENTICATED = 401;

  // 无操作权限
  static CODE_NOT_AUTHORIZED = 461;

  static GENERAL_FAILURE_MESSAGE = '操作失败';

  code: number;
  message?: string;

}

export class ValueResult<T> extends Result {

  value?: T;

}

export class ListResult<T> extends Result {

  list?: T[];

}

export class CountListResult<T> extends Result {

  countList?: CountList<T>;

}

export interface CountList<T> {
  count: number;
  list: T[],
}
