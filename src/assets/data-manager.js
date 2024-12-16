import { computed, ref, watch } from "vue";
import { parseCSV } from '@/assets/utils';
import History from '@/assets/history';

const token = "This is token for keeping singleton";
let instance = null;

// settings
const url = ref(window.location.href.replace(/\/chibi\/[^\/]*$/, ''));
const keepGenerationInfo = ref(true);
const useTagautocomplete = ref(true);
const theme = ref('radio-black');
const historyWidth = ref(150);
const fontSize = ref(16);
const maxSteps = ref(40);
const maxCfg = ref(10);
const imageFormat = ref("webp");  // webp, png
const imageQuality = ref(70);
const sizePresetBase = ref("SDXL");

const settingsArray = [
  url,
  keepGenerationInfo,
  useTagautocomplete,
  theme,
  historyWidth,
  fontSize,
  maxSteps,
  maxCfg,
  imageFormat,
  imageQuality,
  sizePresetBase
];

// api controller
const backendName = ref("");
const controller = ref(null);
const isGenerating = ref(false);

// tagautocomplete
const taglist = ref();
const extraTaglist = ref();
fetch('customs/taglist/danbooru_241106_compact.csv').then(res => res.text()).then(text => { taglist.value = parseCSV(text.replaceAll('_', ' ').replaceAll('(', '\\(').replaceAll(')', '\\)')); });
fetch('customs/taglist/extra.csv').then(res => res.text()).then(text => { extraTaglist.value = parseCSV(text.replaceAll('_', ' ').replaceAll('(', '\\(').replaceAll(')', '\\)')); });

// import info
const importedInfo = ref();

// from 24.02.24
function migrationLocalStorage(subkey) {
  const toMigration = ["chibi.settings", "chibi.generationInfo", "chibi.history"];
  toMigration.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.setItem(`${key}(${subkey})`, localStorage.getItem(key));
      localStorage.removeItem(key);
    }
  });
}

export default class DataManager {
  constructor(_token) {
    if (token != _token) {
      throw new Error("Use DataManager.getInstance()");
    }
    this.subkey = url.value;
    this.SETTINGS = `chibi.settings(${this.subkey})`;
    this.HISTORY = `chibi.history(${this.subkey})`;
    this.GENERATION_INFO = `chibi.generationInfo(${this.subkey})`;
    // migration local storage
    migrationLocalStorage(this.subkey);

    // moved here for using this.GENERATION_INFO
    watch(settingsArray, () => {
      fontSize.value = Math.max(10, Math.min(30, fontSize.value));
      maxSteps.value = maxSteps.value == "" ? maxSteps.value : Math.max(1, Math.min(50, maxSteps.value));
      maxCfg.value = maxCfg.value == "" ? maxCfg.value : Math.max(1, Math.min(50, maxCfg.value));
      if (!keepGenerationInfo.value) {
        localStorage.removeItem(this.GENERATION_INFO);
      }
      document.documentElement.style.fontSize = `${fontSize.value}px`;
      localStorage.setItem(this.SETTINGS, settingsArray.map(r => r.value));
    });

    if (localStorage.getItem(this.SETTINGS)) {
      localStorage.getItem(this.SETTINGS).split(',').forEach((v, i) => {
        if (v != null && v != 'null' && v != '[object Object]') {
          settingsArray[i].value = v;
        }
      });
    }
  }
  static getInstance() {
    if (!instance) {
      instance = new DataManager(token);
    }
    return instance;
  }

  // too many getters... do I need them?
  get url() { return url; }
  get theme() { return theme; }
  get historyWidth() { return historyWidth; }
  get fontSize() { return fontSize; }
  get maxSteps() { return maxSteps; }
  get maxCfg() { return maxCfg; }

  get imageFormat() { return imageFormat };
  get imageQuality() { return imageQuality; }
  get keepGenerationInfo() { return keepGenerationInfo; }
  get useTagautocomplete() { return useTagautocomplete; }
  get sizePresetBase() { return sizePresetBase; }

  get backendName() { return backendName; }
  get controller() { return controller; }
  get isGenerating() { return isGenerating; }

  get taglist() { return taglist; }
  get extraTaglist() { return extraTaglist; }

  get importedInfo() { 
    return importedInfo; }

  isExtension() {
    return controller.value != null && url.value.includes(window.location.host);
  }
  isConnected() {
    return controller.value != null;
  }

  getThemeList() {
    // yeah, it's hard-coded.
    return ['radio-black', 'radio-white', 'novellus'];
  }

  resetSettings() {
    localStorage.removeItem(this.SETTINGS);
    location.reload();
  }

  saveGenerationInfo(info) {
    if (info != null) {
      localStorage.setItem(this.GENERATION_INFO, JSON.stringify(info));
    }
  }
  loadGenerationInfo() {
    const infoFromStorage = localStorage.getItem(this.GENERATION_INFO);
    if (!infoFromStorage || infoFromStorage == "null") {
      return null;
    }
    return JSON.parse(infoFromStorage);
  }

  async saveHistory(url, info) {
    await History.open();
    await History.push(url, JSON.stringify(info));
  }
  async loadHistory() {
    let history = []
    await History.open()
    history = await History.getAll();
    history.forEach(h => {
      h.info = JSON.parse(h.info);
    })
    return history;
  }
  async clearHistory() {
    localStorage.removeItem(this.GENERATION_INFO);
    localStorage.removeItem(this.HISTORY);
    await History.open();
    await History.clearAll();
    location.reload();
  }
}
