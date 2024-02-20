<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import TagAutocomplete from './TagAutocomplete.vue';
import Dropdown from './Dropdown.vue';
import DataManager from '@/assets/data-manager';

const controller = DataManager.getInstance().controller;
const isGenerating = DataManager.getInstance().isGenerating;

const checkpoint = defineModel('ckpt', { default: null });
const vae = defineModel('vae', { default: null });
const prompt = defineModel('prompt', { default: "\n\nhighly detailed, masterpiece, best quality" });
const negative_prompt = defineModel('negative_prompt', { default: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, coryright name," });
const width = defineModel('width', { default: 832 });
const height = defineModel('height', { default: 1216 });
const steps = defineModel('steps', { default: 28 })
const cfg_scale = defineModel('cfg_scale', { default: 5.0 });
const seed = defineModel('seed', { default: -1 });
const sampler_index = defineModel('sampler_index', { default: null });
const scheduler = defineModel('scheduler', { default: null });

const maxSteps = DataManager.getInstance().maxSteps;
const maxCfg = DataManager.getInstance().maxCfg;

const isDetailsOpen = ref(false);
const detailsText = computed(() => !isDetailsOpen.value && checkpoint.value ? checkpoint.value : "");
function toggleModels(e) {
  isDetailsOpen.value = e.newState == "open"
}

watch([steps, cfg_scale], ([newSteps, newCfg]) => {
  steps.value = Math.max(1, Math.min(120, newSteps));
  cfg_scale.value = newCfg.toString().slice(-1) == '.' ? newCfg : Math.max(0, Math.min(50, newCfg));
})

let ckptList = null;
let vaeList = null;
let samplerList = null;
let schedulerList = null;
watch(controller, async (newVal, oldVal) => {
  if (DataManager.getInstance().keepGenerationInfo.value) {
    const info = DataManager.getInstance().loadGenerationInfo();
    if (info) {
      checkpoint.value = info.checkpoint;
      vae.value = info.vae;
      prompt.value = info.prompt;
      negative_prompt.value = info.negative_prompt;
      width.value = info.width;
      height.value = info.height;
      steps.value = info.steps;
      cfg_scale.value = info.cfg_scale;
      seed.value = info.seed; // do i need?
      sampler_index.value = info.sampler_index;
      scheduler.value = info.scheduler;
    }
  }

  // set first if not in list
  ckptList = newVal.getCheckpoints();
  if (!checkpoint.value || !ckptList.includes(checkpoint.value)) {
    checkpoint.value = ckptList[0];
  }
  vaeList = ["< none >", ...newVal.getVAEs()];
  if (!vae.value || !vaeList.includes(vae.value)) {
    vae.value = vaeList[0];
  }
  samplerList = newVal.getSamplers();
  if (!sampler_index.value || !samplerList.includes(sampler_index.value)) {
    sampler_index.value = samplerList[0];
  }
  schedulerList = newVal.getSchedulers();
  if (!scheduler.value || !schedulerList.includes(scheduler.value)) {
    scheduler.value = schedulerList[0];
  }
});

onMounted(() => {
  window.addEventListener('keydown', keyboardShortcut);
});
onUnmounted(() => {
  window.removeEventListener('keydown', keyboardShortcut);
})

function keyboardShortcut(e) {
  if (e.key == "Enter" && e.ctrlKey && !isGenerating.value) {
    generate();
  }
}

async function generate() {
  const info = {
    checkpoint: checkpoint.value,
    vae: (vae.value == "< none >") ? null : vae.value,
    prompt: prompt.value,
    negative_prompt: negative_prompt.value,
    width: width.value,
    height: height.value,
    steps: steps.value,
    cfg_scale: cfg_scale.value,
    seed: seed.value,
    sampler_index: sampler_index.value,
  }
  if (scheduler.value) {
    info.scheduler = scheduler.value;
  }
  controller.value.generate(info);
}
</script>

<template>
  <div class="generator-wrapper">
    <div>
      <details @toggle="toggleModels">
        <summary>Models <span>{{ detailsText }}</span></summary>
        <label for="checkpoint">Checkpoint</label>
        <Dropdown id="checkpoint" v-model="checkpoint" v-model:datalist="ckptList"></Dropdown>
        <label for="vae">VAE</label>
        <Dropdown id="vae" v-model="vae" v-model:datalist="vaeList"></Dropdown>
      </details>
      <label for="prompt">Prompt</label>
      <TagAutocomplete id="prompt" v-model="prompt"></TagAutocomplete>
      <!-- <textarea id="prompt" rows="4" v-model="prompt"></textarea> -->
      <label for="negative-prompt">Negative prompt</label>
      <TagAutocomplete id="negative-prompt" v-model="negative_prompt"></TagAutocomplete>
      <!-- <textarea id="negative-prompt" rows="3" v-model="negative_prompt"></textarea> -->
      <label for="image-size">Image size</label>
      <div class="row">
        <div class="size">
          <input v-model="width">
          <div>✕</div>
          <input v-model="height">
        </div>
      </div>
      <div class="row"><label for="steps">Steps: </label><input style="width:4rem" v-model="steps"></div>
      <input type="range" id="steps" min="1" :max="maxSteps" step="1" v-model="steps">
      <div class="row"><label for="cfg_scale">CFG Scale:</label><input style="width:4rem" v-model="cfg_scale"></div>
      <input type="range" id="cfg_scale" min="0" :max="maxCfg" step="0.1" v-model="cfg_scale">
      <div class="row">
        <div>
          <label for="sampler_index">Sampler</label>
          <!-- <input id="sampler_index" v-model="sampler_index"> -->
          <Dropdown id="sampler_index" v-model="sampler_index" v-model:datalist="samplerList"></Dropdown>
        </div>
        <div v-if="schedulerList">
          <label for="scheduler">Scheduler</label>
          <!-- <input id="sampler_index" v-model="sampler_index"> -->
          <Dropdown id="scheduler" v-model="scheduler" v-model:datalist="schedulerList"></Dropdown>
        </div>
      </div>
      <div class="row">
        <div>
          <label for="seed">Seed</label>
          <input id="seed" v-model="seed">
        </div>
      </div>
    </div>
    <button class="generate-button" @click="generate" :disabled="!controller || isGenerating">Generate</button>
  </div>
</template>

<style scoped lang="scss">
.generator-wrapper {
  width: 100%;
  height: 100%;
  position: relative;

  //TODO: make class
  >div {
    padding: 10px;
    overflow: auto;
    height: calc(100% - 45px); //TODO: no hard-coding for button size!
  }

  &:deep(>*) {
    width: 100%;
  }
}

details {
  background-color: #7773;
  padding: 4px;
  border-radius: 8px;

  summary {
    font-size: 0.8rem;
    font-weight: bold;
  }
}

label {
  font-size: 1rem;
  font-weight: bold;
  display: block;
}

textarea {
  resize: none;
  width: 100%;
}

.row {
  display: flex;
  gap: 20px;
  justify-content: space-between;
  align-items: center;

  >div,
  input {
    width: 100%;
  }
}

.size {
  width: 100%;
  display: flex;
  align-items: center;

  div {
    min-width: 28px;
    text-align: center;
  }
}

button.generate-button {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 45px; //TODO: no hard-coding for button size!
  font-size: 1.1rem;
  font-weight: bold;

  border-radius: 10px 10px 0 0;
}
</style>