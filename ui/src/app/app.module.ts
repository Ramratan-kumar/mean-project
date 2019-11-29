import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginModule } from './modules/login/login.module';
//import { HttpService } from './service/https_service/HttpService';
import { HttpClientModule } from '@angular/common/http';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CookieService } from 'ngx-cookie-service';
//import { SharedModule } from './shared/shared.module'
import { LoadingModule } from './loading/loading.module';
import { ChatBoxModule } from './modules/chat-box/chat-box.model';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { AngularFontAwesomeModule } from 'angular-font-awesome';

const socketConfig: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    
    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SocketIoModule.forRoot(socketConfig),
    HttpClientModule,
    AngularFontAwesomeModule,
    //SharedModule,
    AppRoutingModule,
    LoginModule,
    DashboardModule,
    LoadingModule,
    ChatBoxModule
    
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
