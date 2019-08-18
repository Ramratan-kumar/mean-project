import { NgModule } from '@angular/core'
import { DashboardRoutingModule } from './dashboar.routing.module';
import { DashboardComponent } from './dashboard.component';

@NgModule({
    imports: [DashboardRoutingModule],
    declarations: [DashboardComponent],
    providers: []
})

export class DashboardModule {}