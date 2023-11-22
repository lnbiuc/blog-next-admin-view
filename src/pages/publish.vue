<script setup lang="ts" generic="T extends any, O extends any">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import type { UploadFile, UploadProps } from 'element-plus'
import type { Article } from '~/axios/api/type'
import { getAllTags } from '~/axios/tag'
import axios from '~/axios'
import { publishArticle } from '~/axios/article'

const article: Ref<Article> = ref({
  shortLink: '',
  title: '',
  description: '',
  cover: [],
  stack: [],
  category: 'ARTICLE',
  content: '',
  authorId: 0,
  status: 'PUBLISHED',
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

const fileList = ref<Array<{ fileName: string; fileUrl: string | undefined }>>([])

const handleAvatarSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile: UploadFile,
) => {
  ElMessage.success('Upload success')
  article.value.cover?.push(response.data)
  if (uploadFile) {
    fileList.value.push({
      fileName: uploadFile.name,
      fileUrl: response.data,
    })
  }
}

async function onUploadImg(files: Array<File>, callback: (urls: Array<string>) => void) {
  const res = await Promise.all(
    files.map((file) => {
      return new Promise((rev, rej) => {
        const form = new FormData()
        form.append('file', file)

        axios
          .post('https://blog-api.vio.vin/api/v1/auth/file/upload', form, {
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

const dialogVisible = ref(false)

function handlePublish() {
  if (localStorage.getItem('user') == null) {
    router.push('/')
    return
  }

  article.value.authorId = JSON.parse(localStorage.getItem('user')!).id

  if (!checkPublishParams)
    return

  publishArticle(article.value).then((res) => {
    if (res.data.code === 200) {
      ElMessage.success('Publish success')
      dialogVisible.value = false
      article.value = {
        shortLink: '',
        title: '',
        description: '',
        cover: [],
        stack: [],
        category: 'ARTICLE',
        content: '',
        authorId: 0,
        status: 'PUBLISHED',
        tags: [],
      }

      getAllTags()
    }

    else { ElMessage.error(res.data.msg) }
  })
}

function checkPublishParams(): boolean {
  return false
}

function handleOnSave() {
  dialogVisible.value = true
}

function handleRemove(uploadFile: UploadFile) {
  article.value.cover = article.value.cover?.filter((item) => {
    const name = fileList.value.find(a => a.fileUrl === item)
    return name?.fileName !== uploadFile.name
  })
}

function handleKeyDown(event: any) {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault() // 阻止默认的保存网页行为
    handleOnSave()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="w-full">
    <MdEditor
      v-model="article.content"
      theme="dark"
      :page-fullscreen="true"
      class="z-0"
      @on-upload-img="onUploadImg"
      @on-save="handleOnSave"
    />
  </div>
  <el-dialog
    v-model="dialogVisible"
    title="Save"
  >
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
                v-for="i in tags"
                :key="i"
                :label="i"
                :value="i"
              >
                {{ i }}
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="cover">
            <div>
              <!-- <span v-for="a in article.cover" :key="a">
                {{ a }}
              </span> -->
            </div>
            <el-upload
              v-model="article.cover"
              action="https://blog-api.vio.vin/api/v1/auth/file/upload"
              name="file"
              :drag="true"
              method="POST"
              multiple
              :on-success="handleAvatarSuccess"
              class="h-full w-full"
              :on-remove="handleRemove"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handlePublish">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.md-editor {
  height: 90vh;
  z-index: 10;
}
</style>
