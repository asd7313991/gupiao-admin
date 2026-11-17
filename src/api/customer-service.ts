import request from '@/utils/http'

const url = '/server-api/private/admin/platform/setting/customer-service'

export interface CustomerServiceConfig {
  url: string
}

export function fetchCustomerService() {
  return request.get<CustomerServiceConfig>({ url, showErrorMessage: false })
}

export function saveCustomerService(data: CustomerServiceConfig) {
  return request.put<CustomerServiceConfig>({ url, params: data, showErrorMessage: false })
}
