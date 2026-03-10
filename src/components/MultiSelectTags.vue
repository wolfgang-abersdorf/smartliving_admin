<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { XMarkIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'

interface Props {
  modelValue: string[]
  options: string[]
  placeholder?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select or type...',
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const query = ref('')
const isOpen = ref(false)

const filteredOptions = computed(() => {
  const lower = query.value.toLowerCase().trim()
  return props.options.filter(
    (opt) => !props.modelValue.includes(opt) && opt.toLowerCase().includes(lower)
  )
})

function openDropdown() {
  isOpen.value = true
  inputRef.value?.focus()
}

function addTag(tag: string) {
  const trimmed = tag.trim()
  if (trimmed && !props.modelValue.includes(trimmed)) {
    emit('update:modelValue', [...props.modelValue, trimmed])
  }
  query.value = ''
  inputRef.value?.focus()
}

function removeTag(index: number) {
  const newValue = [...props.modelValue]
  newValue.splice(index, 1)
  emit('update:modelValue', newValue)
}

function handleKeyDown(e: KeyboardEvent) {
  if ((e.key === 'Enter' || e.key === ',') && query.value.trim()) {
    e.preventDefault()
    addTag(query.value)
    isOpen.value = true
  } else if (e.key === 'Backspace' && !query.value && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1)
  } else if (e.key === 'Escape') {
    isOpen.value = false
  }
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Label -->
    <label v-if="label" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
      {{ label }}
    </label>

    <!-- Input Box / Tags Container -->
    <div
      class="flex flex-wrap items-center gap-1.5 min-h-[42px] px-2.5 py-2 border rounded-lg bg-white cursor-text transition-all"
      :class="isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-300 hover:border-gray-400'"
      @click="openDropdown"
    >
      <!-- Tags -->
      <span
        v-for="(tag, idx) in modelValue"
        :key="idx"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full whitespace-nowrap"
      >
        {{ tag }}
        <button
          type="button"
          @click.stop="removeTag(idx)"
          class="ml-0.5 rounded-full text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition-colors focus:outline-none"
          :title="`Remove ${tag}`"
        >
          <XMarkIcon class="h-3 w-3" />
        </button>
      </span>

      <!-- Text Input -->
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="flex-1 min-w-[80px] border-none outline-none bg-transparent text-sm text-gray-800 placeholder-gray-400 py-0.5"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        @focus="isOpen = true"
        @keydown="handleKeyDown"
        @input="isOpen = true"
      />

      <!-- Toggle Icon -->
      <ChevronDownIcon
        class="h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
        :class="isOpen ? 'rotate-180 text-indigo-500' : ''"
        @click.stop="isOpen = !isOpen"
      />
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen && (filteredOptions.length > 0 || query.trim())"
        class="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/60 overflow-hidden"
      >
        <!-- Custom value hint -->
        <div
          v-if="query.trim() && !options.includes(query.trim())"
          @mousedown.prevent="addTag(query)"
          class="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 font-medium cursor-pointer hover:bg-indigo-50 border-b border-gray-100"
        >
          <span class="text-indigo-400 font-bold text-xs">+ Add</span>
          <span class="font-semibold">"{{ query.trim() }}"</span>
        </div>

        <!-- Options list -->
        <div class="max-h-52 overflow-y-auto">
          <div
            v-for="option in filteredOptions"
            :key="option"
            @mousedown.prevent="addTag(option)"
            class="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
          >
            <span>{{ option }}</span>
            <span class="text-[10px] text-indigo-400 font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
          </div>

          <!-- Empty filtered state -->
          <div v-if="filteredOptions.length === 0 && !query.trim()" class="px-4 py-3 text-xs text-gray-400 text-center italic">
            All options selected
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
