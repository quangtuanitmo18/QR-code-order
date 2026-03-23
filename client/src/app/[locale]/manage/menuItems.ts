import { Role } from '@/constants/type'
import {
  Calendar,
  CircleDot,
  FileText,
  Home,
  MessageSquareText,
  Salad,
  ShoppingCart,
  Sparkles,
  Table,
  Ticket,
  Users2,
  CheckSquare,
} from 'lucide-react'

const menuItems = [
  {
    title: 'dashboard',
    Icon: Home,
    href: '/manage/dashboard',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'orders',
    Icon: ShoppingCart,
    href: '/manage/orders',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'tables',
    Icon: Table,
    href: '/manage/tables',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'dishes',
    Icon: Salad,
    href: '/manage/dishes',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'reviews',
    Icon: MessageSquareText,
    href: '/manage/reviews',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'calendar',
    Icon: Calendar,
    href: '/manage/calendar',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'tasks',
    Icon: CheckSquare,
    href: '/manage/tasks',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'chat',
    Icon: MessageSquareText,
    href: '/manage/chat',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'blogs',
    Icon: FileText,
    href: '/manage/blogs',
    roles: [Role.Owner],
  },
  {
    title: 'coupons',
    Icon: Ticket,
    href: '/manage/coupons',
    roles: [Role.Owner],
  },
  {
    title: 'employees',
    Icon: Users2,
    href: '/manage/accounts',
    roles: [Role.Owner],
  },
  {
    title: 'spin',
    Icon: Sparkles,
    href: '/manage/spin',
    roles: [Role.Owner],
  },
  {
    title: 'employeeSpin',
    Icon: CircleDot,
    href: '/manage/employee-spin',
    roles: [Role.Employee],
  },
]

export default menuItems
