import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { CaptureMode } from "../../../../types";
import { ProgressBarService } from "../../../shared/services/progress-bar.service";

@Component({
  selector: "app-gallery",
  templateUrl: "./gallery.component.html",
  styleUrls: ["./gallery.component.css"],
})
export class GalleryComponent implements OnInit {
  @Input() baseDirectory: string | undefined;
  imagePaths: string[] = [];

  @ViewChild("videoContainer") vidRef!: ElementRef;
  testImg: string = "";

  constructor(
    private _sanitizer: DomSanitizer,
    private _progressBarService: ProgressBarService
  ) {}

  ngOnInit(): void {
    this._progressBarService.toggleOn();

    window.rendererProcessctrl
      .listScreenshotPaths(this.baseDirectory)
      .then((paths: string[]) => {
        this.imagePaths = paths.map(
          (x) => this._sanitizer.bypassSecurityTrustResourceUrl(x) as string
        );

        this._progressBarService.toggleOff();
      })
      .catch((e) => {});
  }

  @HostListener("window:keydown", ["$event"])
  handleHotKeyDown(event: KeyboardEvent): void {
    if (event.key === "Home") {
      this.captureScreen("video");
    }

    if (event.key === "Insert") {
      this.captureScreen("image");
    }
  }

  async captureScreen(mode: CaptureMode): Promise<void> {
    try {
      const sourceId = await window.rendererProcessctrl.getDesktopSourceId();

      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720,
          },
        } as any,
      });

      if (mode === "image") return this.handleImageCapture(stream);

      if (mode === "video") return this.handleVideoCapture(stream);
    } catch (error) {
      console.log(error);
    }
  }

  recordStream(stream: MediaStream, successCb: Function, failureCb: Function) {
    try {
      const recordTime = 5000;

      const recorder: MediaRecorder = new MediaRecorder(stream);

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };

      recorder.start();

      recorder.onstop = async (e) => {
        try {
          const completeBlob = new Blob(chunks, { type: "video/mp4" });

          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (!event.target?.result) return reject("READ_ERROR");
              resolve(event.target.result as string);
            };
            reader.readAsDataURL(completeBlob);
          });

          successCb(dataUrl);
        } catch (error) {
          failureCb(error);
        }
      };

      setTimeout(() => recorder.stop(), recordTime);
    } catch (error) {
      failureCb(error);
    }
  }

  async handleVideoCapture(stream: MediaStream) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        this.recordStream(stream, resolve, reject);
      });

      this.destroyMediaStream(stream);

      await window.rendererProcessctrl.saveCapture({
        dataUrl,
        mode: "video",
      });
    } catch (error) {
      throw error;
    }
  }

  async handleImageCapture(stream: MediaStream) {
    try {
      const videoElement: HTMLVideoElement = this.vidRef.nativeElement;

      videoElement.onloadedmetadata = async (e) => {
        videoElement.play();

        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");

        ctx!.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/png");

        this.testImg = imageDataUrl;

        this.destroyMediaStream(stream);

        await window.rendererProcessctrl.saveCapture({
          dataUrl: imageDataUrl,
          mode: "image",
        });
      };

      videoElement.srcObject = stream;
    } catch (error) {
      throw error;
    }
  }

  async destroyMediaStream(stream: MediaStream) {
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch (error) {
      throw error;
    }
  }
}
