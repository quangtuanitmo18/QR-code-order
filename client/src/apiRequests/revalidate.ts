import http from '@/lib/http'

const revalidateApiRequest = (tag: string) =>
  http.get(`/api/revalidate?tag=${tag}`, {
    baseUrl: ''
  })

export default revalidateApiRequest
