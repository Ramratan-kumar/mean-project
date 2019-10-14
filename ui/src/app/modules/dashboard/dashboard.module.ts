import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DashboardRoutingModule } from './dashboar.routing.module';
import { DashboardComponent } from './dashboard.component';


@NgModule({
    imports: [CommonModule,DashboardRoutingModule],
    declarations: [DashboardComponent],
    providers: []
})

export class DashboardModule {}