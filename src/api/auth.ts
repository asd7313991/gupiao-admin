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
  return request.get<Api.Auth.UserInfo>({
    url: '/api/user/info'
    // 自定义请求头
    // headers: {
    //   'X-Custom-Header': 'your-custom-value'
    // }
  })
}
