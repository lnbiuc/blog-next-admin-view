<script setup lang="ts" generic="T extends any, O extends any">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import type { FormInstance, UploadFile, UploadProps } from 'element-plus'
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
    { required: true, message: 'Please input the description', trigger: 'blur' },
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
    { required: true, message: 'Please select the cover', trigger: 'blur' },
  ],
})

const articleId = ref<string>()

async function handlePublish(formEl: FormInstance | undefined) {
  if (localStorage.getItem('user') == null) {
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
          articleId.value = res.data.data
          saveToLocal()
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

function handleOnSave() {
  publishDialog.value = true
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

const recoverDialog = ref<boolean>(false)

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)

  // 遍历localStorage中的每个key
  for (let i = 0; i < localStorage.length; i++)
    savedKeys.value.push(localStorage.key(i) ? localStorage.key(i)! : 'NULL')

  savedKeys.value = savedKeys.value.filter(item => item !== 'token' && item !== 'user' && item !== 'vueuse-color-scheme')

  if (savedKeys.value.length > 0)
    recoverDialog.value = true
})

function handleRecover(key: string) {
  const data = localStorage.getItem(key)
  if (data)
    article.value = JSON.parse(data)

  else
    ElMessage.error('Recover failed')

  recoverDialog.value = false
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

const debouncedFn = useDebounceFn(() => {
  ElMessage.success('debouncedFn saved')
  saveToLocal()
}, 3000)

function saveToLocal() {
  if (articleId.value)
    useLocalStorage(articleId.value, JSON.stringify(article.value))
}

watch(article.value, async () => {
  debouncedFn()
})

// const saveLocalStatus = ref(false)
// const saveCloudStatus = ref(false)
</script>

<template>
  <div class="h-[50px] w-full flex flex-row items-center justify-between px-4">
    <div class="flex flex-row">
      <div class="w-300px flex flex-row items-center">
        title: <el-input v-model="article.title" class="mx-2" />
      </div>
      <div class="w-200px flex flex-row items-center">
        shortLink: <el-input v-model="article.shortLink" class="ml-2" />
      </div>
      <div class="ml-4 flex flex-row items-center">
        status:
        <div class="i-carbon-information-filled text-red ml-2" />
        <div class="i-carbon-checkmark-filled mx-2 text-yellow" />
        <div class="i-carbon-checkmark-filled text-green" />
      </div>
    </div>
    <div class="flex flex-row">
      <el-button class="mx-2" @click="publishDialog = true">
        publish
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
    v-model="recoverDialog"
    title="Recover Article"
  >
    <div>
      <div v-for="k in savedKeys" :key="k" class="flex flex-row items-center">
        <div>
          {{ k }}
        </div>
        <el-button class="ml-4" type="success" @click="handleRecover(k)">
          recover
        </el-button>
      </div>
    </div>
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
            <el-button type="primary" @click="handlePublish(ruleFormRef)">
              Publish
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.md-editor {
  height: 90vh;
  z-index: 10;
}
</style>
