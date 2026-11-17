import { AppRouteRecord } from '@/types/router'
export const settingsRoutes: AppRouteRecord = {
  path: '/settings',
  name: 'Settings',
  component: '/index/index',
  meta: { title: '应用配置', icon: 'ri-settings-3-line', roles: ['R_SUPER', 'R_ADMIN'] },
  children: [
    {
      path: 'customer-service',
      name: 'SettingsCustomerService',
      component: '/settings/customer-service',
      meta: { title: '客服设置' }
    },
    {
      path: 'sounds',
      name: 'SettingsSounds',
      component: '/settings/sounds',
      meta: { title: '声音提醒' }
    },
    {
      path: 'system',
      name: 'SettingsSystem',
      component: '/settings/system',
      meta: { title: '系统设置', keepAlive: true }
    },
    {
      path: 'notice',
      name: 'SettingsNotice',
      component: '/settings/notice',
      meta: { title: '公告管理', keepAlive: true }
    },
    {
      path: 'article',
      name: 'SettingsArticle',
      component: '/settings/article',
      meta: { title: '文章管理', keepAlive: true }
    },
    {
      path: 'news',
      name: 'SettingsNews',
      component: '/settings/news',
      meta: { title: '新闻列表', keepAlive: true }
    }
  ]
}
