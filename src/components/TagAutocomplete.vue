<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import getCaretCoordinates from 'textarea-caret';
import DataManager from '@/assets/data-manager'

const rootEl = ref(null);
const textareaEl = ref(null);
const autocompleteEl = ref(null);
const modelValue = defineModel({ default: '' });

const useTagautocomplete = DataManager.getInstance().useTagautocomplete;
const taglist = DataManager.getInstance().taglist;
const extraTaglist = DataManager.getInstance().extraTaglist;

let filteredTagList = ref(null);
let itemSelected = ref(-1);
let wordForAutocomplete = null;
let speciallyHide = ref(false);

watch(modelValue, () => resizeTextArea());
watch(DataManager.getInstance().fontSize, () => resizeTextArea());
const resizeObserver = new ResizeObserver(entries => entries.forEach(() => () => resizeTextArea()));

onMounted(() => {
  resizeObserver.observe(textareaEl.value);
  document.addEventListener('click', clearAutocomplete);
});

onUnmounted(() => {
  document.removeEventListener('click', clearAutocomplete);
})

//TODO: refresh condition for filteredTagList, but it should be in refreshAutocomplete or somewhere.
watch(filteredTagList, (newVal, oldVal) => {
  if (newVal != oldVal) {
    itemSelected.value = -1;
    // hide by ESC
    speciallyHide.value = false;
  }
})
function clearAutocomplete(e) {
  if (!e || !rootEl.value.contains(e.target)) {
    //TODO: too many variables for initialize.
    filteredTagList.value = null;
    wordForAutocomplete = null;
    itemSelected.value = -1;
  }
}

function resizeTextArea() {
  nextTick(() => {
    if (textareaEl.value) {
      textareaEl.value.style.height = "auto";
      textareaEl.value.style.height = `${textareaEl.value.scrollHeight + (textareaEl.value.offsetHeight - textareaEl.value.clientHeight)}px`;
    }
  });
}

async function fullSearch(word) {
  // filter prototype doesn't allow break.
  // filteredTagList.value = taglist.filter(tag => tag[0].includes(textForAutocomplete[0])).slice(0, 10);
  filteredTagList.value = [];
  for (let i = 0; i < extraTaglist.value.length; i++) {
    const test = [extraTaglist.value[i][0], extraTaglist.value[i][2]].join().toLowerCase();
    if (test.includes(word.toLowerCase())) {
      filteredTagList.value.push(extraTaglist.value[i]);
      if (filteredTagList.value.length >= 5) {
        break;
      }
    }
  }
  for (let i = 0; i < taglist.value.length; i++) {
    const test = [taglist.value[i][0], taglist.value[i][3]].join().toLowerCase();
    if (test.includes(word.toLowerCase())) {
      filteredTagList.value.push(taglist.value[i]);
      if (filteredTagList.value.length >= 10) {
        break;
      }
    }
  }

  if (filteredTagList.value.length == 1 && filteredTagList.value[0][0] == wordForAutocomplete) {
    // console.log ("one and only same word");
    clearAutocomplete();
    return;
  }
}

//TODO: REFACTORING!! seperate autocomplete feature with TagAutocomplete.
function refreshAutocomplete(e) {
  if (!useTagautocomplete.value) {
    return;
  }

  // modelValue is not presenting composition text (from android virtual keyboard), so use element's text.
  const textInTextArea = textareaEl.value.value;
  let lastIndex = textInTextArea.length;
  for (let i = textareaEl.value.selectionStart; i < textInTextArea.length; i++) {
    if (textInTextArea[i] == ',' || textInTextArea[i] == '\n') {
      lastIndex = i;
      break;
    }
  }

  // textListForAutocomplete has only one text btw.
  const textListForAutocomplete = (textInTextArea.substring(0, lastIndex).match(/[^,\s()][^,\n()]*$/));
  //TODO: it has an issue when clicking range selected text on text area.
  if (textListForAutocomplete == null || textareaEl.value.selectionStart != textareaEl.value.selectionEnd) {
    clearAutocomplete();
    return;
  }
  if (textListForAutocomplete[0] == wordForAutocomplete) {
    return; // doesn't need to update
  } else if (textListForAutocomplete[0].startsWith(wordForAutocomplete) && filteredTagList.value?.length == 0) {
    return; // we know there's no candidates.
  }

  wordForAutocomplete = textListForAutocomplete[0];
  setTimeout(() => {
    if (wordForAutocomplete != textListForAutocomplete[0]) {
      return;
    }
    fullSearch(textListForAutocomplete[0]).then(async () => {
      await nextTick(); // wait for resizing autocompleteEl
      const caretCoord = getCaretCoordinates(textareaEl.value, textListForAutocomplete.index);
      const actualLeft = Math.min(caretCoord.left, textareaEl.value.offsetWidth - autocompleteEl.value.offsetWidth);
      autocompleteEl.value.style.left = `${actualLeft}px`;
    });
  }, 200);
}

