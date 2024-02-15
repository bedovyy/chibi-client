import AController from "@/assets/acontroller";
import axios from "axios";
import { uuidv4 } from '@/assets/utils';
import { generateComfyObjects } from '@/assets/comfy-object-draft';

// data-manager-dependency....
import DataManager from "./data-manager";
const dataManager = DataManager.getInstance();

export default class ComfyUIController extends AController {
  // websocket
  clientId = null;
  websocket = null;
  timeoutWS = null;

  // comfy objects
  node = null;
  type = null;
  arrayType = null;

  static async checkUrl(url) {
    try {
      const res = await axios.get(`${url}/system_stats`, { timeout: 3000 });
      if (res.status == 200 && res.data["system"] != null) {
        return true;
      }
    } catch (e) {
      console.log(e);
    }
    return false;
  }

  async getHistory(promptId) {
    return await axios.get(`${this.url}/history/${promptId}`);
  }
  // async getImage(filename, subfolder='', type='output') {
  //   // const params = ;
  //   return await axios.get(`${this.url}/view`, { params : { filename, subfolder, type }});
  // }

  async getheringImages(prompt_id) {
    const history = await this.getHistory(prompt_id);
    const outputs = Object.values(history.data[prompt_id].outputs);
    outputs.forEach(outputNodes => {
      Object.values(outputNodes.images).forEach(async imageInfo => {
        // just pass comfy url.
        // const image = await this.getImage(imageInfo.filename, imageInfo.subfolder, imageInfo.type);
        this.listener(`${this.url}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder}&type=${imageInfo.type}`);
        dataManager.isGenerating.value = false;
      })
    })
  }

  async messageListener(e) {
    const json = JSON.parse(e.data);
    dataManager.message.value = json.type.toUpperCase() + (json.data.node ? `: ${json.data.node.split('-')[0]}` : "") + (json.type == "progress" ? ` ${json.data.value} / ${json.data.max}` : "");

    // dirty and clumsy ws disconnection solution.
    // it doesn't reconnect ws and shouldn't.
    if (json.type == "execution_start" || this.timeoutWS != null) {
      if (this.timeoutWS) {
        clearTimeout(this.timeoutWS);
      }
      this.timeoutWS = setTimeout(() => {
        this.timeoutWS = null;
        // force gethering.
        if (dataManager.isGenerating.value) {
          dataManager.isGenerating.value = true;
          this.getheringImages(this.prompt_id);
        }
      }, 3000);
    }

    if (json.data.node === null && json.data.prompt_id != null) {
      this.getheringImages(json.data.prompt_id);
      this.prompt_id = null;
    }
  }

  async createWebSocket() {
    const urlForWebSocket = this.url.replaceAll('http', 'ws');
    if (this.websocket) {
      this.websocket.close();
    }
    this.websocket = new WebSocket(`${urlForWebSocket}/ws?clientId=${this.clientId}`);
    this.websocket.onmessage = this.messageListener.bind(this);
    this.websocket.onopen = (e) => {
      console.log("ws: open", e);
    };
    this.websocket.onclose = (e) => {
      console.log("ws: closed", e);
      setTimeout(() => this.createWebSocket(), 500); // this doesn't ensure connection.
      // dataManager.isGenerating.value = false;
    }
    this.websocket.onerror = (e) => {
      console.log("ws: error", e);
      dataManager.message.value = "WebSocket Closed" + e;
      this.websocket.close();
    }
  }

  async prepare() {
    this.clientId = uuidv4();
    //TODO: ws frequently disconnected on mobile. fix it.
    this.createWebSocket();

    const objectInfo = await axios.get(`${this.url}/object_info`);
    [this.node, this.type, this.arrayType] = generateComfyObjects(objectInfo.data);
  }

  getCheckpoints() {
    return this.arrayType.CheckpointLoaderSimple.ckpt_name;
  }
  getSamplers() {
    return this.arrayType.KSampler.sampler_name;
  }
  getSchedulers() {
    return this.arrayType.KSampler.scheduler;
  }

  async generate(info) {
    if (dataManager.keepGenerationInfo.value) {
      dataManager.setGenerationInfo(info);
    }

    const model = new this.node.CheckpointLoaderSimple(info.checkpoint);
    const prompt = new this.node.CLIPTextEncode(info.prompt, model.CLIP);
    const negative = new this.node.CLIPTextEncode(info.negative_prompt, model.CLIP);
    const actualSeed = info.seed > 0 ? info.seed : Math.floor(Math.random() * 9999999998 + 1); // 0 for seed?
    const sampler = new this.node.KSampler(model, actualSeed, info.steps, info.cfg_scale, info.sampler_index, info.scheduler, prompt, negative, new this.node.EmptyLatentImage(info.width, info.height, 1), 1.0);
    const decoder = new this.node.VAEDecode(sampler, model);
    const saveImage = new this.node.SaveImage(decoder);
    saveImage.set("filename_prefix", "CHIBI");

    if (this.websocket.readyState == WebSocket.CLOSED) {
      this.createWebSocket();
    }

    dataManager.isGenerating.value = true;
    const res = await axios.post(`${this.url}/prompt`, JSON.stringify({ prompt: saveImage.toWorkflow(), client_id: this.clientId }));
    this.prompt_id = res.data.prompt_id;
  }
}