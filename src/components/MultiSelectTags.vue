<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/vue/20/solid'

interface Props {
  modelValue: string[]
  options: string[]
  placeholder?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select options...',
})

const emit = defineEmits(['update:modelValue'])

const query = ref('')

const filteredOptions = computed(() =>
  query.value === ''
    ? props.options
    : props.options.filter((option) =>
        option
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.value.toLowerCase().replace(/\s+/g, ''))
      )
)

function removeTag(index: number) {
  const newValue = [...props.modelValue]
  newValue.splice(index, 1)
  emit('update:modelValue', newValue)
}

function handleSelect(value: string) {
  if (!props.modelValue.includes(value)) {
    emit('update:modelValue', [...props.modelValue, value])
  }
  query.value = ''
}

function handleInputKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && query.value.trim() !== '') {
    e.preventDefault()
    if (!props.modelValue.includes(query.value.trim())) {
      emit('update:modelValue', [...props.modelValue, query.value.trim()])
    }
    query.value = ''
  }
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-xs font-medium text-gray-700 mb-1 capitalize">{{ label }}</label>
    <div class="relative mt-1">
      <div class="flex flex-wrap gap-2 p-1.5 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 min-h-[42px] transition-all">
        <!-- Selected Tags -->
        <span
          v-for="(tag, index) in modelValue"
          :key="index"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100 group hover:bg-indigo-100 transition-colors"
        >
          {{ tag }}
          <button
            type="button"
            @click="removeTag(index)"
            class="text-indigo-400 hover:text-indigo-600 focus:outline-none"
          >
            <XMarkIcon class="h-3.5 w-3.5" />
          </button>
        </span>

        <!-- Input Box -->
        <Combobox as="div" class="flex-1 min-w-[120px]" @update:modelValue="handleSelect">
          <div class="relative">
            <ComboboxInput
              class="w-full border-none focus:ring-0 p-0 text-sm text-gray-900 placeholder-gray-400 bg-transparent"
              :placeholder="modelValue.length === 0 ? placeholder : ''"
              @change="query = $event.target.value"
              @keydown="handleInputKeyDown"
              autocomplete="off"
            />
            <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
            </ComboboxButton>
          </div>

          <TransitionRoot
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            @after-leave="query = ''"
          >
            <ComboboxOptions class="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <div
                v-if="filteredOptions.length === 0 && query !== ''"
                class="relative cursor-default select-none py-2 px-4 text-gray-700"
              >
                Press Enter to add "{{ query }}"
              </div>

              <ComboboxOption
                v-for="option in filteredOptions"
                :key="option"
                :value="option"
                as="template"
                v-slot="{ active, selected }"
              >
                <li
                  class="relative cursor-default select-none py-2 pl-10 pr-4"
                  :class="{
                    'bg-indigo-600 text-white': active,
                    'text-gray-900': !active,
                  }"
                >
                  <span
                    class="block truncate"
                    :class="{ 'font-medium': selected, 'font-normal': !selected }"
                  >
                    {{ option }}
                  </span>
                  <span
                    v-if="props.modelValue.includes(option)"
                    class="absolute inset-y-0 left-0 flex items-center pl-3"
                    :class="{ 'text-white': active, 'text-indigo-600': !active }"
                  >
                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ComboboxOption>
            </ComboboxOptions>
          </TransitionRoot>
        </Combobox>
      </div>
    </div>
  </div>
</template>
