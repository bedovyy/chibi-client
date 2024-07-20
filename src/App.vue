<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import Generator from './components/Generator.vue';
import Settings from './components/Settings.vue';
import iconHistory from '@/assets/iconHistory.svg';
import iconSettings from '@/assets/iconSettings.svg';
import iconNoImg from '@/assets/iconNoImg.svg';
import logo from '@/assets/logo.svg';

import ComfyUIController from '@/assets/comfyui-controller';
import WebUIController from '@/assets/webui-controller';
import DataManager from '@/assets/data-manager';
const dataManager = DataManager.getInstance();

const generatorEl = ref();
const sidebarEl = ref();
const settingsEl = ref();
const infoEl = ref();

const currentImage = ref(logo);
const currentInfo = ref();
const history = ref([]);

const controller = dataManager.controller;
const isGenerating = dataManager.isGenerating;

const url = dataManager.url;
const theme = dataManager.theme;
const historyWidthPx = computed(() => dataManager.historyWidth.value + 'px');
const message = ref("");
const progress = ref(0);
watch(theme, (newVal) => {
  const list = dataManager.getThemeList();
  list.forEach(c => {
    if (c == newVal) {
      document.querySelector(":root").classList.add(c);
    } else {
      document.querySelector(":root").classList.remove(c);
    }
  });
});
document.querySelector(":root").classList.add(theme.value);

connectServer();
onMounted(() => {
  // move this to DataManager... which is data manager no more.
  history.value = dataManager.loadHistory();
});

watch(isGenerating, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    generatorEl.value.classList.add('shirink');
    infoEl.value?.classList.add('shirink');
    currentImage.value = logo;
  }
});

async function base64ToBlobURL(base64) {
  return await fetch(base64).then(res => res.blob()).then(blob => URL.createObjectURL(blob));
}

function handleControllerEvent(state, data, extra) {
  switch (state) {
    case "running":
      message.value = data;
      progress.value = extra ? extra + "%" : "0%";
      break;
    case "done":
      currentImage.value = data;
      currentInfo.value = Object.assign(extra, { backend: dataManager.backendName.value });
      history.value.push({ url: data, info: extra });
      dataManager.saveHistory(history.value);
      isGenerating.value = false;
      break;
    case "preview":
      console.log(data)
      //TODO: find out why it's comming as blob not arraybuffer?
      const buffer = data.slice(4)
      const imageType = data[0]
      let mime = (imageType == 2) ? "image/png" : "image/jpeg";
      const blob = new Blob([buffer.slice(4)], { type: mime })
      currentImage.value = URL.createObjectURL(blob);
      break
    case "error":
      isGenerating.value = false;
      break;
  }
}

function onClickHistory(src) {
  currentImage.value = (src.url || src);
  currentInfo.value = src.info;
}

function sendInfo() {
  if (currentInfo.value) {
    dataManager.importedInfo.value = currentInfo.value;
    generatorEl.value.classList.remove("shirink");
  }
}

