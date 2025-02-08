<template>
  <div class="page-home">
    <div class="basic-info flex items-center flex-col py-16 pb-20 m-10">
      <div class="main-title text-5xl text-center font-semibold">提升律师工作效率</div>
      <div class="main-sub-title text-base text-gray-400 text-center mt-2">
        尽力为律师和法律工作者创造便利，这便是 LawerLab 的职责所在。
      </div>
      <Button variant="secondary" class="shadow-none m-5">
        <span>✨</span>
        <span class="border-l border-gray-300 h-4"></span>
        <span class="text-sm">微信搜索公众号 LawerLab</span>
      </Button>
    </div>
    <div class="content-show relative">
      <div class="screen-show flex items-center gap-[1rem] overflow-hidden lg:h-200">
        <img src="@/assets/images/toolkit/screenshots/1.jpg" class="w-full lg:w-1/3 h-full object-cover rounded select-none">
        <img src="@/assets/images/toolkit/screenshots/2.jpg" class="hidden lg:block w-1/3 h-full object-cover rounded select-none">
        <img src="@/assets/images/toolkit/screenshots/3.jpg" class="hidden lg:block w-1/3 h-full object-cover rounded select-none">
      </div>
      <div class="scan absolute bottom-0 left-1/2 -translate-x-1/2 w-fit flex justify-center items-center flex-col gap-[0.75rem] m-auto mt-5">
        <img src="@/assets/images/toolkit/qr_code.jpg" class="w-[6.5rem] h-[6.5rem] rounded-full bg-white p-2 drop-shadow select-none">
        <div class="content">
          <div class="title text-gray-500 text-base">微信扫码打开小程序</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
</script>

<style scoped lang="less">
.screen-show {
  mask: linear-gradient(to bottom, #fff -15%, transparent 95%);
}
</style>