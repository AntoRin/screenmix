import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuModule } from "primeng/menu";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [MenuModule, CardModule, ButtonModule],
})
export class PrimengModule {}
