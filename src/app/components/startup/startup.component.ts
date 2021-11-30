import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from "@angular/core";

@Component({
  selector: "app-startup",
  templateUrl: "./startup.component.html",
  styleUrls: ["./startup.component.css"],
})
export class StartupComponent implements OnInit, AfterViewInit {
  @ViewChild("directoryInput") fileInputElementRef!: ElementRef;

  public selectedDirectory: string | undefined;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const fileInputElement: HTMLInputElement =
      this.fileInputElementRef.nativeElement;

    fileInputElement.onchange = () => {
      if (fileInputElement.files?.length) {
        const selectedPath: string = (fileInputElement.files[0] as any).path;
        this.selectedDirectory = selectedPath;
        console.log(
          (window as any).sendSynchronousMessage("resolvePath", selectedPath)
        );
      }
    };
  }
}
