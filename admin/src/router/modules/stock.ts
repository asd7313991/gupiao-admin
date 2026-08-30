import { AppRouteRecord } from '@/types/router'
export const stockRoutes: AppRouteRecord = {
  path: '/stock',
  name: 'Stock',
  component: '/index/index',
  meta: { title: '证券列表', icon: 'ri-stock-line', roles: ['R_SUPER', 'R_ADMIN'] },
  children: [
    {
      path: 'info',
      name: 'StockInfo',
      component: '/stock/info',
      meta: { title: '证券信息', keepAlive: true }
    }
  ]
}