async function connectServer() {
  let urlForTest = url.value;
  urlForTest = urlForTest.replaceAll(/^http:\/\//g, '').replaceAll(/^https:\/\//g, '').replaceAll(/\/$/g, '');

  // try http first
  const testUrl = `${window.location.protocol}//${urlForTest}`;
  if (await ComfyUIController.checkUrl(testUrl)) {
    dataManager.backendName.value = "ComfyUI";
    console.log("use comfyui-controller");
    const ctrl = new ComfyUIController(testUrl, handleControllerEvent);
    await ctrl.prepare();
    //TODO: generator calc some values like samplers and schedulers when it receive controller,
    //      so, controller should be sent after preparation. this logic should be changed.
    controller.value = ctrl;
    isGenerating.value = false;
  } else if (await WebUIController.checkUrl(testUrl)) {
    console.log("use webui-controller");
    dataManager.backendName.value = "web UI";
    const ctrl = new WebUIController(testUrl, handleControllerEvent);
    await ctrl.prepare();
    controller.value = ctrl;
    [dataManager.imageFormat.value, dataManager.imageQuality.value] = ctrl.getImageFormat();
    isGenerating.value = false;
  }
  console.log(dataManager.backendName.value);
}

function noImg(e) {
  e.target.src = iconNoImg;
}

function toggleGenerator() {
  generatorEl.value.classList.toggle('shirink');
}

let prevTouchY = [];
function slideGenerator(e) {
  if (e.type == "touchend") {
    const diff = prevTouchY.at(-1) - prevTouchY.at(-2);
    if (diff > 1) { // down
      generatorEl.value.classList.add('shirink');
    } else if (diff < 1) {
      generatorEl.value.classList.remove('shirink');
    } else {
      // generatorEl.value.classList.toggle('shirink');
    }
    generatorEl.value.style.height = null;
    prevTouchY = [];
  }
  if (e.touches.length != 1) {
    return;
  }
  generatorEl.value.style.height = Math.max(80, window.innerHeight - e.touches[0].pageY) + 'px';
  prevTouchY.push(e.touches[0].pageY);
  e.preventDefault();
}

//TODO: two methods for controlling one element?
function onClickPreview() {
  if (sidebarEl.value.classList.contains('shirink')) {
    infoEl.value?.classList.toggle('shirink');
  } else {
    sidebarEl.value.classList.add('shirink');
  }
}
function toggleSidebar() {
  sidebarEl.value.classList.toggle('shirink');
}
//is that okay? do I need boolean for showing?
function toogleSettings(e) {
  // toggle only when dimmed background or icon
  if (settingsEl.value != e.target && !e.target.classList.contains('icon')) {
    return;
  }
  settingsEl.value.classList.toggle('shirink');
}
</script>

<template>
  <header>
    <div class="left">
      <h1 class="title">Chibi</h1>
      <img class="icon-settings icon" :src="iconSettings" @click="toogleSettings">
      <!-- <sup>{{ dataManager.backendName.value }}</sup> -->
    </div>
    <div class="right">
      <img class="icon-history icon" :src="iconHistory" @click="toggleSidebar">
    </div>
  </header>
  <main>
    <div ref="generatorEl" class="generator">
      <div class="generator-slider" @click="toggleGenerator" @touchmove="slideGenerator" @touchend="slideGenerator">
        <span>|||</span>
      </div>
      <Generator class="generator-component" />
    </div>
    <div class="preview" :class="{ generating: isGenerating }" @click="onClickPreview">
      <img alt="Preview" class="preview-image" :src="currentImage" @error="noImg" />
      <div ref="infoEl" v-if="currentInfo" class="info shirink">
        <div class="option-buttons">
          <!-- <div class="option-button">✨<br>Enhance</div> -->
          <div class="option-button" @click="sendInfo">↩️<br>Import</div>
        </div>
        <div class="infotext">
          <strong>{{ currentInfo.prompt }}</strong><br>
          <em>{{ currentInfo.negative_prompt }}</em><br><br>
          <span class="box">📐{{ currentInfo.width }}✕{{ currentInfo.height }}</span>
          <span class="box">🌱{{ currentInfo.seed }}</span>
          <br>
          <span class="box">💿{{ currentInfo.checkpoint.replace(/^.*\/|\.[^.]*$/g, "") }}</span>
          <span v-if="currentInfo.backend" class="box">🛠️{{ currentInfo.backend }}</span>
        </div>
      </div>
    </div>
    <div ref="sidebarEl" class="sidebar-wrapper shirink">
      <div class="sidebar">
        <div class="history">
          <img v-for="img in history" :class="{ selected: currentImage === (img.url || img) }" v-lazy="(img.url || img)"
            @click="onClickHistory(img)">
          <!-- History -->
        </div>
      </div>
    </div>
  </main>
  <div ref="settingsEl" class="modal shirink" @mousedown="toogleSettings">
    <Settings></Settings>
  </div>
  <div v-if="message" class="toaster" :class="{ shirink: !isGenerating }">
    {{ message }}
  </div>
</template>

<style scoped lang="scss">
header {
  width: 100%;
  height: 30px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 1px 10px;

  .icon {
    cursor: pointer;
  }

  .left {
    display: flex;
    width: 80%;
    overflow-x: auto;

    h1.title {
      font-size: 24px; // it should be pixel unit, because it is title!
      line-height: 24px;
      font-weight: bolder;
    }

    button {
      width: 95px;
    }

    .icon {
      width: 24px;
      object-fit: contain;
      margin-bottom: 8px;
    }
  }

  .right {
    display: none;
    width: 24px;
    text-align: right;
  }
}

main {
  width: 100%;
  height: calc(100% - 30px);
  // height: calc(100svh - 30px);
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}

.generator {
  min-width: 400px;
  max-width: 450px;
  width: 30%;
  height: 100%;
  overflow-y: auto;
  z-index: 2;
  background-color: var(--color-background-soft);

  .generator-slider {
    display: none;
    text-align: center;
    font-size: 16px;
    padding: 0;
    background: var(--color-background-soft);
    width: 100%;
    height: 35px; //TODO: no hard-coding!
    z-index: 1;

    >span {
      vertical-align: middle;
    }
  }
}

.preview {
  position: relative;
  flex: 1;
  padding: 2%;
  display: flex;
  justify-content: center;
  align-items: center;

  img.preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  &.generating {
    animation: generating 2s infinite;
  }

  @keyframes generating {
    0% {
      box-shadow:
        0px 0px 0px 100px var(--color-background-soft) inset,
        0px 0px 0px 102px var(--color-border) inset;
    }

    50% {
      box-shadow:
        0px 0px 0px -2px var(--color-background-soft) inset,
        0px 0px 0px 0px var(--color-border) inset;
    }

    100% {
      box-shadow:
        0px 0px 0px -2px var(--color-background-soft) inset,
        0px 0px 0px 0px var(--color-border) inset;
    }
  }
}

.info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 35%;
  background-color: var(--color-background-soft);
  opacity: 0.85;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 1rem;
  padding: 1rem;

  &.shirink {
    display: none;
  }

  .option-buttons {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    .option-button {
      margin: 2px;
      padding: 4px;
      cursor: pointer;
      line-height: 1rem;
    }
  }

  .infotext {
    font-size: 0.8rem;
    max-height: 100%;
    overflow: auto;
    line-height: normal;

    .box {
      display: inline-block;
      border: 1px solid var(--color-text-secondary);
      margin: 1px;
      padding: 0px 2px 1px;
    }
  }
}

