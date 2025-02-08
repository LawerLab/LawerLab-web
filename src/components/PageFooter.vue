<template>
  <footer class="page-footer bg-gray-50 p-5 pt-6 pb-6 text-xs font-medium text-center">
    <div class="register-code">
      <a href="https://beian.miit.gov.cn/" class="text-gray-400 hover:text-gray-300 transition-all duration-100" target="_blank" rel="noreferrer">
        苏ICP备2024153045号-2
      </a>
    </div>
    <div class="register-code text-gray-400">Copyright © 2024 ~ {{ dayjs().year() }} LawerLab. All Rights Reserved.
    </div>
  </footer>
</template>

<script setup>
import dayjs from 'dayjs'
</script>