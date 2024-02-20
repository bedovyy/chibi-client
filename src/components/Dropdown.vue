<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
const modelValue = defineModel({ default: '' });
const datalist = defineModel('datalist', { default: [] });
const rootEl = ref(null);
const isListOpened = ref(false);

watch(isListOpened, newVal => {
  nextTick(() => newVal && rootEl.value.querySelector(".selected").scrollIntoView({ block: "center" }));
});

onMounted(() => {
  document.addEventListener('click', hideList);
});

onUnmounted(() => {
  document.removeEventListener('click', hideList);
})

function hideList(e) {
  if (!rootEl.value.contains(e.target)) {
    isListOpened.value = false;
  }
}

</script>
<template>
  <div ref="rootEl" class="dropdown-wrapper">
    <div class="dropdown-selected" :class="{ open: isListOpened }" tabindex="0" @click="isListOpened = !isListOpened">
      <div>{{ modelValue }}</div>
    </div>
    <ul v-show="isListOpened" class="dropdown-list">
      <li v-for="item in datalist" class="dropdown-item" :class="{ selected: item == modelValue }"
        @click="modelValue = item; isListOpened = false">{{ item }}</li>
    </ul>
  </div>
</template>
<style scoped lang="scss">
.dropdown-wrapper {
  position: relative;

  background-color: var(--color-background);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  box-sizing: border-box;
  margin: 2px 0;

  .dropdown-selected {
    display: flex;
    align-items: center;
    min-height: 35px; //TODO: no hardcoding!
    height: 100%;

    padding: 5px 26px 5px 10px;
    font-family: inherit;
    cursor: pointer;
    font-size: 1rem;

    >div {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    &:after {
      position: absolute;
      content: '▼';
      font-size: 16px;
      right: 10px;
      top: auto;
      bottom: auto;
      transition: all 0.2s;
    }

    &.open {
      outline: -webkit-focus-ring-color auto 1px;

      &:after {
        transform: rotate(180deg);
      }
    }

    &:disabled {
      background: var(--color-background-mute);
      color: var(--color-disabled);
      transition: transform 0.5s;
    }
  }

  ul {
    list-style: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: 0;
    margin: 1px 0;
    background: var(--color-background-soft);
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    z-index: 2;
    cursor: pointer;

    >li {
      padding: 6px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      &.selected,
      &:hover {
        background-color: var(--color-border);
      }
    }
  }
}
</style>