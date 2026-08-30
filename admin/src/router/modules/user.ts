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
    },
    {
      path: 'devices',
      name: 'UserDevices',
      component: '/user/devices',
      meta: { title: '接口列表', keepAlive: true }
    },
    {
      path: 'funds',
      name: 'UserFunds',
      component: '/user/funds',
      meta: { title: '资金流水', keepAlive: true }
    },
    {
      path: 'banks',
      name: 'UserBanks',
      component: '/user/banks',
      meta: { title: '银行卡', keepAlive: true }
    },
    {
      path: 'verification',
      name: 'UserVerification',
      component: '/user/verification',
      meta: { title: '实名认证', keepAlive: true }
    }
  ]
}
