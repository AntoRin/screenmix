import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PrimengModule } from "../primeng/primeng.module";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { DashboardRoutingModule } from "./dashboard-routing.module";
import { GalleryComponent } from "./components/gallery/gallery.component";
import { SharedModule } from "../shared/shared.module";
import { SettingsComponent } from "./components/settings/settings.component";
import { FormsModule } from "@angular/forms";
import { ImageViewerComponent } from "./components/image-viewer/image-viewer.component";
import { StartupComponent } from "./components/startup/startup.component";

@NgModule({
  declarations: [
    StartupComponent,
    DashboardComponent,
    GalleryComponent,
    SettingsComponent,
    ImageViewerComponent,
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
