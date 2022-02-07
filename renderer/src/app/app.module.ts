import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { PrimengModule } from "./modules/primeng/primeng.module";
import { StartupComponent } from "./components/startup/startup.component";
import { SharedModule } from "./modules/shared/shared.module";

@NgModule({
  declarations: [AppComponent, StartupComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DashboardModule,
    AppRoutingModule,
    PrimengModule,
    SharedModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
