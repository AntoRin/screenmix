import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { StartupComponent } from "./components/startup/startup.component";

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([
      {
        path: "dashboard",
        component: DashboardComponent,
      },
      {
        path: "",
        component: StartupComponent,
      },
    ]),
  ],
})
export class DashboardRoutingModule {}
