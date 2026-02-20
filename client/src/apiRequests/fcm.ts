import http from '@/lib/http';

const fcmApiRequest = {
  registerToken: (body: { token: string; deviceType?: string }) => 
    http.post('/notifications/register-token', body),
  
  unregisterToken: (body: { token: string }) => 
    http.delete('/notifications/unregister-token', body)
}

export default fcmApiRequest
