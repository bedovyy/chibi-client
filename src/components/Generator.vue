<script setup>
import axios from 'axios';
import { ref } from 'vue';

const prompt = defineModel('prompt', { default: "\n\nhighly detailed, masterpiece, best quality" });
const negative_prompt = defineModel('negative_prompt', { default: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, coryright name," });
const width = defineModel('width', { default: 832 });
const height = defineModel('height', { default: 1216 });
const steps = defineModel('steps', { default: 28})
const cfg_scale = defineModel('cfg_scale', { default: 5.0 });
const seed = defineModel('seed', { default: -1 });
const sampler_index = defineModel('sampler_index', { default: "Euler a" });

const emit = defineEmits(['generated']);

const isGenerating = ref(false);

async function generate() {
  isGenerating.value = true;
  const params = {
    "prompt": prompt.value,
    "negative_prompt": negative_prompt.value,
    "width": width.value,
    "height": height.value,
    "steps": steps.value,
    "cfg_scale": cfg_scale.value,
    "seed": seed.value,
    "sampler_index": sampler_index.value,
    "seed_resize_from_h": -1,
    "seed_resize_from_w": -1,
    "denoising_strength": null,
    "n_iter": 1,
    "batch_size": 1,
  }

  const url = localStorage.getItem("webui_url");
  if (!url) {
    isGenerating.value = false;
    return;
  }
  const res = await axios.post(`${url}/sdapi/v1/txt2img`, params);
  if (res.status == 200) {
    const base64image = `data:image/${getBase64FileExtension(res.data['images'][0])};base64,${res.data['images'][0]}`;
    fetch(base64image).then(res => res.blob()).then(res => emit("generated", window.URL.createObjectURL(res)));
    isGenerating.value = false;
  }
}

function getBase64FileExtension(base64String) {
  const charPerExt = { '/': 'jpeg', 'i': 'png', 'R': 'gif', 'U': 'webp', 'J': 'pdf'}
  return charPerExt[base64String[0]] || 'unknown';
}
</script>

<template>
  <div class="generator-wrapper">
    <label for="prompt">Prompt</label>
    <textarea id="prompt" rows="4" v-model="prompt" ></textarea>
    <label for="negative-prompt">Negative prompt</label>
    <textarea id="negative-prompt" rows="3" v-model="negative_prompt"></textarea>
    <label for="image-size">Image size</label>
    <div class="row">
      <div class="size">
        <input v-model="width">
        <div>✕</div>
        <input v-model="height">
      </div>
    </div>
    <label for="steps">Steps: {{ steps }}</label>
    <input type="range" id="steps" min="1" max="120" step="1" v-model="steps">
    <label for="cfg_scale">CFG Scale: {{ cfg_scale }}</label>
    <input type="range" id="cfg_scale" min="0" max="50" step="0.1" v-model="cfg_scale">
    <div class="row">
      <div>
        <label for="seed">Seed</label>
        <input id="seed" v-model="seed" >
      </div>
      <div>
        <label for="sampler_index">Sampler</label>
        <input id="sampler_index" v-model="sampler_index">
      </div>
    </div>
    <button @click="generate" :disabled="isGenerating" >Generate</button>
  </div>
</template>

<style scoped lang="scss">
.generator-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 10px;
}

label {
  font-size: 16px;
  font-weight: bold;
  display: block;
}

textarea {
  resize: none;
  width: 100%;
}

.row {
  display: flex;
  justify-content: space-between;
  input {
    width: 100%;
  }
}

.size {
  display: flex;
  width: 100%;

  div {
    min-width: 28px;
    text-align: center;
  }
}

button {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 35px;
  font-size: 18px;
  font-weight: bold;

  border-radius: 10px 10px 0 0;
}

// cherry-picked
/* Text Input */
input, textarea {
  width: 100%;
	text-align: left;
}
input[type="range"] {
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	width: 100%;
	outline: none;
}
input[type="range"]::-webkit-slider-thumb {
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;

	width: 11px;
	height: 18px;

	background-color: var(--color-text-secondary);
	border: none;

	outline: 2px solid var(--color-text-secondary);
	border-radius: 2px;
}
input[type="range"]:focus::-webkit-slider-thumb,
input[type="range"]:hover::-webkit-slider-thumb {
	background-color: var(--color-text);
	outline: 2px solid var(--color-text);
}


</style>