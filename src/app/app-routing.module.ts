import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { StartupComponent } from "./components/startup/startup.component";

const routes: Routes = [
  {
    path: "",
    component: StartupComponent,
    pathMatch: "full",
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
