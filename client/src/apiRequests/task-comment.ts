import http from '@/lib/http'
import {
  CreateCommentBodyType,
  CreateCommentResType,
  DeleteCommentResType,
  GetCommentsResType,
  UpdateCommentBodyType,
  UpdateCommentResType,
} from '@/schemaValidations/task-comment.schema'

export const taskCommentApiRequest = {
  getComments: (taskId: number) => http.get<GetCommentsResType>(`/tasks/${taskId}/comments`),

  createComment: (taskId: number, body: CreateCommentBodyType) =>
    http.post<CreateCommentResType>(`/tasks/${taskId}/comments`, body),

  updateComment: (id: number, body: UpdateCommentBodyType) =>
    http.put<UpdateCommentResType>(`/tasks/comments/${id}`, body),

  deleteComment: (id: number) => http.delete<DeleteCommentResType>(`/tasks/comments/${id}`),
}

export default taskCommentApiRequest
