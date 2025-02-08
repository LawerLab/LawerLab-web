<template>
  <header class="page-header-wrapper w-full sticky top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 p-3 flex justify-center items-center">
    <div class="page-header relative mx-auto w-full max-w-[1200px] flex justify-between items-center px-4">
      <Sheet>
        <SheetTrigger as-child class="md:block lg:hidden">
          <button>
            <span class="!block material-icons text-2xl text-gray-600">menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" class="p-6">
          <nav class="flex flex-col space-y-4 text-lg">
            <RouterLink to="/" class="text-gray-700 hover:text-black">首页</RouterLink>
            <RouterLink to="/project" class="text-gray-700 hover:text-black">项目</RouterLink>
            <RouterLink to="/team" class="text-gray-700 hover:text-black">团队</RouterLink>
          </nav>
        </SheetContent>
      </Sheet>

      <div class="logo flex gap-[0.75rem] items-center text-xl font-bold mr-auto ml-2">
        <RoundedBorderLogo class="w-7 h-7 object-cover drop-shadow" />
        <span class="hidden lg:block">LawerLab</span>
      </div>
      
      <div class="link absolute left-1/2 -translate-x-1/2 max-md:hidden">
        <RouterLink to="/" class="cursor-pointer select-none text-gray-400 hover:text-gray-700" active-class="text-gray-700">
          <Button variant="ghost">首页</Button>
        </RouterLink>
        <RouterLink to="/project" class="cursor-pointer select-none text-gray-400 hover:text-gray-700" active-class="text-gray-700">
          <Button variant="ghost">项目</Button>
        </RouterLink>
        <RouterLink to="/team" class="cursor-pointer select-none text-gray-400 hover:text-gray-700" active-class="text-gray-700">
          <Button variant="ghost">我们</Button>
        </RouterLink>
      </div>
      
      <div class="scan flex gap-[0.5rem]">
        <DropdownMenu>
          <DropdownMenuTrigger class="flex items-center">
            <span class="material-icons block text-lg transition-all duration-300 cursor-pointer select-none text-gray-400 hover:text-gray-700">qr_code</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="flex justify-center items-center flex-col gap-[1rem] p-4">
            <div class="text-gray-600">打开微信扫一扫进入小程序</div>
            <img src="@/assets/images/toolkit/qr_code.jpg" class="block w-[200px] object-cover">
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import RoundedBorderLogo from '@/assets/images/logo/rounded_border_logo.svg'
</script>