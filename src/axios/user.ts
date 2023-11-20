import axios from './index'

export function login(data: { account: string; password: string }) {
  return axios.post('/api/v1/user/identify', data)
}
