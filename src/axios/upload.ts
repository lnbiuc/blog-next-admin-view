import axios from './index'

export function upload(data: FormData) {
  return axios.post('/api/v1/auth/file/upload', data)
}
