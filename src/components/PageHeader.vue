<template>
  <header class="page-header-wrapper w-full sticky top-0 left-0 right-0 bg-white backdrop-blur-md border-b border-gray-100 p-3 flex justify-center items-center">
    <div class="page-header relative mx-auto w-[1200px] flex justify-between items-center">
      <div class="logo font-bold mr-10">
        LawerLab
      </div>
      <div class="link absolute left-1/2 -translate-x-1/2 flex space-x-4">
        <RouterLink to="/" class="cursor-pointer select-none text-gray-400 hover:text-gray-700" active-class="text-gray-700">
          <Button variant="ghost">首页</Button>
        </RouterLink>
        <RouterLink to="/project" class="cursor-pointer select-none text-gray-400 hover:text-gray-700" active-class="text-gray-700">
          <Button variant="ghost">项目</Button>
        </RouterLink>
        <RouterLink to="/team" class="cursor-pointer select-none text-gray-400 hover:text-gray-700" active-class="text-gray-700">
          <Button variant="ghost">团队</Button>
        </RouterLink>
        <RouterLink to="/about" class="cursor-pointer select-none text-gray-400 hover:text-gray-700" active-class="text-gray-700">
          <Button variant="ghost">关于</Button>
        </RouterLink>
      </div>
      <div class="scan">
        <HoverCard>
          <HoverCardTrigger class="flex items-center">
            <span class="material-icons block transition-all duration-300 cursor-pointer select-none text-gray-400 hover:text-gray-700">qr_code</span> 
          </HoverCardTrigger>
          <HoverCardContent class="flex justify-center items-center flex-col gap-[1rem]">
            <div class="text-sm text-gray-600">打开微信扫一扫进入小程序</div>
            <img src="@/assets/images/toolkit/qr_code.jpg" class="block w-[200px] object-cover">
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'

import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
</script>