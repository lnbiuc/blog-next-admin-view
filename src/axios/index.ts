import axios from 'axios'

const apiAxios = axios.create({
  withCredentials: true,
  timeout: 10000,
})

// 前置拦截
apiAxios.interceptors.request.use((config) => {
  return config
})

// 后置拦截
apiAxios.interceptors.response.use(
  (response) => {
    if (response.data.code === 200) {
      return response
    }
    else {
      // show when dev
    }
    return response
  },
)

export default apiAxios
