import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'
import { userRoutes } from './user'
import { tradeRoutes } from './trade'
import { settingsRoutes } from './settings'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  userRoutes,
  tradeRoutes,
  settingsRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes
]
