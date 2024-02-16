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

const generatorEl = ref();
const sidebarEl = ref();
const settingsEl = ref();

const currentImage = ref(logo);
const history = ref([]);

const controller = DataManager.getInstance().controller;
const isGenerating = DataManager.getInstance().isGenerating;

const message = DataManager.getInstance().message;
const url = DataManager.getInstance().url;
const theme = DataManager.getInstance().theme;
const historyWidthPx = computed(() => DataManager.getInstance().historyWidth.value + 'px');

watch(theme, (newVal) => {
  const list = DataManager.getInstance().getThemeList();
  list.forEach(c => {
    if (c == newVal) {
      document.querySelector(":root").classList.add(c);
    } else {
      document.querySelector(":root").classList.remove(c);
    }
  });
});
document.querySelector(":root").classList.add(theme.value);

onMounted(() => {
  // move this to DataManager... which is data manager no more.
  connectServer();
  history.value = DataManager.getInstance().loadHistory();
});

watch(isGenerating, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    generatorEl.value.classList.add('shirink');
    currentImage.value = logo;
  }
});

function onGenerated(blob) {
  currentImage.value = blob;
  history.value.push(blob);
  DataManager.getInstance().saveHistory(history.value);
}

function onClickHistory(src) {
  currentImage.value = src;
}

async function connectServer() {
  let urlForTest = url.value;
  urlForTest = urlForTest.replaceAll(/^http:\/\//g, '').replaceAll(/^https:\/\//g, '').replaceAll(/\/$/g, '');
  
  // try http first
  const testUrl = `${window.location.protocol}//${urlForTest}`;
  if (await WebUIController.checkUrl(testUrl)) {
    console.log("use webui-controller");
    controller.value = new WebUIController(testUrl, onGenerated);
  } else if (await ComfyUIController.checkUrl(testUrl)) {
    console.log("use comfyui-controller");
    const ctrl = new ComfyUIController(testUrl, onGenerated);
    await ctrl.prepare();
    //TODO: generator calc some values like samplers and schedulers when it receive controller,
    //      so, controller should be sent after preparation. this logic should be changed.
    controller.value = ctrl;
  }
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
function hideSidebar() {
  sidebarEl.value.classList.add('shirink');
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
  </div>
  <div class="right">
    <img class="icon-history icon" :src="iconHistory" @click="toggleSidebar">
  </div>
</header>
<main>
  <div ref="generatorEl" class="generator">
    <div class="generator-slider"
      @click="toggleGenerator"
      @touchmove="slideGenerator"
      @touchend="slideGenerator"
    ><span>|||</span></div>
    <Generator class="generator-component" />
  </div>
  <div class="preview" :class="{ generating: isGenerating }" @click="hideSidebar()">
    <img alt="Preview" class="preview-image" :src="currentImage" @error="noImg" />
  </div>
  <div class="sidebar-wrapper">
    <div ref="sidebarEl" class="sidebar shirink">
      <div class="history">
        <img v-for="img in history" :class="{ selected: currentImage === img }" loading="lazy" :src="img" @click="onClickHistory(img)">
        <!-- History -->
      </div>
    </div>
  </div>
</main>
<div ref="settingsEl" class="modal shirink" @mousedown="toogleSettings">
  <Settings></Settings>
</div>
<div class="toaster" :class="{ shirink: !isGenerating }">
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
      font-size: 24px;  // it should be pixel unit, because it is title!
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
  flex: 1;
  padding: 2rem;
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
      0px 0px 0px 100px #181818 inset,
      0px 0px 0px 102px #FFFFFF00 inset;
    }
    50% {
      box-shadow:
      0px 0px 0px -2px #181818 inset,
      0px 0px 0px 0px #FFFFFF40 inset;
    }
    100% {
      box-shadow:
      0px 0px 0px -2px #181818 inset,
      0px 0px 0px 0px #FFFFFF40 inset;
    }
  }
}

//TODO: too many hard-coded values...
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
    margin: 10% auto;
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
  width: 80%;
  padding: 10px 2%;
  color: white;
  font-size: 0.8rem;
  text-align: center;
  background-color: #000a;
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
    height: calc(100% - 30px);
    overflow: hidden;
  }
  .sidebar {
    transition: transform 0.2s;
    &.shirink {
      transform: translateX(100%);
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
  }
  .sidebar-wrapper {
    height: calc(100% - 110px); //TODO: no hard-coding!
  }
}

/* @media (max-width:480px) {
} */
</style>
@/assets/data-manager@/assets/data-manager