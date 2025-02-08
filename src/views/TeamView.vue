<template>
  <div class="page-team flex flex-col">
    <div class="title text-3xl text-center m-5 font-semibold">我们</div>
    <div class="logo flex items-center justify-center flex-col">
      <RoundedBorderLogo class="w-[9rem] h-[9rem] object-cover drop-shadow" />
      <div class="text-4xl text-center font-bold mt-1 mb-6">LawerLab</div>
    </div>
    <Separator />
    <div class="member-list flex items-center justify-center w-fit gap-[1rem] mt-6 m-auto max-md:flex-col">
      <Card class="flex gap-[1rem] w-fit p-3 max-md:w-full">
        <Avatar>
          <AvatarImage src="public/images/avatar/Nina_avatar.jpg" />
        </Avatar>
        <div class="space-y-1">
          <h4 class="text-sm font-semibold">
            Nina Naganohara
          </h4>
          <p class="text-sm">
            团队代表人 & 第一开发者 & 逻辑编写 & 律师
          </p>
          <div class="flex items-center pt-2">
            <CalendarDays class="mr-2 h-4 w-4 opacity-70" />
            <span class="text-xs text-muted-foreground">
              2024年12月24日 创立
            </span>
          </div>
        </div>
      </Card>
      <Card class="flex gap-[1rem] w-fit p-3 max-md:w-full">
        <Avatar>
          <AvatarImage src="public/images/avatar/AurLemon_avatar.jpg" />
        </Avatar>
        <div class="space-y-1">
          <h4 class="text-sm font-semibold">
            AurLemon
          </h4>
          <p class="text-sm">
            第二开发者 & 界面编写 & 代码优化
          </p>
          <div class="flex items-center pt-2">
            <CalendarDays class="mr-2 h-4 w-4 opacity-70" />
            <span class="text-xs text-muted-foreground">
              2024年12月24日 加入
            </span>
          </div>
        </div>
      </Card>
    </div>
    <div class="follow text-sm text-center text-gray-400 mt-auto">
      欢迎微信搜索公众号
      <span class="font-semibold">
        LawerLab
      </span>
      并关注。
    </div>
  </div>
</template>

<script setup>
import RoundedBorderLogo from '@/assets/images/logo/rounded_border_logo.svg'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CalendarDays } from 'lucide-vue-next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
</script>