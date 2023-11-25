export interface Article {
  shortLink?: string
  title?: string
  description?: string
  cover?: string[]
  stack?: string[]
  category?: string
  content?: string
  authorId?: number
  status?: string
  tags?: string[]
}

export interface ArticleWithID {
  id: number
  shortLink: string
  title: string
  description: string
  cover: string[]
  category: string
  tags: string[]
  content: string
  author: User
  createdAt: string
  updatedAt: string
  views: number
  likes: number
}

export interface User {
  id: number
  email: string
  nickname: string
  avatar: string
  bio: string
  status: string
}