function navigateAutocomplete(e) {
  if (filteredTagList.value == null || filteredTagList.value.length == 0 || speciallyHide.value) {
    return;
  }

  switch (e.key) {
    case "ArrowDown":
      itemSelected.value = Math.min(filteredTagList.value.length - 1, Math.max(0, itemSelected.value + 1));
      e.preventDefault();
      break;
    case "ArrowUp":
      if (itemSelected.value < 0) {
        return;
      }
      itemSelected.value = Math.min(filteredTagList.value.length - 1, Math.max(0, itemSelected.value - 1));
      e.preventDefault();
      break;
    case "Enter":
      selectAutoComplete(itemSelected.value);
      e.preventDefault();
      break;
    case "Tab":
      e.preventDefault();
      break;
    case "Escape":
      speciallyHide.value = true;
      e.preventDefault();
      break;
  }
}

function selectAutoComplete(index) {
  //TODO: refactoring!!!
  let lastIndex = modelValue.value.length;
  for (let i = textareaEl.value.selectionStart; i < modelValue.value.length; i++) {
    if (modelValue.value[i] == ',' || modelValue.value[i] == '\n') {
      lastIndex = i;
      break;
    }
  }
  const textForAutocomplete = (modelValue.value.substring(0, lastIndex).match(/[^,\s()][^,\n()]*$/));
  const needSeperator = !modelValue.value.substring(lastIndex).trim().startsWith(',');
  let replacedText = modelValue.value.substring(0, textForAutocomplete.index) + filteredTagList.value[index][0] + (needSeperator ? ', ' : '');
  const caretPosition = replacedText.length;
  replacedText += modelValue.value.substring(lastIndex);
  modelValue.value = replacedText;

  //TODO: this breaks history(ctrl+z). need to change v-model to @input to fix it.
  nextTick(() => textareaEl.value.setSelectionRange(caretPosition, caretPosition));

  //TODO: too many things to do manually, and I don't want them.
  clearAutocomplete();
  textareaEl.value.focus();
}

</script>
<template>
  <div ref="rootEl" class="autocomplete-wrapper">
    <textarea ref="textareaEl" class="autocomplete" rows="3" v-model="modelValue" @input="resizeTextArea"
      @keydown="navigateAutocomplete" @keyup="refreshAutocomplete" @mouseup="refreshAutocomplete">
      </textarea>
    <ul v-show="filteredTagList?.length && !speciallyHide" ref="autocompleteEl" class="autocomplete">
      <li v-for="tag, index in filteredTagList" :class="{ selected: itemSelected == index }"
        @click="selectAutoComplete(index)" :style="`color: var(--color-tag${tag[1]})`">
        <div class="tag-item">
          {{ tag[0] }}
          <sub v-show="!Number.isInteger(Number(tag[2]))">{{ tag[2] }}</sub>
        </div>
      </li>
    </ul>
  </div>
</template>
<style scoped lang="scss">
.autocomplete-wrapper {
  position: relative;

  >* {
    width: 100%;
  }

  >textarea {
    resize: none;
  }

  >ul.autocomplete {
    list-style: none;
    position: absolute;
    width: fit-content;
    top: 100%;
    left: 0;
    padding: 0;
    background: var(--color-background-soft);
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    z-index: 2;
    cursor: pointer;

    >li {
      padding: 6px;
      // border: 1px solid black;

      &.selected,
      &:hover {
        background-color: var(--color-border);
      }

      >div.tag-item {
        display: flex;
        gap: 0 10px;
        justify-content: space-between;
        align-items: flex-end;

        sub {
          font-size: 0.7rem;
          font-style: italic;
        }
      }
    }
  }
}
</style>