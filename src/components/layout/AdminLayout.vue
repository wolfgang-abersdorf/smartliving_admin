<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="h-full flex bg-gray-100">
    <!-- Static Sidebar Placeholder -->
    <div class="hidden md:flex md:w-64 md:flex-col">
      <div class="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
        <div class="flex items-center flex-shrink-0 px-4 py-5 font-bold text-xl text-indigo-600">
          Admin Panel
        </div>
        <div class="mt-5 flex-grow flex flex-col">
          <nav class="flex-1 px-2 pb-4 space-y-1">
            <a href="/admin/dashboard" class="bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
              Dashboard
            </a>
          </nav>
        </div>
      </div>
    </div>

    <!-- Main Content wrapper -->
    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <main class="flex-1 relative z-0 overflow-y-auto focus:outline-none">
        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <RouterView />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
