<template>
	<footer
		class="page-footer border-t border-border bg-background/80 p-5 pt-6 pb-6 text-center text-xs font-medium text-foreground/60"
	>
		<div class="register-code">
			<a
				href="https://beian.miit.gov.cn/"
				class="transition-all duration-100 hover:text-foreground"
				target="_blank"
				rel="noreferrer"
			>
				苏ICP备2024153045号-2
			</a>
		</div>
		<div class="register-code">
			Copyright © 2024 ~ {{ dayjs().year() }} LawerLab. All Rights Reserved.
		</div>
	</footer>
</template>

<script setup>
import dayjs from 'dayjs'
</script>
