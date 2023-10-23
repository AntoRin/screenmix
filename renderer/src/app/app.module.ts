import { ErrorHandler, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { PrimengModule } from "./modules/primeng/primeng.module";

import { SharedModule } from "./modules/shared/shared.module";
import { ErrorHandlerService } from "./modules/shared/services/error-handler.service";

@NgModule({
   declarations: [AppComponent],
   imports: [BrowserModule, BrowserAnimationsModule, DashboardModule, AppRoutingModule, PrimengModule, SharedModule],
   providers: [{ provide: ErrorHandler, useClass: ErrorHandlerService }],
   bootstrap: [AppComponent],
})
export class AppModule {}
