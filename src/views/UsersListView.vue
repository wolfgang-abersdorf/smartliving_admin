<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

interface User {
  id: number
  email: string
  username: string
  name: string
  role: string
  phone_number: string
  profile_photo_url: string | null
}

const users = ref<User[]>([])
const isLoading = ref(true)
const error = ref('')

async function fetchUsers() {
  try {
    const response = await api.get('/users')
    users.value = response.data
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Failed to load users'
    console.error('Failed to load users', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-gray-900">Users</h1>
        <p class="mt-2 text-sm text-gray-700">Manage admin and agent accounts.</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <!-- Add User button could go here -->
      </div>
    </div>

    <div class="mt-8 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white">
            <div v-if="error" class="p-4 text-red-600 text-sm italic">{{ error }}</div>
            
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">User</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Phone</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-if="isLoading">
                  <td colspan="4" class="py-4 text-center text-sm text-gray-500">Loading users...</td>
                </tr>
                <tr v-else-if="users.length === 0">
                  <td colspan="4" class="py-4 text-center text-sm text-gray-500">No users found.</td>
                </tr>
                <tr v-for="user in users" :key="user.id">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div class="flex items-center">
                      <div class="h-10 w-10 flex-shrink-0">
                        <img v-if="user.profile_photo_url" class="h-10 w-10 rounded-full object-cover" :src="user.profile_photo_url" alt="" />
                        <div v-else class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {{ user.username?.[0]?.toUpperCase() || 'U' }}
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="font-medium text-gray-900">{{ user.username }}</div>
                        <div class="text-gray-500">{{ user.name }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ user.email }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span :class="[
                      user.role?.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800',
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
                    ]">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ user.phone_number || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
