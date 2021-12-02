import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuModule } from "primeng/menu";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { MenubarModule } from "primeng/menubar";
import { InputTextModule } from "primeng/inputtext";
import { ImageModule } from "primeng/image";

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [
    MenuModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    MenubarModule,
    InputTextModule,
    ImageModule,
  ],
})
export class PrimengModule {}
