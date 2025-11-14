import { Role } from '@/constants/type'
import { Home, MessageSquareText, Salad, ShoppingCart, Table, Users2 } from 'lucide-react'

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
    title: 'Employees',
    Icon: Users2,
    href: '/manage/accounts',
    roles: [Role.Owner],
  },
]

export default menuItems
