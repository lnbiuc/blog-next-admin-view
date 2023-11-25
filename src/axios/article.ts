import axios from './index'
import type { Article } from '~/axios/api/type'

export function publishArticle(data: Article) {
  return axios.post('/api/v1/auth/article/publish', data)
}

export function updateArticle(data: Article, articleId: string) {
  return axios.post(`/api/v1/auth/article/update/${articleId}`, data)
}
