import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request
    .post<{ access_token: string }>({
      url: '/server-api/private/admin/system/user/login',
      params: {
        tenant_code: 'platform',
        account: params.userName.toLowerCase(),
        password: params.password
      }
    })
    .then((data) => ({ token: data.access_token, refreshToken: '' }))
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request
    .get<{ ID: number; Username: string; Name: string; Account: string }>({
      url: '/server-api/private/admin/system/user/info'
    })
    .then((data) => ({
      userId: data.ID,
      userName: data.Username || data.Name || data.Account,
      email: '',
      roles: ['R_SUPER'],
      buttons: []
    }))
}
