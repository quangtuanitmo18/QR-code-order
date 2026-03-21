'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import {
  useCreateDishCategoryMutation,
  useDeleteDishCategoryMutation,
  useDishCategoryListQuery,
  useUpdateDishCategoryMutation,
} from '@/queries/useDishCategory'
import {
  CreateDishCategoryBody,
  CreateDishCategoryBodyType,
  DishCategoryType,
} from '@/schemaValidations/dish-category.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useTranslations } from 'next-intl'

function CategoryForm({
  category,
  onSuccess,
  onCancel,
  t,
}: {
  category?: DishCategoryType | null
  onSuccess: () => void
  onCancel: () => void
  t: any
}) {
  const createMutation = useCreateDishCategoryMutation()
  const updateMutation = useUpdateDishCategoryMutation()

  const form = useForm<CreateDishCategoryBodyType>({
    resolver: zodResolver(CreateDishCategoryBody),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
  })

  const onSubmit = async (values: CreateDishCategoryBodyType) => {
    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, ...values })
        toast({ description: t('updateCategorySuccess') })
      } else {
        await createMutation.mutateAsync(values)
        toast({ description: t('createCategorySuccess') })
      }
      onSuccess()
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="cat-name">{t('categoryName')}</Label>
              <Input id="cat-name" placeholder={t('categoryNamePlaceholder')} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="cat-desc">{t('categoryDescription')}</Label>
              <Textarea id="cat-desc" placeholder={t('categoryDescriptionPlaceholder')} {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {category ? t('saveChanges') : t('create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function DishCategoriesClient() {
  const t = useTranslations('Dishes')
  const { data, isLoading } = useDishCategoryListQuery()
  const deleteMutation = useDeleteDishCategoryMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<DishCategoryType | null>(null)

  const categories = data?.payload.data ?? []

  const handleNew = () => {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  const handleEdit = (category: DishCategoryType) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingCategory(null)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(t('deleteCategoryConfirm', { name }))) return
    try {
      await deleteMutation.mutateAsync(id)
      toast({ description: t('deleteCategorySuccess', { name }) })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <p className="text-sm text-muted-foreground">{t('categoriesCount', { count: categories.length })}</p>
        <Button size="sm" onClick={handleNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addCategory')}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">{t('loading')}</div>
      ) : categories.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t('noCategories')}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('categoryName')}</TableHead>
              <TableHead>{t('categoryDescription')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.description ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('editCategory') : t('newCategory')}</DialogTitle>
          </DialogHeader>
          <CategoryForm category={editingCategory} onSuccess={handleClose} onCancel={handleClose} t={t} />
        </DialogContent>
      </Dialog>
    </>
  )
}
