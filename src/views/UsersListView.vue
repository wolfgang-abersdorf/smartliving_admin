<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { 
  UsersIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ShieldCheckIcon,
  IdentificationIcon
} from '@heroicons/vue/24/outline'

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

function getRoleStyle(role: string) {
  const r = role?.toLowerCase() || ''
  if (r.includes('admin')) return 'bg-purple-50 text-purple-600 border-purple-100'
  if (r.includes('agent')) return 'bg-blue-50 text-blue-600 border-blue-100'
  return 'bg-emerald-50 text-emerald-600 border-emerald-100'
}

onMounted(fetchUsers)
</script>

<template>
  <div class="pb-12">
    <div class="mb-10">
      <h1 class="text-3xl font-black text-slate-800 tracking-tight">Users & Agents</h1>
      <p class="text-slate-500 mt-1 font-medium">Manage platform access and permissions.</p>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
       <div v-for="i in 6" :key="i" class="h-64 glass rounded-[2rem] animate-pulse"></div>
    </div>

    <div v-else-if="error" class="p-10 glass rounded-[2rem] text-center text-rose-500 font-bold italic">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="user in users" :key="user.id" 
           class="group glass rounded-[2.5rem] p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border border-white/60 hover:-translate-y-2 relative overflow-hidden text-center">
        
        <div class="absolute top-0 right-0 h-24 w-24 bg-indigo-50/50 rounded-bl-[4rem] -z-10 group-hover:scale-110 transition-transform"></div>

        <div class="flex flex-col items-center">
          <div class="relative mb-6">
            <div class="h-24 w-24 rounded-3xl overflow-hidden shadow-xl border-4 border-white group-hover:scale-105 transition-transform duration-500">
               <img v-if="user.profile_photo_url" :src="user.profile_photo_url" class="h-full w-full object-cover" />
               <div v-else class="h-full w-full premium-gradient flex items-center justify-center text-white text-3xl font-black">
                 {{ user.username?.[0]?.toUpperCase() || 'U' }}
               </div>
            </div>
            <div class="absolute -bottom-2 -right-2 h-8 w-8 bg-white rounded-xl shadow-lg flex items-center justify-center text-indigo-500 border border-indigo-50">
               <ShieldCheckIcon v-if="user.role?.toLowerCase().includes('admin')" class="h-5 w-5" />
               <IdentificationIcon v-else class="h-5 w-5" />
            </div>
          </div>

          <h3 class="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
            {{ user.username }}
          </h3>
          <p class="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 mb-4">{{ user.name || 'Personal Account' }}</p>

          <div :class="[getRoleStyle(user.role), 'px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border mb-6 inline-block']">
            {{ user.role }}
          </div>

          <div class="w-full space-y-3 pt-6 border-t border-slate-50">
            <div class="flex items-center justify-center text-sm font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              <EnvelopeIcon class="h-4 w-4 mr-2 text-slate-300" />
              {{ user.email }}
            </div>
            <div class="flex items-center justify-center text-sm font-semibold text-slate-500">
              <PhoneIcon class="h-4 w-4 mr-2 text-slate-300" />
              {{ user.phone_number || 'No Phone' }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="users.length === 0" class="col-span-full py-20 text-center glass rounded-[2.5rem]">
        <UsersIcon class="h-16 w-16 mx-auto text-slate-200 mb-4" />
        <p class="text-slate-400 font-bold">No users found.</p>
      </div>
    </div>
  </div>
</template>
