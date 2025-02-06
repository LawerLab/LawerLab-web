<script setup>
import { RouterView } from 'vue-router'

import PageHeader from './components/PageHeader.vue'
import PageFooter from './components/PageFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <PageHeader />
    <div class="page-container min-h-screen">
      <RouterView />
    </div>
    <PageFooter />
  </div>
</template>