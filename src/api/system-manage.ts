import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus/simple'
  })
}

export interface ServerMenuAuth {
  id: number
  title: string
  authMark: string
}

export interface ServerMenu {
  id: number
  path: string
  name: string
  component?: string
  parentId: number
  meta: AppRouteRecord['meta']
  children?: ServerMenu[]
}

export interface ServerMenuPayload {
  id?: number
  path: string
  name: string
  component?: string
  title: string
  icon?: string
  showBadge: number
  showTextBadge?: string
  isHide: number
  isHideTab: number
  link?: string
  isIframe: number
  keepAlive: number
  isFirstLevel: number
  status: number
  parentId: number
  sort: number
}

const serverMenuUrl = '/server-api/private/admin/platform/menu'

export function fetchServerMenuList() {
  return request.get<ServerMenu[]>({ url: serverMenuUrl })
}

export function createServerMenu(data: ServerMenuPayload) {
  return request.post<ServerMenu>({ url: serverMenuUrl, params: data })
}

export function updateServerMenu(data: Required<Pick<ServerMenuPayload, 'id'>> & ServerMenuPayload) {
  return request.put<ServerMenu>({ url: serverMenuUrl, params: data })
}

export function deleteServerMenu(id: number) {
  return request.del<ServerMenu>({ url: serverMenuUrl, params: { id } })
}

export function createServerMenuAuth(data: { menu_id: number; title: string; mark: string }) {
  return request.post<ServerMenuAuth>({ url: `${serverMenuUrl}/auth`, params: data })
}

export function updateServerMenuAuth(data: { id: number; menu_id: number; title: string; mark: string }) {
  return request.put<ServerMenuAuth>({ url: `${serverMenuUrl}/auth`, params: data })
}

export function deleteServerMenuAuth(id: number) {
  return request.del<ServerMenuAuth>({ url: `${serverMenuUrl}/auth`, params: { id } })
}

export interface Customer {
  id: number
  phone: string
  name: string
  id_card: string
  bank_name: string
  bank_card: string
  bank_address: string
  group_name: string
  balance: number
  strategy_balance: number
  frozen_balance: number
  total_profit: number
  total_loss: number
  status: number
  fund_status: number
  verified: number
  id_card_front?: string
  id_card_back?: string
  verification_video?: string
  verification_remark?: string
  remark?: string
  created_at: string
  updated_at: string
}

export interface CustomerListResponse {
  records: Customer[]
  total: number
}

export interface CustomerQuery {
  page?: number
  pageSize?: number
  phone?: string
  idCard?: string
  name?: string
  group?: string
  status?: number
}

const customerUrl = '/server-api/private/admin/platform/customer'

export function fetchCustomers(params: CustomerQuery) {
  return request.get<CustomerListResponse>({ url: customerUrl, params })
}

export function fetchCustomerDetail(id: number) {
  return request.get<Customer>({ url: `${customerUrl}/detail`, params: { id } })
}

export function createCustomer(data: Partial<Customer> & { password?: string; trade_password?: string }) {
  return request.post<Customer>({ url: customerUrl, params: data })
}

export function updateCustomer(data: Partial<Customer> & { id: number }) {
  return request.put<Customer>({ url: customerUrl, params: data })
}

export function deleteCustomer(id: number) {
  return request.del<void>({ url: customerUrl, params: { id } })
}

export function depositCustomer(data: { id: number; currency: string; amount: number; remark?: string }) {
  return request.post<void>({ url: `${customerUrl}/deposit`, params: data })
}

export function updateCustomerStatus(id: number, status: number) {
  return request.put<void>({ url: `${customerUrl}/status`, params: { id, status } })
}

export function updateCustomerFundStatus(id: number, status: number) {
  return request.put<void>({ url: `${customerUrl}/fund-status`, params: { id, status } })
}
export function updateCustomerPassword(data: { id: number; password: string; type: 'login' | 'trade' }) {
  return request.put<void>({ url: `${customerUrl}/password`, params: data })
}
export function updateCustomerBank(data: { id: number; bank_name: string; bank_card: string; bank_address?: string }) {
  return request.put<void>({ url: `${customerUrl}/bank`, params: data })
}
export function reviewCustomerVerification(data: { id: number; verified: number; remark?: string }) {
  return request.put<void>({ url: `${customerUrl}/verification/review`, params: data })
}
export function batchReviewCustomerVerification(ids: number[], remark?: string) {
  return request.put<void>({ url: `${customerUrl}/verification/review/batch`, params: { ids, remark } })
}
export function batchUpdateCustomerStatus(ids: number[], status: number) {
  return request.put<void>({ url: `${customerUrl}/status/batch`, params: { ids, status } })
}

export interface CustomerDevice { id: number; customer_id: number; device_type: string; brand: string; device_model: string; device_id: string; api_base_url: string; system: string; app_version: string; blocked: number; last_login: number }
export interface CustomerFundRecord { id: number; customer_id: number; type: string; direction: string; currency: string; amount: number; balance: number; remark: string; created_at: string }

