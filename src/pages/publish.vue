<script setup lang="ts" generic="T extends any, O extends any">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ElNotification, type FormInstance, type UploadFile, type UploadProps } from 'element-plus'
import type { Article, ArticleWithID } from '~/axios/api/type'
import { getAllTags } from '~/axios/tag'
import axios from '~/axios'
import { getAllArticles, getArticleById, publishArticle, updateArticle } from '~/axios/article'

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

function getTags() {
  getAllTags().then((res: any) => {
    tags.value = res.data.data
  })
}

getTags()

const fileList = ref<Array<{ fileName: string; fileUrl: string | undefined }>>([])

const handleAvatarSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile: UploadFile,
) => {
  article.value.cover?.push(response.data)
  if (uploadFile) {
    fileList.value.push({
      fileName: uploadFile.name,
      fileUrl: response.data,
    })
  }
  ElNotification({
    title: 'Upload success',
    message: response.data,
    type: 'success',
    duration: 3000,
  })
}

async function onUploadImg(files: Array<File>, callback: (urls: Array<string>) => void) {
  ElNotification({
    title: 'Uploading',
    message: 'Uploading images, please wait',
    type: 'warning',
    duration: 3000,
  })
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
  ElNotification({
    title: 'Upload success',
    message: 'Upload success',
    type: 'success',
    duration: 3000,
  })
}

const router = useRouter()

const publishDialog = ref(false)

const ruleFormRef = ref<FormInstance>()

const rules = reactive({
  shortLink: [
    { required: true, message: 'Please input the short link', trigger: 'blur' },
  ],
  title: [
    { required: true, message: 'Please input the title', trigger: 'blur' },
  ],
  description: [
    { required: false, message: 'Please input the description', trigger: 'blur' },
  ],
  status: [
    { required: true, message: 'Please select the status', trigger: 'blur' },
  ],
  category: [
    { required: true, message: 'Please select the category', trigger: 'blur' },
  ],
  tags: [
    { required: true, message: 'Please select the tags', trigger: 'blur' },
  ],
  cover: [
    { required: false, message: 'Please select the cover', trigger: 'blur' },
  ],
})

const localSaved = ref(false)
const cloudSaved = ref(false)

const articleId = ref<string>()

async function handlePublish(formEl: FormInstance | undefined) {
  if (localStorage.getItem('user') == null || localStorage.getItem('token') == null) {
    router.push('/')
    return
  }

  if (!formEl)
    return
  formEl.validate((valid) => {
    if (valid) {
      article.value.authorId = JSON.parse(localStorage.getItem('user')!).id

      publishArticle(article.value).then((res) => {
        if (res.data.code === 200) {
          ElMessage.success('Publish success')
          publishDialog.value = false
          articleId.value = `${res.data.data}`
          cloudSaved.value = true
          saveToLocal()
          getTags()
        }

        else { ElMessage.error(res.data.msg) }
      })
    }
    else {
      ElMessage.error('Please input the title and description')
      return false
    }
  })
}

const timeCount = ref<number>(30000)

function updateContent() {
  if (!articleId.value) {
    publishDialog.value = true
    return
  }
  const data: Article = {
    content: article.value.content,
  }
  updateArticle(data, articleId.value).then((res) => {
    saveToLocal()
    if (res.data.code === 200 && res.data.data === 1) {
      ElMessage.success('Content Update success')
      cloudSaved.value = true
      timeCount.value = 30000
    }

    else { ElMessage.error(res.data.msg) }
  })
}

const debouncedUpdateContent = useDebounceFn(() => {
  updateContent()
}, 3000)

function handleOnSave() {
  if (!articleId.value) {
    publishDialog.value = true
    return
  }
  debouncedUpdateContent()
}

function handleRemove(uploadFile: UploadFile) {
  article.value.cover = article.value.cover?.filter((item) => {
    const name = fileList.value.find(a => a.fileUrl === item)
    return name?.fileName !== uploadFile.name
  })
}

function handleKeyDown(event: any) {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    handleOnSave()
  }
}

const savedKeys = ref<string[]>([])

onMounted(() => {
  if (localStorage.getItem('user') == null || localStorage.getItem('token') == null)
    router.push('/')
  document.addEventListener('keydown', handleKeyDown)

  // 遍历localStorage中的每个key
  for (let i = 0; i < localStorage.length; i++)
    savedKeys.value.push(localStorage.key(i) ? localStorage.key(i)! : 'NULL')

  savedKeys.value = savedKeys.value.filter(item => item !== 'token' && item !== 'user' && item !== 'vueuse-color-scheme')
})

