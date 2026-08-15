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
    url: '/api/v3/system/menus'
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
