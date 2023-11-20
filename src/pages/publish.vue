<script setup lang="ts" generic="T extends any, O extends any">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import type { UploadProps } from 'element-plus'
import type { Article } from '../axios/api/type'
import { getAllTags } from '../axios/tag'
import axios from '~/axios'
import { publishArticle } from '~/axios/article'

const article: Ref<Article> = ref({
  shortLink: '',
  title: '',
  description: '',
  cover: [],
  stack: [],
  category: '',
  content: '',
  authorId: 0,
  status: '',
  tags: [],
})

const status = ref<string[]>([
  'PUBLISHED',
  'DELETED',
  'SAVER',
  'PRIVATE',
])

const category = ref<string[]>([
  'ARTICLE',
  'SHORTS',
  'PROJECT',
])

const tags = ref<string[]>([])

getAllTags().then((res: any) => {
  tags.value = res.data.data
})

const handleAvatarSuccess: UploadProps['onSuccess'] = (
  response,
) => {
  ElMessage.success('Upload success')
  article.value.cover?.push(response.data)
}

async function onUploadImg(files: Array<File>, callback: (urls: Array<string>) => void) {
  const res = await Promise.all(
    files.map((file) => {
      return new Promise((rev, rej) => {
        const form = new FormData()
        form.append('file', file)

        axios
          .post('http://192.168.31.231:1231/api/v1/auth/file/upload', form, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': localStorage.getItem('token'),
            },
          })
          .then(res => rev(res))
          .catch(error => rej(error))
      })
    }),
  )
  // @ts-expect-error unchecked
  callback(res.map(item => item.data.data))
}

const router = useRouter()

function handlePublish() {
  if (localStorage.getItem('user') == null) {
    router.push('/')
    return
  }

  article.value.authorId = JSON.parse(localStorage.getItem('user')!).id

  publishArticle(article.value).then((res) => {
    if (res.data.code === 200) {
      ElMessage.success('Publish success')

      article.value = {
        shortLink: '',
        title: '',
        description: '',
        cover: [],
        stack: [],
        category: '',
        content: '',
        authorId: 0,
        status: '',
        tags: [],
      }
    }

    else { ElMessage.error(res.data.msg) }
  })
}
</script>

<template>
  <div class="w-full">
    <MdEditor v-model="article.content" height="100vh" theme="dark" @on-upload-img="onUploadImg" />
  </div>
  <div class="flex flex-col">
    <div class="my-2 w-[500px]">
      <el-form :model="article" label-width="120px">
        <el-form-item label="title">
          <el-input v-model="article.title" />
        </el-form-item>
        <el-form-item label="Short Link">
          <el-input v-model="article.shortLink" />
        </el-form-item>
        <el-form-item label="description">
          <el-input v-model="article.description" type="textarea" />
        </el-form-item>
        <el-form-item label="status">
          <el-select v-model="article.status" placeholder="status">
            <el-option
              v-for="item in status"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="category">
          <el-select v-model="article.category" placeholder="category">
            <el-option
              v-for="item in category"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="tags">
          <el-select
            v-model="article.tags"
            filterable allow-create multiple default-first-option
            :reserve-keyword="false"
            placeholder="tags"
          >
            <el-option
              v-for="item in tags"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="cover">
          <div>
            <p v-for="a in article.cover" :key="a">
              {{ a }}
            </p>
          </div>
          <el-upload
            v-model="article.cover"
            list-type="picture-card"
            action="http://192.168.31.231:1231/api/v1/auth/file/upload"
            name="file"
            :drag="true"
            method="POST"
            multiple
            :on-success="handleAvatarSuccess"
            class="h-[100px] w-[100px]"
          >
            <!-- <img v-if="imageUrl" :src="imageUrl"> -->
            <!-- <el-icon v-else class="avatar-uploader-icon">
              <Plus />
            </el-icon> -->
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
    <el-button type="primary" @click="handlePublish">
      Publish
    </el-button>
    {{ article }}
  </div>
</template>
