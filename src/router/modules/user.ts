import { AppRouteRecord } from '@/types/router'

export const userRoutes: AppRouteRecord = {
  path: '/user',
  name: 'UserManagement',
  component: '/index/index',
  meta: {
    title: '用户管理',
    icon: 'ri:user-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'UserList',
      component: '/user/list',
      meta: { title: '用户列表', keepAlive: true }
    }
  ]
}
