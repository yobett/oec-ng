export class SyncResult {
  create = 0;
  update = 0;
  skip = 0;
}

export interface SyncResultGroup {
  [ex: string]: SyncResult;
}
