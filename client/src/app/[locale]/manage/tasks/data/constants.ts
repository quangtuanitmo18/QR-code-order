import { AlertCircle, CheckCircle2, Circle, Clock, ListTodo } from 'lucide-react'

export const statuses = [
  {
    value: 'todo',
    label: 'Todo',
    icon: ListTodo,
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: Clock,
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: AlertCircle,
  },
]

export const categories = [
  {
    value: 'Feature',
    label: 'Feature',
  },
  {
    value: 'Bug',
    label: 'Bug',
  },
  {
    value: 'Docs',
    label: 'Docs',
  },
  {
    value: 'Improvement',
    label: 'Improvement',
  },
  {
    value: 'Refactor',
    label: 'Refactor',
  },
]

export const priorities = [
  {
    value: 'Critical',
    label: 'Critical',
    icon: AlertCircle,
  },
  {
    value: 'Important',
    label: 'Important',
    icon: Circle,
  },
  {
    value: 'Normal',
    label: 'Normal',
    icon: Circle,
  },
  {
    value: 'Minor',
    label: 'Minor',
    icon: Circle,
  },
]
