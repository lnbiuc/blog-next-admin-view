export interface Article {
  shortLink: string
  title: string
  description?: string
  cover?: string[]
  stack?: string[]
  category: string
  content: string
  authorId: number
  status: string
  tags?: string[]
}
