import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Demo';
  showFooterAndHeader: boolean;
  constructor(private route: Router) {
    const url = window.location.href.split('/').pop();
    this.showFooterAndHeader = (url === 'login' || url === 'register') ? false : true;
    console.log(this.route.url);
   }
  ngOnInit() {
    
  }
}
