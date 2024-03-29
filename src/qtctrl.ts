import { run } from "@jxa/run";
import QTConfig from "./qtconfig";
import { Disposable } from "vscode";

declare function Application(_: string): any;
declare type Document = any;
declare type Application = any;

export default class QTController implements Disposable {
  windowId: number = -1;
  fps: number = 0;
  constructor(private path: string, private config: QTConfig) {
    this.openAudio();
  }

  public dispose() {
  }

  public async togglePlay() {
    run((windowId: number, fps: number, config: QTConfig) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc: Document = theWindow.document();
      if (doc.playing()) {
        app.stop(doc);
        app.stepBackward(doc, { by: config.resumeDelay * fps });
      } else {
        app.play(doc);
      }
    }, this.windowId, this.fps, this.config);
  }

  public async forcePlay() {
    run((windowId: number) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc: Document = theWindow.document();
      app.play(doc);
    }, this.windowId);
  }

  public async playing(): Promise<boolean> {
    return run((windowId: number) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc: Document = theWindow.document();
      return doc.playing();
    }, this.windowId);
  }

  public async forceStop() {
    run((windowId: number) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc: Document = theWindow.document();
      app.stop(doc);
    }, this.windowId);
  }

  public async forwardSeconds(seconds: number = this.config.defaultForwardSeconds) {
    run((windowId, fps, seconds) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc: Document = theWindow.document();
      const played = doc.playing();
      app.stepForward(doc, { by: fps * seconds });
      if (played) {
        app.play(doc);
      }
    },
      this.windowId, this.fps, seconds
    );
  }

  public async backwardSeconds(seconds: number = this.config.defaultBackwardSeconds) {
    run((windowId, fps, seconds) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc: Document = theWindow.document();
      const played = doc.playing();
      app.stepBackward(doc, { by: fps * seconds });
      if (played) {
        app.play(doc);
      }
    },
      this.windowId, this.fps, seconds
    );
  }

  public async currentTime(): Promise<number> {
    return run((windowId: number) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc = theWindow.document();
      return doc.currentTime();
    }, this.windowId);
  }

  public async setRate(rate: number) {
    run((windowId: number, rate: number) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc = theWindow.document();
      doc.rate = rate;
    }, this.windowId, rate);
  }

  public async faster(rate = this.config.defaultRateStep) {
    this.addToRate(rate);
  }

  public async slower(rate = this.config.defaultRateStep) {
    this.addToRate(-rate);
  }

  public async addToRate(rate: number) {
    run((windowId: number, rate: number) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc = theWindow.document();
      doc.rate = doc.rate() + rate;
    }, this.windowId, rate);
  }

  public async resetRate() {
    this.setRate(this.config.defaultRate);
  }

  public async setCurrentTime(seconds: number) {
    run((windowId: number, seconds: number) => {
      const app = Application("QuickTime Player");
      const theWindow = app.windows.whose({ id: windowId })[0];
      const doc = theWindow.document();
      doc.currentTime = seconds;
    }, this.windowId, seconds);
  }

  public async openAudio() {
    const { windowId, fps } = await run((path, rate) => {
      const app = Application("QuickTime Player");
      app.open(path);
      const theWindow = app.windows.whose({ "index": 1 })[0];
      const windowId = theWindow.id();
      const doc = theWindow.document();
      const t0: number = doc.currentTime();
      doc.currentTime = 0.0;
      app.stepForward(doc, { by: 1 });
      const fps = 1.0 / doc.currentTime();
      doc.currentTime = t0;
      doc.rate = rate;
      return { fps, windowId };
    }, this.path, this.config.defaultRate);
    this.fps = fps;
    this.windowId = windowId;
  }
}