import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/style/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private themeService: ThemeService) {
  }

  ngOnInit(): void {
    this.themeService.setDefaultTheme();
  }

}
