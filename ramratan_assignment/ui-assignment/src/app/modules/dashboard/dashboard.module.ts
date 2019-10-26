import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DashboardRoutingModule } from './dashboar.routing.module';
import { DashboardComponent } from './dashboard.component';
import { FormsModule } from '@angular/forms';


@NgModule({
    imports: [CommonModule,DashboardRoutingModule,FormsModule],
    declarations: [DashboardComponent],
    providers: []
})

export class DashboardModule {}