<template>
	<div class="page-project">
		<div class="title text-3xl text-center m-5 font-semibold">项目</div>
		<div class="project flex justify-center">
			<Card>
				<CardHeader class="text-center">
					<CardTitle class="flex justify-center items-center gap-[0.25rem]">
						Lawer 工具箱
						<Badge variant="destructive">新发布</Badge>
					</CardTitle>
					<CardDescription>提供常用工具 · 微信小程序</CardDescription>
				</CardHeader>
				<CardContent>
					<Carousel class="relative w-full max-w-xs">
						<CarouselContent>
							<CarouselItem class="basis-1/2">
								<img
									src="@/assets/images/toolkit/screenshots/1.jpg"
									class="h-full object-cover rounded select-none"
								/>
							</CarouselItem>
							<CarouselItem class="basis-1/2">
								<img
									src="@/assets/images/toolkit/screenshots/2.jpg"
									class="h-full object-cover rounded select-none"
								/>
							</CarouselItem>
							<CarouselItem class="basis-1/2">
								<img
									src="@/assets/images/toolkit/screenshots/3.jpg"
									class="h-full object-cover rounded select-none"
								/>
							</CarouselItem>
						</CarouselContent>
					</Carousel>
					<div class="scan flex items-center justify-center mt-5">
						<img
							src="@/assets/images/toolkit/qr_code.jpg"
							class="w-[6rem] h-[6rem] rounded-full bg-white select-none"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
		<div class="div text-sm text-gray-400 text-center mt-10">
			更多项目陆续开发中
		</div>
	</div>
</template>

<script setup>
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
</script>
