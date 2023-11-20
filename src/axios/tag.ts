import axios from './index'

export function getAllTags() {
  return axios.get('/api/v1/tags/all')
}
