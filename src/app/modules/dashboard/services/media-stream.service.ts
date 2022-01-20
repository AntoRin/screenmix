import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { CaptureMode, ProcessNotification } from "../../../../common/types";

@Injectable({
  providedIn: "root",
})
export class MediaStreamService {
  private _videoCaptureInProgress: boolean = false;
  private _processNotificationSubject: Subject<ProcessNotification> =
    new Subject<ProcessNotification>();
  private _streamRef: MediaStream | undefined;

  streamNotifications$ = new Subject<"videoCaptureStart" | "videoCaptureEnd">();

  constructor() {}

  get videoCaptureInProgress() {
    return this._videoCaptureInProgress;
  }

  set videoCaptureInProgress(status) {
    if (status) {
      this.streamNotifications$.next("videoCaptureStart");
    } else {
      this.streamNotifications$.next("videoCaptureEnd");
    }
    this._videoCaptureInProgress = status;
  }

  async captureScreen(mode: CaptureMode, resolution: string): Promise<void> {
    try {
      if (this.videoCaptureInProgress && mode === "video")
        return this._processNotificationSubject.next("stopVideoCapture");

      let stream: MediaStream;

      const [width, height] = resolution.split(/[^0-9]/g);

      console.log(width, height);

      if (isNaN(Number(width)) || isNaN(Number(height))) {
        throw new Error("INVALID_RESOLUTION");
      }

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
              minWidth: width,
              maxWidth: width,
              minHeight: height,
              maxHeight: height,
            },
          } as any,
        });

        this._streamRef = stream;
      }

      if (mode === "image")
        return this.handleImageCapture(stream, [+width, +height]);

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
    } catch (error) {
      throw error;
    }
  }

  async handleImageCapture(
    stream: MediaStream,
    [width, height]: number[] = []
  ) {
    try {
      if (!width) width = 1280;
      if (!height) height = 720;

      const videoElement: HTMLVideoElement = document.createElement("video");

      videoElement.style.width = `${width}px`;
      videoElement.style.height = `${height}px`;

      videoElement.onloadedmetadata = async (e) => {
        videoElement.play();

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
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
