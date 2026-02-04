'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGetTaskByIdQuery } from '@/queries/useTask'
import { TaskType } from '@/schemaValidations/task.schema'
import { useState } from 'react'
import { TaskAttachments } from './components/task-attachments'
import { TaskComments } from './components/task-comments'
import { TaskForm } from './components/task-form'
import { TaskStatistics } from './components/task-statistics'
import { TaskTable } from './components/task-table'

export default function TasksClient() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [isViewingTask, setIsViewingTask] = useState(false)
  const [viewingTaskId, setViewingTaskId] = useState<number | null>(null)

  // Fetch full task data when editing
  const { data: taskData } = useGetTaskByIdQuery({
    id: editingTaskId || 0,
    enabled: editingTaskId !== null && isFormOpen,
  })

  // Fetch full task data when viewing
  const { data: viewingTaskData } = useGetTaskByIdQuery({
    id: viewingTaskId || 0,
    enabled: viewingTaskId !== null && isViewingTask,
  })

  const editingTask = taskData?.payload.data || null
  const viewingTask = viewingTaskData?.payload.data || null

  const handleNewTask = () => {
    setEditingTaskId(null)
    setIsFormOpen(true)
  }

  const handleEditTask = (task: TaskType) => {
    setEditingTaskId(task.id)
    setIsFormOpen(true)
  }

  const handleViewTask = (task: TaskType) => {
    setViewingTaskId(task.id)
    setIsViewingTask(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingTaskId(null)
  }

  const handleCloseView = () => {
    setIsViewingTask(false)
    setViewingTaskId(null)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Cards - Show total counts without filters */}
        <TaskStatistics />

        {/* Task Table with Filters */}
        <TaskTable
          onNewTask={handleNewTask}
          onEditTask={handleEditTask}
          onViewTask={handleViewTask}
        />
      </div>

      {/* Edit/Create Task Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTaskId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {editingTaskId
                ? 'Update task details'
                : 'Create a new task and assign it to a team member'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm task={editingTask} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>

      {/* View Task Dialog with Comments & Attachments */}
      <Dialog open={isViewingTask} onOpenChange={handleCloseView}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingTask?.title || 'Task Details'}</DialogTitle>
            <DialogDescription>View task details, comments, and attachments</DialogDescription>
          </DialogHeader>
          {viewingTask && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {viewingTask.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="mb-2 font-semibold">Status</h3>
                      <p className="text-sm">{viewingTask.status}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">Category</h3>
                      <p className="text-sm">{viewingTask.category}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">Priority</h3>
                      <p className="text-sm">{viewingTask.priority}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">Assigned To</h3>
                      <p className="text-sm">{viewingTask.assignedTo?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        handleCloseView()
                        handleEditTask(viewingTask)
                      }}
                      variant="outline"
                    >
                      Edit Task
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="comments">
                <TaskComments taskId={viewingTask.id} />
              </TabsContent>
              <TabsContent value="attachments">
                <TaskAttachments taskId={viewingTask.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