function getTitleById(id: string): string {
  const data = localStorage.getItem(id)
  if (data) {
    const article: Article = JSON.parse(data)
    return article.title ? article.title : ''
  }
  return ''
}

const autoSave = ref<boolean>(false)

const currentRecoverKey = ref()

function handleRecover() {
  if (!currentRecoverKey.value) {
    ElMessage.error('Recover failed')
    return
  }
  const data = localStorage.getItem(currentRecoverKey.value)
  if (data) {
    article.value = JSON.parse(data)
    articleId.value = currentRecoverKey.value
    autoSave.value = true
  }

  else { ElMessage.error('Recover failed') }
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

const debouncedFn = useDebounceFn(() => {
  saveToLocal()
}, 3000)

function saveToLocal() {
  if (articleId.value) {
    localStorage.setItem(articleId.value, JSON.stringify(article.value))
    localSaved.value = true
  }
}

watch(article, () => {
  localSaved.value = false
  cloudSaved.value = false
  debouncedFn()
}, { deep: true })

function handleClean() {
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
  localSaved.value = false
  cloudSaved.value = false
  articleId.value = undefined
  autoSave.value = false
  getTags()
}

const { pause, resume } = useIntervalFn(() => {
  timeCount.value = timeCount.value - 1000
}, 1000)

watchEffect(() => {
  if (articleId.value && autoSave.value) {
    resume()
  }

  else {
    pause()
    timeCount.value = 30000
  }
})

watch(timeCount, () => {
  if (timeCount.value === 0) {
    updateContent()
    timeCount.value = 30000
  }
})

function handleCleanCover() {
  article.value.cover = []
}

function handleUpdateArticle() {
  if (!articleId.value) {
    ElMessage.error('Update failed, No ArticleId')
    return
  }

  updateArticle(article.value, articleId.value).then((res) => {
    saveToLocal()
    if (res.data.code === 200 && res.data.data === 1) {
      ElMessage.success('Article Update success')
      cloudSaved.value = true
      publishDialog.value = false
    }

    else { ElMessage.error(res.data.msg) }
  })
}

const articleListDialog = ref<boolean>(false)

const articleList = ref<ArticleWithID[]>([])

function handleOpenArticleList() {
  getAllArticles().then((res) => {
    if (res.data.code === 200) {
      articleList.value = res.data.data
      articleListDialog.value = true
    }
    else { ElMessage.error(res.data.msg) }
  })
}

function handleLoadArticle(id: string) {
  getArticleById(id).then((res) => {
    if (res.data.code === 200) {
      article.value = res.data.data
      localStorage.setItem(id, JSON.stringify(article.value))
      articleId.value = id
      autoSave.value = true
      articleListDialog.value = false
    }
    else { ElMessage.error(res.data.msg) }
  })
}
</script>

<template>
  <div class="h-[50px] w-full flex flex-row items-center justify-between px-4">
    <div class="flex flex-row">
      <!-- <div class="w-300px flex flex-row items-center">
        title: <el-input v-model="article.title" class="mx-2" />
      </div>
      <div class="w-200px flex flex-row items-center">
        shortLink: <el-input v-model="article.shortLink" class="ml-2" />
      </div> -->
      <div v-if="localSaved || cloudSaved" class="ml-4 flex flex-row items-center">
        status:
        <div v-if="!localSaved && !cloudSaved" class="i-carbon-information-filled ml-2 text-red" />
        <div v-if="localSaved" class="i-carbon-checkmark-filled mx-2 text-yellow" />
        <div v-if="cloudSaved" class="i-carbon-checkmark-filled text-green" />
      </div>
      <div v-if="savedKeys.length > 0" class="ml-2">
        recover:
        <el-select v-model="currentRecoverKey">
          <el-option
            v-for="item in savedKeys"
            :key="item"
            :label="getTitleById(item)"
            :value="item"
          />
        </el-select>
        <el-button class="mx-2" type="success" @click="handleRecover">
          recover
        </el-button>
      </div>
      <div>
        <el-popconfirm title="Are you sure to clean this form?" @confirm="handleClean">
          <template #reference>
            <el-button type="danger">
              clean
            </el-button>
          </template>
        </el-popconfirm>
      </div>
      <div>
        <el-button class="ml-2" type="primary" @click="handleOpenArticleList">
          Open Article List
        </el-button>
      </div>
    </div>
    <div class="flex flex-row items-center">
      <div class="mr-2 text-green">
        {{ timeCount / 1000 }}
      </div>
      <el-switch v-model="autoSave" />
      <el-button v-if="articleId" class="ml-2" type="success" @click="publishDialog = true">
        Update
      </el-button>
      <el-button v-else class="ml-2" type="primary" @click="publishDialog = true">
        Publish
      </el-button>
    </div>
  </div>
  <div class="w-full">
    <MdEditor
      v-model="article.content"
      theme="dark"
      :page-fullscreen="false"
      class="z-0"
      @on-upload-img="onUploadImg"
      @on-save="handleOnSave"
    />
  </div>
  <el-dialog
    v-model="articleListDialog"
    title="Article List"
    fullscreen
  >
    <el-table :data="articleList" stripe fit border>
      <el-table-column
        prop="id"
        label="ID"
      />
      <el-table-column
        prop="title"
        label="Title"
      />
      <el-table-column
        prop="shortLink"
        label="Short Link"
      >
        <template #default="scope">
          <a :href="`https://blog.lnbiuc.com/article/${scope.row.shortLink}`" target="_blank" class="link text-blue">
            {{ scope.row.shortLink }}
          </a>
        </template>
      </el-table-column>
      <el-table-column
        prop="description"
        label="Description"
      />
      <el-table-column
        prop="cover"
        label="Cover"
      >
        <template #default="scope">
          <img v-for="c in scope.row.cover" :key="c" :src="c" class="w-full object-cover">
        </template>
      </el-table-column>
      <el-table-column
        prop="category"
        label="Category"
        width="100"
      />
      <el-table-column
        prop="status"
        label="Status"
        width="140"
      >
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'PUBLISHED'" type="success">
            {{ scope.row.status }}
          </el-tag>
          <el-tag v-else-if="scope.row.status === 'DELETED'" type="danger">
            {{ scope.row.status }}
          </el-tag>
          <el-tag v-else-if="scope.row.status === 'SAVER'" type="warning">
            {{ scope.row.status }}
          </el-tag>
          <el-tag v-else-if="scope.row.status === 'PRIVATE'" type="info">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="tags"
        label="Tags"
      >
        <template #default="scope">
          <el-tag v-for="t in scope.row.tags" :key="t" class="m-1">
            {{ t }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="createdAt"
        label="CreatedAt"
      />
      <el-table-column
        prop="updatedAt"
        label="UpdatedAt"
      />
      <el-table-column
        prop="views"
        label="Views"
        width="70"
      />
      <el-table-column
        prop="likes"
        label="Likes"
        width="70"
      />
      <el-table-column
        label="Action"
        width="100"
      >
        <template #default="{ row }">
          <el-button type="primary" @click="handleLoadArticle(row.id)">
            Load
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
  <el-dialog
    v-model="publishDialog"
    title="Publish"
  >
    <div class="flex flex-col">
      <div class="mx-a my-2 w-[500px] text-center">
        <el-form ref="ruleFormRef" :model="article" label-width="120px" :rules="rules" label-position="top">
          <el-form-item label="title" prop="title">
            <el-input v-model="article.title" />
          </el-form-item>
          <el-form-item label="Short Link" prop="shortLink">
            <el-input v-model="article.shortLink" />
          </el-form-item>
          <el-form-item label="description" prop="description">
            <el-input v-model="article.description" type="textarea" />
          </el-form-item>
          <el-form-item label="status" prop="status">
            <el-select v-model="article.status" placeholder="status">
              <el-option
                v-for="item in status"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="category" prop="category">
            <el-select v-model="article.category" placeholder="category">
              <el-option
                v-for="item in category"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="tags" prop="tags">
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
          <el-form-item label="cover" prop="cover">
            <el-button class="mb-4" text bg @click="handleCleanCover">
              Clean cover
            </el-button>
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
            >
              <img v-for="c in article.cover" :key="c" :src="c" class="mt-2 w-full object-cover">
            </el-upload>
          </el-form-item>
          <el-form-item>
            <el-button v-if="articleId" class="ml-2" type="success" @click="handleUpdateArticle">
              Update
            </el-button>
            <el-button v-else type="primary" @click="handlePublish(ruleFormRef)">
              Publish
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-collapse>
        <el-collapse-item title="meta data" name="1">
          <div>
            {{ article }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-dialog>
</template>

<style scoped>
.md-editor {
  height: 90vh;
  z-index: 10;
}
</style>
