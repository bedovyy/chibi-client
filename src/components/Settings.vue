<script setup>
import { computed, onMounted, ref } from 'vue';
import Dropdown from './Dropdown.vue';
import DataManager from '@/assets/data-manager';

// const taglists = import.meta.glob("/public/taglist/*.csv");
// const themes = import.meta.glob('/theme/*.css');

const url = DataManager.getInstance().url;
const theme = DataManager.getInstance().theme;
const historyWidth = DataManager.getInstance().historyWidth;
const fontSize = DataManager.getInstance().fontSize;
const maxSteps = DataManager.getInstance().maxSteps;
const maxCfg = DataManager.getInstance().maxCfg;

const keepGenerationInfo = DataManager.getInstance().keepGenerationInfo;
const useTagautocomplete = DataManager.getInstance().useTagautocomplete;
const trueOrFalse = [true, false];
const themeList = DataManager.getInstance().getThemeList();
const imageFormat = DataManager.getInstance().imageFormat;
const imageFormatList = ["webp", "png"];
const imageQuality = DataManager.getInstance().imageQuality;

const resetButtonEl = ref(null);
const clearHistoryButtonEl = ref(null);
let resetTimeout = null;

onMounted(() => {
  // TODO: Add user theme and taglists
  // console.log(taglists, themes, import.meta.glob("/dist/*.csv"));
  // fetch(Object.keys(taglists)[0]).then(res => res.text()).then(text => { console.log(text); });
})

function reload() {
  location.reload();
}

function resetSettings() {
  resetButtonEl.value.classList.add('pressing');
  resetTimeout = setTimeout(() => {
    DataManager.getInstance().resetSettings();
    resetCount = -1;
  }, 2000);
}
function clearHistory() {
  clearHistoryButtonEl.value.classList.add('pressing');
  resetTimeout = setTimeout(() => {
    DataManager.getInstance().clearHistory();
    resetCount = -1;
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
      <h1>Generator</h1>
      <div class="row">
        <label for="imageFormat">File format for images</label>
        <Dropdown id="imageFormat" v-model="imageFormat" v-model:datalist="imageFormatList"></Dropdown>
      </div>
      <div class="row">
        <label for="imageQuality">Webp quality</label><span v-show="imageFormat != 'png'">{{ imageQuality }}%</span>
        <input id="imageQuality" type="range" min="50" max="100" step="10" :disabled="imageFormat == 'png'"
          v-model="imageQuality">
      </div>
      <div class="row">
        <label for="keep-generator-info">Keep generator infomation</label>
        <Dropdown id="keep-generator-info" v-model="keepGenerationInfo" v-model:datalist="trueOrFalse"></Dropdown>
      </div>
      <div class="row">
        <label for="enable-danbooru-tags">Enable danbooru tag autocomplete</label>
        <Dropdown id="enable-danbooru-tags" v-model="useTagautocomplete" v-model:datalist="trueOrFalse"></Dropdown>
      </div>
      <div class="row">
        <label for="max-steps">Maximum steps</label>
        <input id="max-steps" type="number" min="20" max="100" v-model="maxSteps">
      </div>
      <div class="row">
        <label for="max-cfg">Maximum CFG scale</label>
        <input id="max-cfg" type="number" maxlength="4" step="0.1" min="0" max="50" v-model="maxCfg">
      </div>
    </div>

    <div class="section">
      <h1>UI</h1>
      <div class="row reverse-size">
        <label for="theme">Theme</label>
        <Dropdown id="theme" v-model="theme" v-model:datalist="themeList"></Dropdown>
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
  align-content: flex-start;
  justify-content: center;
  gap: 0 10%;
  border: 2px solid var(--color-background-mute);
  border-radius: 16px;
  background: var(--color-background-soft);
  padding: 10px 3%;

  h1 {
    padding-top: 12px;
    font-size: 24px;
    line-height: 36px;
    font-weight: bolder;
  }

  sup,
  sub {
    display: inline-block;
    color: var(--color-text-secondary);
    font-size: 0.8rem;
    font-style: italic;
  }

  label,
  input {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-height: 40px;
    height: 40px;
  }

  input[type="checkbox"] {
    height: 20px;
    max-height: 20px;
  }

  input[type="range"]:disabled::-webkit-slider-thumb {
    background-color: var(--color-background-soft);
    outline: 3px solid var(--color-background-soft);
  }

  button {
    margin: 1px 0;
  }

  span {
    font-size: small;
  }

  .section {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    >*:first-child {
      min-width: 120px;
      width: 60%;
    }

    >*:last-child {
      width: 90px;
      height: 40px;
    }

    >input:last-child {
      text-align: right;
    }

    &.reverse-size {
      >*:last-child {
        min-width: 120px;
        width: 60%;
        height: auto;
      }

      >*:first-child {
        min-width: auto;
        width: 90px;
        height: 40px;
      }
    }
  }

  button.reset-button {
    position: relative;
    background: red;
    height: 40px;
    transition: background 2s ease-in-out;
    color: white;

    &.pressing {
      background: orange;
    }
  }
}</style>