.sidebar {
  min-width: v-bind(historyWidthPx);
  width: v-bind(historyWidthPx);
  max-width: v-bind(historyWidthPx);
  height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  z-index: 1;
  background-color: var(--color-background-soft);

  .history {
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
    padding: 3px;

    >img {
      cursor: pointer;

      &.selected {
        outline: 2px solid var(--color-text);
      }
    }
  }
}

.modal {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000a;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 5;

  >div {
    margin: 10svh auto;
    width: 80%;
    max-width: 600px;
    max-height: 80%;
    overflow: auto;
  }

  &.shirink {
    opacity: 0;
    visibility: hidden;
  }
}

.toaster {
  position: fixed;
  bottom: 10%;
  left: 10%;
  right: 10%;
  width: 80%;
  padding: 10px 2%;
  color: white;
  margin: 0 auto;
  max-width: 640px;
  font-size: 0.8rem;
  text-align: center;
  background: #000a;
  background: linear-gradient(to right, #777e, #777e v-bind(progress), #000a v-bind(progress), #000a 100%);
  border-radius: 20px;
  transition: opacity 1s, visibility 1s;
  z-index: 6;

  &.shirink {
    opacity: 0;
    visibility: hidden;
  }
}

@media (max-width:1280px) {
  header .right {
    display: initial;
  }

  .sidebar-wrapper {
    position: absolute;
    top: 30px;
    bottom: 0;
    right: 0;
    width: v-bind(historyWidthPx);
    height: calc(100% - 30px);
    overflow: hidden;
    transition: width 0.2s;

    &.shirink {
      width: 0px;
    }
  }
}

@media (max-width:900px) {
  .generator {
    position: fixed;
    bottom: 0;
    min-width: 100%;
    transition: height 0.2s;
    overflow: hidden;

    &.shirink {
      height: 80px; //TODO: no hard-coding!

      :deep(*) {
        overflow: hidden !important;
      }
    }

    .generator-component {
      height: calc(100% - 35px); //TODO: no hard-coding!
    }

    .generator-slider {
      display: block;
    }
  }

  .preview {
    min-width: 100%;
    height: calc(100% - 80px); //TODO: no hard-coding!
  }

  .sidebar-wrapper {
    height: calc(100% - 110px); //TODO: no hard-coding!
  }
}

/* @media (max-width:480px) {
} */
</style>