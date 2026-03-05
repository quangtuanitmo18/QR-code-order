import { DishStatus } from '@/constants/type'

export const mockDish = {
  id: 1,
  name: 'Phở Bò Tái',
  price: 85000,
  description: 'Phở bò tái thơm ngon, nước dùng đậm đà',
  image: 'https://via.placeholder.com/200',
  category: 'Main Course',
  status: DishStatus.Available,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const mockDishUnavailable = {
  id: 2,
  name: 'Bún Bò Huế',
  price: 75000,
  description: 'Bún bò Huế đặc biệt',
  image: 'https://via.placeholder.com/200',
  category: 'Main Course',
  status: DishStatus.Unavailable,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const mockDishList = [mockDish, mockDishUnavailable]
