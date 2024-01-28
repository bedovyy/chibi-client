<script setup>
import { onMounted, ref } from 'vue';
import Generator from './components/Generator.vue';
import imageOff from '@/assets/image-off.svg';
import axios from 'axios';

const history = ref()
const isConnected = ref(false);
const url = ref("172.17.2.11:8080");
let generatedImage = ref(imageOff);

function onGenerated(blob) {
  generatedImage.value = blob;
  const img = document.createElement('img');
  img.src = blob;
  img.addEventListener('click', (e) => {
    onClickHistory(e.target.src);
  })
  history.value.appendChild(img);
}

function onClickHistory(src) {
  generatedImage.value = src;
}

async function connectServer() {
  console.log(isConnected.value);
  if(url.value.length == 0) {
    return;
  }
  if (isConnected.value) {
    localStorage.removeItem('webui_url');
    isConnected.value = false;
    return;
  }

  url.value = url.value.replaceAll(/^http:\/\//g, '').replaceAll(/^https:\/\//g, '').replaceAll(/\/$/g, '');
  console.log(url);
  try {
    const res = await axios.get(`https://${url.value}/sdapi/v1/progress?skip_current_image=true`, { timeout: 3000 });
    if (res.status == 200 && res.data["progress"] != null) {
      localStorage.setItem('webui_url', `https://${url.value}`);
      isConnected.value = true;
    }
  } catch(e) {
    console.log(e);
    const res = await axios.get(`http://${url.value}/sdapi/v1/progress?skip_current_image=true`, { timeout: 3000 });
    console.log(res.data['progress'] );
    if (res.status == 200 && res.data['progress'] != null) {
      localStorage.setItem('webui_url', `http://${url.value}`);
      isConnected.value = true;
    }
  }
}

function noImg(e) {
  e.target.src = imageOff;
}

onMounted(() => {
  document.querySelector(":root").classList.toggle('dark-radio', true);

  if (localStorage.getItem('webui_url')) {
    url.value = localStorage.getItem('webui_url');
    connectServer();
  }
});
</script>

<template>
<header>
  <h1 class="title">SDClient</h1>
  <input type="url" v-model="url" :disabled="isConnected">
  <button @click="connectServer" :disabled="url.length == 0">{{ !isConnected ? "Connect" : "Disconnect" }}</button>
</header>
<main>
  <Generator class="generator" @generated="onGenerated" />
  <div class="preview">
    <img alt="Vue logo" class="preview-image" :src="generatedImage" @error="noImg" />
  </div>
  <div class="sidebar">
    <div ref="history" class="history">
      <!-- History -->
    </div>
  </div>
</main>
</template>

<style scoped lang="scss">
header {
  width: 100%;
  height: 30px;
  display: flex;
  gap: 10px;
  padding: 1px 10px;
  h1 {
    font-size: 24px;
    line-height: 24px;
    font-weight: bolder;
  }
  .title {
    width: 140px;
  }
  button {
    width: 85px;
  }
}
main {
  width: 100%;
  height: calc(100% - 30px);
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}
.generator {
  width: 450px;
  height: 100%;
  overflow-y: auto;
  z-index: 2;
  background-color: var(--color-background-soft);
}

.preview {
  padding: 2rem;
  width: calc(100% - 600px);
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  & .with-hisory {
    min-width: calc(100% - 650px);
  }
}

.sidebar {
  width: 150px;
  height: 100%;
  overflow-y: scroll;
  z-index: 2;
  background-color: var(--color-background-soft);

  .history {
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
  }
}

@media (max-width:1023px) {
  .generator {
    position: fixed;
    bottom: 0;
    min-width: 100%;
    height: 35px;
    transition: height 0.2s;
  }

  .preview {
    min-width: 100%;
  }
}

/* @media (max-width:480px) {
} */
</style>
