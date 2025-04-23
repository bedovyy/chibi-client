<script setup>
import { onMounted, ref } from 'vue';
import Dropdown from './Dropdown.vue';
import DataManager from '@/assets/data-manager';

const manager = DataManager.getInstance();

const url = manager.url;
const theme = manager.theme;
const historyWidth = manager.historyWidth;
const fontSize = manager.fontSize;
const maxSteps = manager.maxSteps;
const maxCfg = manager.maxCfg;
const keepGenerationInfo = manager.keepGenerationInfo;
const useTagautocomplete = manager.useTagautocomplete;
const themeList = manager.getThemeList();
const imageFormat = manager.imageFormat;
const imageFormatList = ["webp", "png"];
const imageQuality = manager.imageQuality;
const sizePresetBase = manager.sizePresetBase;
const sizePresetBaseList = ["All", "SD", "SDXL"];
const trueOrFalse = [true, false];
const showRandomTags = manager.showRandomTags;

const resetButtonEl = ref(null);
const clearHistoryButtonEl = ref(null);
let resetTimeout = null;

onMounted(() => {
  // Future: Load themes/taglists dynamically
});

function reload() {
  location.reload();
}

function resetSettings() {
  resetButtonEl.value.classList.add('pressing');
  resetTimeout = setTimeout(() => {
    manager.resetSettings();
  }, 2000);
}

function clearHistory() {
  clearHistoryButtonEl.value.classList.add('pressing');
  resetTimeout = setTimeout(async () => {
    await manager.clearHistory();
  }, 2000);
}

function skipReset() {
  if (resetTimeout) {
    clearTimeout(resetTimeout);
    resetButtonEl.value.classList.remove('pressing');
    clearHistoryButtonEl.value.classList.remove('pressing');
  }
  resetTimeout = null;
}
</script>

<template>
  <div class="settings-wrapper" @contextmenu.preventDefault="">
    <div v-if="!DataManager.getInstance().isExtension()" class="section">
      <h1>Connection</h1>
      <label for="url">API URL</label>
      <div class="row">
        <input id="url" v-model="url">
        <button @click="reload()">connect</button>
      </div>
    </div>

    <div v-if="false" class="section">
      <h1>AutoComplete</h1>
      <label for="autocomplete">Autocomplete</label>
      <Dropdown id="autocomplete" v-model:datalist="taglists"></Dropdown>
      <label for="extra-tags">Extra tags</label>
      <Dropdown id="extra-tags"></Dropdown>
    </div>

    <div class="section">
      <h1>Saving image <sup v-if="DataManager.getInstance().backendName.value == 'webui'" class="note">*WebUI's setting will be changed</sup></h1>
      <div class="row">
        <label for="imageFormat">File format for images</label>
        <Dropdown id="imageFormat" v-model="imageFormat" v-model:datalist="imageFormatList"></Dropdown>
      </div>
      <div class="row">
        <label for="imageQuality">Webp quality</label><span v-show="imageFormat != 'png'">{{ imageQuality }}%</span>
        <input id="imageQuality" type="range" min="50" max="100" step="10" :disabled="imageFormat == 'png'"
          v-model="imageQuality">
      </div>
      <h1>Generator</h1>
      <div class="row">
        <label for="keep-generator-info">Keep generator information</label>
        <Dropdown id="keep-generator-info" v-model="keepGenerationInfo" v-model:datalist="trueOrFalse"></Dropdown>
      </div>
      <div class="row">
        <label for="enable-danbooru-tags">Enable danbooru tag autocomplete</label>
        <Dropdown id="enable-danbooru-tags" v-model="useTagautocomplete" v-model:datalist="trueOrFalse"></Dropdown>
      </div>
      <div class="row">
        <label for="size-preset-base">Image size presets for </label>
        <Dropdown id="size-preset-base" v-model="sizePresetBase" v-model:datalist="sizePresetBaseList"></Dropdown>
      </div>
      <div class="row">
        <label for="max-steps">Maximum steps</label>
        <input id="max-steps" type="number" min="20" max="100" v-model="maxSteps">
      </div>
      <div class="row">
        <label for="max-cfg">Maximum CFG scale</label>
        <input id="max-cfg" type="number" maxlength="4" step="0.1" min="0" max="50" v-model="maxCfg">
      </div>
      <div class="row">
        <label for="show-random-tags">Show "Add Random Tags" button</label>
        <Dropdown id="show-random-tags"
                  v-model="showRandomTags"
                  v-model:datalist="trueOrFalse"></Dropdown>
      </div>
    </div>

    <div class="section">
      <h1>UI</h1>
      <div class="row reverse-size">
        <Dropdown id="theme" v-model="theme" v-model:datalist="themeList"></Dropdown>
        <label for="theme">Theme</label>
      </div>
      <div class="row">
        <label for="history-width">History width</label><span>{{ historyWidth }}px</span>
        <input id="history-width" type="range" min="100" max="200" step="25" v-model="historyWidth">
      </div>
      <div class="row">
        <label for="font-size">Font size</label><span>{{ fontSize }}px</span>
        <input id="font-size" type="range" min="12" max="24" step="1" v-model="fontSize">
      </div>
    </div>

    <div class="section">
      <h1>Reset settings <sup class="note">*keep the button pressed</sup></h1>

      <div class="row">
        <label for="reset">Reset settings</label>
        <button id="reset" ref="resetButtonEl" class="reset-button" @mousedown="resetSettings()" @mouseup="skipReset()"
          @mouseout="skipReset()" @touchstart="resetSettings()" @touchend="skipReset()">RESET</button>
      </div>
      <div class="row">
        <label for="clear-history">Clear history</label>
        <button id="clear-history" ref="clearHistoryButtonEl" class="reset-button" @mousedown="clearHistory()"
          @mouseup="skipReset()" @mouseout="skipReset()" @touchstart="clearHistory()"
          @touchend="skipReset()">CLEAR</button>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.settings-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  background: var(--color-background-soft);
  padding: 20px;
  border-radius: 12px;
  gap: 20px;

  h1 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .section {
    width: 100%;
    max-width: 600px;
    background: var(--color-background);
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0;

    label {
      flex: 1;
      font-weight: 500;
    }

    input, button, .dropdown {
      flex-shrink: 0;
    }

    input[type="range"] {
      flex: 1;
      margin-left: 12px;
    }

    &.reverse-size {
      flex-direction: row-reverse;
    }
  }

  button {
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  button.reset-button {
    background-color: #d9534f;
    color: white;

    &.pressing {
      background-color: #f0ad4e;
    }
  }

  span {
    margin-left: 10px;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  sup.note {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-style: italic;
    margin-left: 6px;
  }
}
</style>
