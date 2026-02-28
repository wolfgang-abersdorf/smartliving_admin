<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

interface Collection {
  id: number
  title: { rendered: string } | string
  authorName?: string
  createdAt: string
  buildingsCount: number
}

const collections = ref<Collection[]>([])
const isLoading = ref(true)
const error = ref('')

async function fetchCollections() {
  try {
    const response = await api.get('/collections')
    collections.value = response.data
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to load collections'
    console.error('Failed to load collections', err)
  } finally {
    isLoading.value = false
  }
}

function getTitle(col: Collection): string {
  if (typeof col.title === 'string') return col.title
  return (col.title as any)?.rendered || 'Untitled'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d)
}

async function deleteCollection(id: number) {
  if (!confirm('Are you sure you want to delete this collection?')) return
  try {
    await api.delete(`/collections/${id}`)
    collections.value = collections.value.filter(c => c.id !== id)
  } catch (err: any) {
    alert('Failed to delete collection')
  }
}

onMounted(() => {
  fetchCollections()
})
</script>

<template>
  <div>
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-gray-900">Collections</h1>
        <p class="mt-2 text-sm text-gray-700">Списки объектов, собранные агентами для клиентов.</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <router-link
          to="/admin/collections/new"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
        >
          Add New Collection
        </router-link>
      </div>
    </div>

    <div class="mt-8 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white border border-gray-100">

            <!-- Error -->
            <div v-if="error" class="p-6 text-center text-red-600 text-sm italic">
              {{ error }}
            </div>

            <table v-else class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Author</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Items</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">

                <tr v-if="isLoading">
                  <td colspan="5" class="py-10 text-center text-sm text-gray-500">
                    <div class="flex items-center justify-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading collections...
                    </div>
                  </td>
                </tr>

                <tr v-else-if="collections.length === 0">
                  <td colspan="5" class="py-10 text-center text-sm text-gray-500 italic">
                    No collections found.
                  </td>
                </tr>

                <tr v-else v-for="col in collections" :key="col.id" class="hover:bg-gray-50">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ getTitle(col) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ col.authorName || '—' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {{ col.buildingsCount }} objects
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div class="text-xs text-gray-400">Published</div>
                    {{ formatDate(col.createdAt) }}
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <router-link :to="`/admin/collections/${col.id}`" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</router-link>
                    <button @click="deleteCollection(col.id)" class="text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      </div>
    </div>

    <!-- Stats footer -->
    <div v-if="!isLoading && collections.length > 0" class="mt-4 text-sm text-gray-500 text-right italic font-medium">
      Total: {{ collections.length }} collections
    </div>
  </div>
</template>
