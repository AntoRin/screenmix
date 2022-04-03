import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { PreviewPaneComponent } from "./components/preview-pane/preview-pane.component";
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
        path: "preview-pane",
        component: PreviewPaneComponent,
      },
      {
        path: "",
        component: StartupComponent,
      },
    ]),
  ],
})
export class DashboardRoutingModule {}
