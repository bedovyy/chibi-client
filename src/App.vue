<script setup>
import { onMounted, ref } from 'vue';
import Generator from './components/Generator.vue';
import imageOff from '@/assets/image-off.svg';

const history = ref()
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


function noImg(e) {
  e.target.src = imageOff;
}

onMounted(() => {
  console.log("dark");
  document.querySelector(":root").classList.toggle('white-radio', true);
});
</script>

<template>
<header>
  <h2 class="title">SDFrontend</h2>
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

<style scoped>
header {
  width: 100%;
  height: 30px;
}
main {
  width: 100%;
  height: calc(100% - 30px);
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}
.generator {
  min-width: 450px;
  max-height: 100%;
  overflow-y: auto;
  z-index: 2;
  background-color: var(--color-background-soft);
}

.preview {
  padding: 2rem;
  min-width: calc(100% - 450px);
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
  position: fixed;
  right: 0;
  width: 150px;
  height: 100%;
  overflow-y: scroll;
  z-index: 2;

  background: #dfd4;
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
