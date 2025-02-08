<template>
  <div class="min-h-screen flex flex-col">
    <PageHeader />
    <div class="page-container min-h-[90vh] flex justify-center">
      <RouterView v-slot="{ Component }">
        <component :is="Component" class="p-4 w-[1200px]" />
      </RouterView>
    </div>
    <PageFooter />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'

import PageHeader from './components/PageHeader.vue'
import PageFooter from './components/PageFooter.vue'
</script>