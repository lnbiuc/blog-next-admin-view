<script setup lang="ts" generic="T extends any, O extends any">
import 'md-editor-v3/lib/style.css'
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { login } from '~/axios/user'

defineOptions({
  name: 'IndexPage',
})

const ruleFormRef = ref<FormInstance>()

const ruleForm = reactive({
  account: '',
  password: '',
})

function validateAccount(rule: any, value: any, callback: any) {
  if (value === '')
    callback(new Error('Please input the account'))

  else
    callback()
}
function validatePassword(rule: any, value: any, callback: any) {
  if (value === '')
    callback(new Error('Please input the password'))

  else
    callback()
}

const rules = reactive<FormRules<typeof ruleForm>>({
  account: [{ validator: validateAccount, trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }],
})

const router = useRouter()

function submitForm(formEl: FormInstance | undefined) {
  if (!formEl)
    return
  formEl.validate((valid) => {
    if (valid) {
      login(ruleForm).then((res) => {
        if (res.data.code === 200) {
          ElMessage.success('Login success')
          useLocalStorage('token', res.headers.authorization)
          useLocalStorage('user', JSON.stringify(res.data.data))
          setTimeout(() => {
            router.push('/publish')
          }, 500)
        }
        else {
          ElMessage.error(res.data.msg)
        }
      })
    }
    else {
      ElMessage.error('Please input the account and password')
      return false
    }
  })
}

router.beforeEach((to, from, next) => {
  if (to.path !== '/login') {
    if (localStorage.getItem('token') && localStorage.getItem('user'))
      next()

    else
      next('/login')
  }
  else { next() }
})
</script>

<template>
  <div class="m-auto h-full w-full flex flex-col items-center justify-center text-center">
    <div class="my-auto w-[200px]">
      <el-form
        ref="ruleFormRef"
        class=""
        :model="ruleForm"
        status-icon
        :rules="rules"
        label-width="120px"
        label-position="top"
      >
        <el-form-item label="Account" prop="account">
          <el-input v-model="ruleForm.account" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input
            v-model="ruleForm.password"
            type="password"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item>
          <el-button bg text class="mt-4 w-full" type="primary" @click="submitForm(ruleFormRef)">
            login
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