export function fetchCustomerDevices(phone?: string) {
  return request.get<CustomerDevice[]>({ url: `${customerUrl}/devices`, params: { phone } })
}
export function updateCustomerDeviceBlocked(id: number, blocked: number) {
  return request.put<void>({ url: `${customerUrl}/devices/block`, params: { id, blocked } })
}
export function batchUpdateCustomerDeviceBlocked(data: { phone?: string; device_id?: string; api_base_url?: string; blocked: number }) {
  return request.put<{ updated: number }>({ url: `${customerUrl}/devices/block/batch`, params: data })
}
export function fetchCustomerFundRecords(phone?: string) {
  return request.get<CustomerFundRecord[]>({ url: `${customerUrl}/fund-records`, params: { phone } })
}

const administratorUrl = '/server-api/private/admin/system/user'

export function updateAdministratorPassword(data: { id: number; password: string }) {
  return request.put<void>({ url: `${administratorUrl}/admin-password`, params: data })
}

export function resetAdministratorGoogleAuthSecret(id: number) {
  return request.put<{ secret: string; enabled: boolean }>({
    url: `${administratorUrl}/google-auth-secret/reset`,
    params: { id }
  })
}

export interface TradePosition { id: number; customer_id: number; symbol: string; stock_name: string; currency: string; position_qty: number; available_qty: number; current_price: number; cost_price: number; total_cost: number; market_value: number; profit_loss: number; profit_rate: number; status: number; buy_at: number }
const tradeUrl = '/server-api/private/admin/platform/trade/positions'
export function fetchTradePositions(params: { phone?: string; symbol?: string; stock_name?: string; status?: number }) { return request.get<TradePosition[]>({ url: tradeUrl, params }) }
export function saveTradePosition(data: Partial<TradePosition> & { customer_id: number; symbol: string }) { return data.id ? request.put<TradePosition>({ url: tradeUrl, params: data }) : request.post<TradePosition>({ url: tradeUrl, params: data }) }
export function deleteTradePosition(id: number) { return request.del<void>({ url: tradeUrl, params: { id } }) }

export interface TradeRecord { id: number; customer_id: number; customer_name: string; customer_phone: string; symbol: string; stock_name: string; currency: string; direction: '买入' | '卖出'; trade_price: number; quantity: number; amount: number; stamp_duty: number; transfer_fee: number; commission: number; remark: string; trade_at: number }
export interface TradeRecordPage { records: TradeRecord[]; total: number; page: number; page_size: number }
const tradeRecordUrl = '/server-api/private/admin/platform/trade/records'
export function fetchTradeRecords(params: { page: number; pageSize: number; phone?: string; symbol?: string; direction?: string }) { return request.get<TradeRecordPage>({ url: tradeRecordUrl, params }) }
export function saveTradeRecord(data: Partial<TradeRecord> & { customer_id: number; symbol: string; direction: '买入' | '卖出' }) { return data.id ? request.put<TradeRecord>({ url: tradeRecordUrl, params: data }) : request.post<TradeRecord>({ url: tradeRecordUrl, params: data }) }
export function deleteTradeRecord(id: number) { return request.del<void>({ url: tradeRecordUrl, params: { id } }) }

export interface AppSystemSetting { trade: Record<string, any>; risk: Record<string, any>; recharge: Record<string, any>; limits: Record<string, any>; links: Record<string, any> }
const systemSettingUrl = '/server-api/private/admin/platform/setting/system'
export function fetchAppSystemSetting() { return request.get<AppSystemSetting>({ url: systemSettingUrl }) }
export function saveAppSystemSetting(data: AppSystemSetting) { return request.put<void>({ url: systemSettingUrl, params: data }) }

export interface AppNotice { id: number; title: string; content: string; popup: boolean; recipient_ids: string; status: number; created_at: string; updated_at: string }
const noticeUrl = '/server-api/private/admin/platform/setting/notices'
export function fetchAppNotices(params: { page: number; pageSize: number; title?: string; popup?: string; status?: string }) { return request.get<{ records: AppNotice[]; total: number }>({ url: noticeUrl, params }) }
export interface AppNoticePayload { id?: number; title: string; content: string; popup: boolean; recipient_ids: number[]; status: number }
export function saveAppNotice(data: AppNoticePayload) { return data.id ? request.put<AppNotice>({ url: noticeUrl, params: data }) : request.post<AppNotice>({ url: noticeUrl, params: data }) }
export function deleteAppNotice(id: number) { return request.del<void>({ url: noticeUrl, params: { id } }) }
export function updateAppNoticeStatus(id: number, status: number) { return request.put<void>({ url: `${noticeUrl}/status`, params: { id, status } }) }

export interface AppArticle { id: number; title: string; type: string; content: string; status: number; created_at: string; updated_at: string }
const articleUrl = '/server-api/private/admin/platform/setting/articles'
export function fetchAppArticles(params: { page: number; pageSize: number; title?: string; status?: string }) { return request.get<{ records: AppArticle[]; total: number }>({ url: articleUrl, params }) }
export function saveAppArticle(data: Partial<AppArticle> & { title: string; type: string; content: string; status: number }) { return data.id ? request.put<AppArticle>({ url: articleUrl, params: data }) : request.post<AppArticle>({ url: articleUrl, params: data }) }
export function deleteAppArticle(id: number) { return request.del<void>({ url: articleUrl, params: { id } }) }
export function updateAppArticleStatus(id: number, status: number) { return request.put<void>({ url: `${articleUrl}/status`, params: { id, status } }) }
