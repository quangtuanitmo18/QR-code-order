import { Role } from '@/constants/type'
import {
  Calendar,
  FileText,
  Home,
  MessageSquareText,
  Salad,
  ShoppingCart,
  Table,
  Ticket,
  Users2,
  Gift,
  Sparkles,
  CircleDot,
} from 'lucide-react'

const menuItems = [
  {
    title: 'Dashboard',
    Icon: Home,
    href: '/manage/dashboard',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'Orders',
    Icon: ShoppingCart,
    href: '/manage/orders',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'Tables',
    Icon: Table,
    href: '/manage/tables',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'Dishes',
    Icon: Salad,
    href: '/manage/dishes',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'Reviews',
    Icon: MessageSquareText,
    href: '/manage/reviews',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'Calendar',
    Icon: Calendar,
    href: '/manage/calendar',
    roles: [Role.Owner, Role.Employee],
  },
  {
    title: 'Blogs',
    Icon: FileText,
    href: '/manage/blogs',
    roles: [Role.Owner],
  },
  {
    title: 'Coupons',
    Icon: Ticket,
    href: '/manage/coupons',
    roles: [Role.Owner],
  },
  {
    title: 'Employees',
    Icon: Users2,
    href: '/manage/accounts',
    roles: [Role.Owner],
  },
  {
    title: 'Spin Events',
    Icon: Sparkles,
    href: '/manage/spin-events',
    roles: [Role.Owner],
  },
  {
    title: 'Spin Rewards',
    Icon: Gift,
    href: '/manage/spin-rewards',
    roles: [Role.Owner],
  },
  {
    title: 'Employee Spin',
    Icon: CircleDot,
    href: '/manage/employee-spin',
    roles: [Role.Employee],
  },
]

export default menuItems
