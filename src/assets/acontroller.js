// abstract?
export default class AController {
  listener = null;
  url = null

  constructor(url, listener) {
    if (this.constructor === AController) {
      throw new TypeError('abstract class');
    }
    this.url = url;
    this.setOnFinishListener(listener);
  }

  static async checkUrl(url) {}
  async prepare() {}
  getCheckpoints() {}
  getSamplers() {}
  getSchedulers() {}
  async generate() {}
  setOnFinishListener(listener) {
    this.listener = listener;
  }
}