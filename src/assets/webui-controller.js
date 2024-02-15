import AController from '@/assets/acontroller';
import axios from 'axios';

export default class WebUIController extends AController {
  static async checkUrl(url) {
    try {
      const res = await axios.get(`${url}/sdapi/v1/progress?skip_current_image=true`, { timeout: 3000 });
      if (res.status == 200 && res.data["progress"] != null) {
        return true;
      }
    } catch(e) {
      console.log(e);
    }
    return false;
  }

  async prepare() {
  }

  async generate() {
  }
}