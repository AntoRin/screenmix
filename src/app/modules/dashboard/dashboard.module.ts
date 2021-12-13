import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PrimengModule } from "../primeng/primeng.module";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { DashboardRoutingModule } from "./dashboard-routing.module";
import { GalleryComponent } from "./components/gallery/gallery.component";
import { SharedModule } from "../shared/shared.module";
import { TopMenuComponent } from "./components/top-menu/top-menu.component";
import { SettingsComponent } from "./settings/settings.component";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [
    DashboardComponent,
    GalleryComponent,
    TopMenuComponent,
    SettingsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    DashboardRoutingModule,
    PrimengModule,
    SharedModule,
  ],
})
export class DashboardModule {}
