<script setup lang="ts" generic="T extends any, O extends any">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import type { UploadProps } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Article } from '../axios/api/type'
import { getAllTags } from '../axios/tag'

defineOptions({
  name: 'IndexPage',
})

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

const imageUrl = ref('')

const handleAvatarSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile,
) => {
  imageUrl.value = URL.createObjectURL(uploadFile.raw!)
}
</script>

<template>
  <div class="w-full">
    <MdEditor v-model="article.content" theme="dark" />
  </div>
  <div class="flex flex-row">
    <div class="my-2 w-[500px]">
      <el-form :model="article" label-width="120px">
        <el-form-item label="Article">
          <el-input v-model="article.title" />
        </el-form-item>
        <el-form-item label="Short Link">
          <el-input v-model="article.shortLink" />
        </el-form-item>
        <el-form-item label="Description">
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

            action="https://img-upload.violetzzs.workers.dev/"
            multiple drag
            method="PUT"
            :show-file-list="true"
            :on-success="handleAvatarSuccess"
          >
            <img v-if="imageUrl" :src="imageUrl" class="avatar">
            <el-icon v-else class="avatar-uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
