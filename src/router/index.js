import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import ProjectView from '@/views/ProjectView.vue'
import TeamView from '@/views/TeamView.vue'
import InterestView from '@/views/InterestView.vue'

const routes = [
	{ path: '/', component: HomeView },
	{ path: '/project', component: ProjectView },
	{ path: '/team', component: TeamView },
	{ path: '/tools/interest', component: InterestView },
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router
