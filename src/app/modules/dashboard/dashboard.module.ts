import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DashboardHeaderComponent } from "./components/dashboard-header/dashboard-header.component";
import { DashboardNavComponent } from "./components/dashboard-nav/dashboard-nav.component";
import { PrimengModule } from "../primeng/primeng.module";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { DashboardRoutingModule } from "./dashboard-routing.module";
import { GalleryComponent } from './components/gallery/gallery.component';

@NgModule({
  declarations: [
    DashboardHeaderComponent,
    DashboardNavComponent,
    DashboardComponent,
    GalleryComponent,
  ],
  imports: [CommonModule, DashboardRoutingModule, PrimengModule],
})
export class DashboardModule {}
