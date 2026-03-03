import { DishStatus } from '@/constants/type'
import { http, HttpResponse } from 'msw'

const BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:4000'

export const dishHandlers = [
  // GET /api/dishes — list all dishes (public)
  http.get(`${BASE_URL}/api/dishes`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          name: 'Phở Bò Tái',
          price: 85000,
          description: 'Beef pho with rare steak',
          image: 'https://via.placeholder.com/200',
          status: DishStatus.Available,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Bún Bò Huế',
          price: 75000,
          description: 'Hue-style spicy beef noodle soup',
          image: 'https://via.placeholder.com/200',
          status: DishStatus.Available,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      message: 'Dishes retrieved successfully',
    })
  }),

  // GET /api/dishes/:id — get single dish
  http.get(`${BASE_URL}/api/dishes/:id`, ({ params }) => {
    return HttpResponse.json({
      data: {
        id: Number(params.id),
        name: 'Phở Bò Tái',
        price: 85000,
        description: 'Beef pho with rare steak',
        image: 'https://via.placeholder.com/200',
        status: DishStatus.Available,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: 'Dish retrieved successfully',
    })
  }),

  // POST /api/admin/dishes — create new dish (admin only)
  http.post(`${BASE_URL}/api/admin/dishes`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json(
      {
        data: {
          id: 99,
          ...body,
          status: DishStatus.Available,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        message: 'Dish created successfully',
      },
      { status: 201 }
    )
  }),
]
