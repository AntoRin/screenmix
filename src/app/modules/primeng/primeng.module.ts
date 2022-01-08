import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuModule } from "primeng/menu";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { MenubarModule } from "primeng/menubar";
import { InputTextModule } from "primeng/inputtext";
import { ImageModule } from "primeng/image";
import { BlockUIModule } from "primeng/blockui";
import { TagModule } from "primeng/tag";
import { TabViewModule } from "primeng/tabview";
import { FieldsetModule } from "primeng/fieldset";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { DividerModule } from "primeng/divider";
import { SplitButtonModule } from "primeng/splitbutton";

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
    BlockUIModule,
    TagModule,
    TabViewModule,
    FieldsetModule,
    DialogModule,
    DropdownModule,
    DividerModule,
    SplitButtonModule,
  ],
})
export class PrimengModule {}
