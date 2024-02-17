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

  // prompt_id
  prompt_id = null;

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

  async getheringImages(prompt_id) {
    const history = await this.getHistory(prompt_id);
    const outputs = history.data[prompt_id]?.outputs;
    if (outputs) {
      Object.values(outputs).forEach(outputNodes => {
        Object.values(outputNodes.images).forEach(async imageInfo => {
          this.listener(`${this.url}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder}&type=${imageInfo.type}`);
          dataManager.isGenerating.value = false;
          this.prompt_id = null;
        });
      });
    }
  }

  async messageListener(e) {
    console.log(Date() +" ws : message", e);
    const json = JSON.parse(e.data);
    dataManager.message.value = json.type.toUpperCase() + (json.data.node ? `: ${json.data.node.split('-')[0]}` : "") + (json.type == "progress" ? ` ${json.data.value} / ${json.data.max}` : "");

    // clumsy ws hanging solution.
    if (this.timeoutWS) {
      this.timeoutWS = clearTimeout(this.timeoutWS);
    }

    if (json.data.node === null && json.data.prompt_id != null) {
      this.getheringImages(json.data.prompt_id);
    }
  }

  async createWebSocket() {
    const urlForWebSocket = this.url.replaceAll('http', 'ws');
    this.websocket = new WebSocket(`${urlForWebSocket}/ws?clientId=${this.clientId}`);
    this.websocket.onmessage = this.messageListener.bind(this);
    this.websocket.onopen = (e) => {
      console.log(Date() +" ws: open", e);
      if (dataManager.isGenerating && this.prompt_id) {
        // collect missing image.
        this.getheringImages(this.prompt_id);
      }
    };
    this.websocket.onclose = (e) => {
      console.log(Date() +" ws: closed", e);
      setTimeout(() => this.createWebSocket(), 1000);
      // dataManager.isGenerating.value = false;
    }
    this.websocket.onerror = (e) => {
      console.log(Date() +" ws: error", e);
      this.websocket.close(1002, "error occured");
    }
  }

  async prepare() {
    this.clientId = uuidv4();
    this.createWebSocket();

    const objectInfo = await axios.get(`${this.url}/object_info`);
    [this.node, this.type, this.arrayType] = generateComfyObjects(objectInfo.data);
    console.log(this.node, this.type, this.arrayType);
  }

  getCheckpoints() {
    return this.arrayType.CheckpointLoaderSimple.ckpt_name;
  }
  getVAEs() {
    return this.arrayType.VAELoader.vae_name;
  }
  getSamplers() {
    return this.arrayType.KSampler.sampler_name;
  }
  getSchedulers() {
    return this.arrayType.KSampler.scheduler;
  }

  async generate(info) {
    if (dataManager.keepGenerationInfo.value) {
      dataManager.saveGenerationInfo(info);
    }

    const model = new this.node.CheckpointLoaderSimple(info.checkpoint);
    const prompt = new this.node.CLIPTextEncode(info.prompt, model.CLIP);
    const negative = new this.node.CLIPTextEncode(info.negative_prompt, model.CLIP);
    const actualSeed = info.seed > 0 ? info.seed : Math.floor(Math.random() * 9999999998 + 1); // 0 for seed?
    const sampler = new this.node.KSampler(model, actualSeed, info.steps, info.cfg_scale, info.sampler_index, info.scheduler, prompt, negative, new this.node.EmptyLatentImage(info.width, info.height, 1), 1.0);
    const decoder = new this.node.VAEDecode(sampler, model);
    const saveImage = new this.node.SaveImage(decoder, "CHIBI");
    if (info.vae) {
      decoder.set("vae", new this.node.VAELoader(info.vae));
    }

    dataManager.isGenerating.value = true;
    const res = await axios.post(`${this.url}/prompt`, JSON.stringify({ prompt: saveImage.toWorkflow(), client_id: this.clientId }));
    this.prompt_id = res.data.prompt_id;

    // just in case ws hangs.
    this.timeoutWS = setTimeout(() => this.createWebSocket(), 1000);
  }
}