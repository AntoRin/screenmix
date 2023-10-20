import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { DashboardTab } from "../../../../../../../common/types";
import { ProgressBarService } from "../../../shared/services/progress-bar.service";

@Component({
   selector: "app-startup",
   templateUrl: "./startup.component.html",
   styleUrls: ["./startup.component.css"],
})
export class StartupComponent implements OnInit {
   @Output() public tabChangeEvent: EventEmitter<DashboardTab> = new EventEmitter<DashboardTab>();

   public mediaDirectories: string[] = [];
   public baseDirectory: string | undefined;

   constructor(private _progressBarService: ProgressBarService) {}

   ngOnInit(): void {
      this.getBaseDirectory();
      this.getMediaDirectories();
   }

   async getBaseDirectory() {
      try {
         this._progressBarService.toggleOn();
         this.baseDirectory = await window.rendererProcessCtrl.invoke("ipc:getBaseDirectory");
      } catch (error) {
      } finally {
         this._progressBarService.toggleOff();
      }
   }

   async getMediaDirectories() {
      try {
         this._progressBarService.toggleOn();
         this.mediaDirectories = await window.rendererProcessCtrl.invoke("ipc:getMediaDirectories");
      } catch (error) {
      } finally {
         this._progressBarService.toggleOff();
      }
   }

   async selectDirectory(): Promise<void> {
      try {
         await window.rendererProcessCtrl.invoke("ipc:addMediaDirectory");
         this.getMediaDirectories();
      } catch (error) {}
   }

   async navigateToWorkspace(idx: number) {
      try {
         await window.rendererProcessCtrl.invoke("ipc:setBaseDirectory", this.mediaDirectories[idx]);
         this.tabChangeEvent.emit("gallery");
      } catch (error) {}
   }

   async removeMediaDir(dir: string) {
      try {
         await window.rendererProcessCtrl.invoke("ipc:removeMediaDirectory", dir);
         this.getMediaDirectories();
      } catch (error) {}
   }

   baseName(path: string) {
      const splits = (path || "").split("\\");
      return splits[splits.length - 1];
   }
}
