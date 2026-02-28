<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { LockClosedIcon, UserIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMsg.value = 'Please enter both username (or email) and password.'
    return
  }

  errorMsg.value = ''
  isLoading.value = true

  try {
    await authStore.login(username.value, password.value)
    
    // Redirect to requested page or default dashboard
    const redirectPath = route.query.redirect as string || '/admin/dashboard'
    router.push(redirectPath)
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || err.message || 'Authentication failed. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-transparent font-['Outfit'] relative overflow-hidden">
    <!-- Background patterns -->
    <div class="absolute -top-40 -left-40 h-[600px] w-[600px] bg-indigo-100/50 blur-[120px] rounded-full"></div>
    <div class="absolute -bottom-40 -right-40 h-[600px] w-[600px] bg-purple-100/50 blur-[120px] rounded-full"></div>
    
    <div class="max-w-md w-full px-6 relative">
      <div class="glass p-12 rounded-[3rem] shadow-premium border border-white/60 text-center">
        <div class="flex flex-col items-center mb-10">
          <div class="h-20 w-20 premium-gradient rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200 mb-6 group hover:scale-110 transition-transform duration-500">
             <ShieldCheckIcon class="h-10 w-10 text-white" />
          </div>
          <h2 class="text-3xl font-black text-slate-800 tracking-tight">
            Admin Portal
          </h2>
          <p class="mt-2 text-slate-500 font-medium">
            SmartLiving Island Management
          </p>
        </div>

        <div v-if="errorMsg" class="mb-8 bg-rose-50 border border-rose-100 p-4 rounded-2xl animate-shake">
          <p class="text-xs font-bold text-rose-500 uppercase tracking-widest">{{ errorMsg }}</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div class="relative group">
              <UserIcon class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                id="username" 
                name="username" 
                type="text" 
                autocomplete="username" 
                required 
                v-model="username" 
                class="block w-full pl-12 pr-6 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-200 outline-none transition-all placeholder:text-slate-300" 
                placeholder="Username or email" 
              />
            </div>
            <div class="relative group">
              <LockClosedIcon class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                id="password" 
                name="password" 
                type="password" 
                autocomplete="current-password" 
                required 
                v-model="password" 
                class="block w-full pl-12 pr-6 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-200 outline-none transition-all placeholder:text-slate-300" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <div class="pt-4">
            <button 
              type="submit" 
              :disabled="isLoading" 
              class="w-full flex justify-center items-center py-4 px-6 premium-gradient text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
            >
              <template v-if="isLoading">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </template>
              <template v-else>
                Sign In Portal
              </template>
            </button>
          </div>
        </form>
        
        <p class="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Secured Enterprise Access
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
.animate-shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}
</style>
