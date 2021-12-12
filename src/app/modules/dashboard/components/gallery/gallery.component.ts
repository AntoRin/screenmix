import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { Subject } from "rxjs";
import { CaptureMode, ProcessNotification } from "../../../../types";
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

  public videoCaptureInProgress: boolean = false;
  private _processNotificationSubject: Subject<ProcessNotification> =
    new Subject<ProcessNotification>();
  private _streamRef: MediaStream | undefined;

  constructor(
    private _sanitizer: DomSanitizer,
    private _progressBarService: ProgressBarService
  ) {}

  ngOnInit(): void {
    this.getGallery();
  }

  getGallery() {
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

  @HostListener("window:message", ["$event"])
  handleScreenEvents(event: MessageEvent) {
    switch (event.data) {
      case "fromMain:takeScreenshot":
        return this.captureScreen("image");

      case "fromMain:captureScreen":
        if (this.videoCaptureInProgress)
          return this._processNotificationSubject.next("stopVideoCapture");

        this.captureScreen("video");
    }
  }

  async captureScreen(mode: CaptureMode): Promise<void> {
    try {
      let stream: MediaStream;

      if (this._streamRef?.active) {
        stream = this._streamRef.clone();
      } else {
        const srcId = await window.rendererProcessctrl.getDesktopSourceId();

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: srcId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080,
            },
          } as any,
        });

        this._streamRef = stream;
      }

      if (mode === "image") return this.handleImageCapture(stream);

      if (mode === "video") return this.handleVideoCapture(stream);
    } catch (error) {
      console.log(error);
    }
  }

  recordStream(stream: MediaStream, successCb: Function, failureCb: Function) {
    try {
      const recorder: MediaRecorder = new MediaRecorder(stream);

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };

      this._processNotificationSubject.asObservable().subscribe((status) => {
        if (status === "stopVideoCapture" && recorder.state === "recording") {
          recorder.stop();
        } else {
          recorder.onstart = () => recorder.stop();
        }
      });

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
    } catch (error) {
      failureCb(error);
    }
  }

  async handleVideoCapture(stream: MediaStream) {
    try {
      this.videoCaptureInProgress = true;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        this.recordStream(stream, resolve, reject);
      });

      this.destroyMediaStream(stream);

      this.videoCaptureInProgress = false;

      await window.rendererProcessctrl.saveCapture({
        dataUrl,
        mode: "video",
      });

      this.getGallery();
    } catch (error) {
      throw error;
    }
  }

  async handleImageCapture(stream: MediaStream) {
    try {
      const videoElement: HTMLVideoElement = document.createElement("video");

      videoElement.style.width = "1920px";
      videoElement.style.height = "1080px";

      videoElement.onloadedmetadata = async (e) => {
        videoElement.play();

        const canvas = document.createElement("canvas");
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");

        ctx!.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/png");

        this.destroyMediaStream(stream);
        videoElement.remove();
        canvas.remove();

        await window.rendererProcessctrl.saveCapture({
          dataUrl: imageDataUrl,
          mode: "image",
        });

        this.getGallery();
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
