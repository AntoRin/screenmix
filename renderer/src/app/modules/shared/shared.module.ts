import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { PrimengModule } from "../primeng/primeng.module";
import { ProgressBarComponent } from "./components/progress-bar/progress-bar.component";

@NgModule({
   declarations: [ProgressBarComponent],
   imports: [CommonModule, PrimengModule],
   exports: [ProgressBarComponent],
})
export class SharedModule {}
