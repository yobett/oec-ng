import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CcyMeta, CcyMetaUrls } from '../../models/mar/ccy-meta';
import { Ccy } from '../../models/mar/ccy';
import { StaticResource } from '../../config';
import { CcyService } from '../../services/mar/ccy.service';

@Component({
  selector: 'app-ccy-meta',
  templateUrl: './ccy-meta.component.html',
  styleUrls: ['./ccy-meta.component.css']
})
export class CcyMetaComponent {

  ccy: Ccy;
  meta: CcyMeta;
  linkItems: { name: string, links: string[] }[];

  staticBase = StaticResource.BASE;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.ccy = data.ccy;
    this.meta = data.meta;
    const urls = this.meta.urls;
    this.linkItems = [];
    for (const [name, linksName] of [
      ['Website', 'website'],
      ['Twitter', 'twitter'],
      ['Message Board', 'message_board'],
      ['Chat', 'chat'],
      ['Explorer', 'explorer'],
      ['Reddit', 'reddit'],
      ['Technical Doc', 'technical_doc'],
      ['Source Code', 'source_code'],
      ['Announcement', 'announcement'],
    ]) {
      const links = urls[linksName];
      if (links && links.length > 0) {
        this.linkItems.push({name, links});
      }
    }
  }

  static showMetadata(ccy: string, ccyService: CcyService, dialog: MatDialog) {
    ccyService.getMetadata(ccy)
      .subscribe((meta: CcyMeta) => {
          dialog.open(
            CcyMetaComponent, {
              // disableClose: true,
              width: '640px',
              maxWidth: '90vw',
              data: {ccy, meta}
            });
        }
      );
  }

}
