import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { DashboardComponent } from "./components/dashboard/dashboard.component";

@NgModule({
   declarations: [],
   imports: [
      RouterModule.forChild([
         {
            path: "",
            component: DashboardComponent,
         },
      ]),
   ],
})
export class DashboardRoutingModule {}
