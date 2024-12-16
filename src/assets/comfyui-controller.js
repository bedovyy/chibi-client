import AController from "@/assets/acontroller";
import axios from "axios";
import { uuidv4 } from '@/assets/utils';
import { generateComfyObjects } from '@/assets/comfy-object-draft';

export default class ComfyUIController extends AController {
  // websocket
  clientId = null;
  websocket = null;
  timeoutWS = null;

  // comfy objects
  node = null;
  type = null;
  arrayType = null;
  comfyObjects = null;
  comfyLoraObjects = [];

  // generate state and related
  prompt_id = null;
  generationInfo = null; //TODO: use workflow later
  imageFormat = "webp";
  imageQuality = 70;

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
          this.listener("done", `${this.url}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder}&type=${imageInfo.type}`, this.generationInfo);
          this.generationInfo = null;
          this.prompt_id = null;
        });
      });
    }
  }

  async messageListener(msg) {
    try {
      const json = JSON.parse(msg.data);
      // console.log(Date() + " ws : message", json);
      if (json.type == "status") {
        return;
      }
      const message = json.type.toUpperCase() + (json.data.node ? `: ${json.data.node.split('-')[1]}` : "") + (json.type == "progress" ? ` ${json.data.value} / ${json.data.max}` : "");
      const progress = json.type == "progress" ? Math.floor(Number(json.data.value) / Number(json.data.max) * 100) : 0;
      this.listener("running", message, progress);
  
      // clumsy ws hanging solution.
      if (this.timeoutWS) {
        this.timeoutWS = clearTimeout(this.timeoutWS);
      }
  
      if (json.data.node === null && json.data.prompt_id != null) {
        this.getheringImages(json.data.prompt_id);
      }
    } catch (e) { // maybe preview
      this.listener("preview", msg.data);
    }
  }

  async createWebSocket() {
    const urlForWebSocket = this.url.replaceAll('http', 'ws');
    this.websocket = new WebSocket(`${urlForWebSocket}/ws?clientId=${this.clientId}`);
    this.websocket.onmessage = this.messageListener.bind(this);
    this.websocket.onopen = (e) => {
      console.log(Date() + " ws: open", e);
      if (this.prompt_id) {
        // collect missing image.
        this.getheringImages(this.prompt_id);
      }
    };
    this.websocket.onclose = (e) => {
      console.log(Date() + " ws: closed", e);
      setTimeout(() => this.createWebSocket(), 1000);
    }
    this.websocket.onerror = (e) => {
      console.log(Date() + " ws: error", e);
      this.websocket.close(1002, "error occured");
    }
  }

  async prepare() {
    this.clientId = uuidv4();
    this.createWebSocket();

    const objectInfo = await axios.get(`${this.url}/object_info`);
    [this.node, this.type, this.arrayType] = generateComfyObjects(objectInfo.data);
    // console.log(this.node, this.type, this.arrayType);
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
  getLoras() {
    return this.arrayType.LoraLoader.lora_name;
  }

  setImageFormat(format, quality) {
    this.imageFormat = format;
    this.imageQuality = quality;
  }
  getImageFormat() {
    return [this.imageFormat, this.imageQuality];
  }

  makeTxt2ImgObject() {
    this.comfyObjects = {
      model: new this.node.CheckpointLoaderSimple(),
      prompt: new this.node.CLIPTextEncode(),
      negative: new this.node.CLIPTextEncode(),
      emptyLatent: new this.node.EmptyLatentImage("", "", 1),
      sampler: new this.node.KSampler(),
      vae: new this.node.VAELoader(),
      vaeDecoder: new this.node.VAEDecode(),
      saveImage: new this.node.SaveImage(),
      saveImageWebp: new this.node.SaveAnimatedWEBP(null, "CHIBI", 0.01, false, this.imageQuality, "default"),
    };
    this.comfyObjects.prompt.set("clip", this.comfyObjects.model);
    this.comfyObjects.negative.set("clip", this.comfyObjects.model.CLIP);
    this.comfyObjects.sampler.set("model", this.comfyObjects.model.MODEL);
    this.comfyObjects.sampler.set("positive", this.comfyObjects.prompt);
    this.comfyObjects.sampler.set("negative", this.comfyObjects.negative);
    this.comfyObjects.sampler.set("latent_image", this.comfyObjects.emptyLatent);
    this.comfyObjects.sampler.set("denoise", 1.0);
    this.comfyObjects.vaeDecoder.set("samples", this.comfyObjects.sampler);

    this.comfyObjects.saveImage.set("filename_prefix", "CHIBI");
    this.comfyObjects.saveImage.set("images", this.comfyObjects.vaeDecoder);
    this.comfyObjects.saveImageWebp.set("images", this.comfyObjects.vaeDecoder);
  }

  makeLoraObjects(length) {
    while (this.comfyLoraObjects.length < length) {
      this.comfyLoraObjects.push(new this.node.LoraLoader())
    }
    return this.comfyLoraObjects.slice(0, length);
  }

  async generate(info) {
    if (!this.comfyObjects) {
      this.makeTxt2ImgObject();
    }
    this.comfyObjects.model.set("ckpt_name", info.checkpoint);
    this.comfyObjects.prompt.set("text", info.prompt);
    this.comfyObjects.negative.set("text", info.negative_prompt);
    this.comfyObjects.emptyLatent.set("width", info.width);
    this.comfyObjects.emptyLatent.set("height", info.height);
    this.comfyObjects.sampler.set("model", this.comfyObjects.model.MODEL);
    this.comfyObjects.sampler.set("steps", info.steps);
    this.comfyObjects.sampler.set("cfg", info.cfg_scale);
    this.comfyObjects.sampler.set("sampler_name", info.sampler_name);
    this.comfyObjects.sampler.set("scheduler", info.scheduler);
    this.comfyObjects.sampler.set("seed", info.seed);
    if (info.vae) {
      this.comfyObjects.vae.set("vae_name", info.vae);
      this.comfyObjects.vaeDecoder.set("vae", this.comfyObjects.vae);
    } else {
      this.comfyObjects.vaeDecoder.set("vae", this.comfyObjects.model.VAE);
    }
    this.comfyObjects.saveImageWebp.set("quality", this.imageQuality);

    if (info.loras?.length > 0) {
      const loraObjects = this.makeLoraObjects(info.loras?.length);
      for (var i = 0; i < info.loras.length; i++) {
        loraObjects[i].set("model", (i > 0) ? loraObjects[i-1].MODEL : this.comfyObjects.model.MODEL)
        loraObjects[i].set("clip", (i > 0) ? loraObjects[i-1].CLIP : this.comfyObjects.model.CLIP)
        loraObjects[i].set("lora_name", info.loras[i].lora_name)
        loraObjects[i].set("strength_model", info.loras[i].strength_model)
        loraObjects[i].set("strength_clip", info.loras[i].strength_clip)
      }
      this.comfyObjects.sampler.set("model", loraObjects[info.loras.length - 1].MODEL);
      this.comfyObjects.prompt.set("clip", loraObjects[info.loras.length - 1].CLIP)
    }
    
    try {
      const target = (this.imageFormat == 'webp') ? this.comfyObjects.saveImageWebp : this.comfyObjects.saveImage;
      const res = await axios.post(`${this.url}/prompt`, JSON.stringify({ prompt: target.toWorkflow(), client_id: this.clientId }));
      this.prompt_id = res.data.prompt_id;
      this.generationInfo = info;

      // just in case ws hangs.
      this.timeoutWS = setTimeout(() => this.createWebSocket(), 1000);
    } catch (e) {
      this.listener("error", e);
    }
  }
}