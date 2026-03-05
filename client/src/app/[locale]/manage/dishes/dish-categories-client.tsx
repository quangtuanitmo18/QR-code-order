'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
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
    TableRow
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { handleErrorApi } from '@/lib/utils'
import {
    useCreateDishCategoryMutation,
    useDeleteDishCategoryMutation,
    useDishCategoryListQuery,
    useUpdateDishCategoryMutation
} from '@/queries/useDishCategory'
import {
    CreateDishCategoryBody,
    CreateDishCategoryBodyType,
    DishCategoryType
} from '@/schemaValidations/dish-category.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

function CategoryForm({
  category,
  onSuccess,
  onCancel
}: {
  category?: DishCategoryType | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const createMutation = useCreateDishCategoryMutation()
  const updateMutation = useUpdateDishCategoryMutation()

  const form = useForm<CreateDishCategoryBodyType>({
    resolver: zodResolver(CreateDishCategoryBody),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? ''
    }
  })

  const onSubmit = async (values: CreateDishCategoryBodyType) => {
    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, ...values })
        toast({ description: 'Category updated successfully' })
      } else {
        await createMutation.mutateAsync(values)
        toast({ description: 'Category created successfully' })
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
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" placeholder="e.g. Main Course" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="cat-desc">Description (optional)</Label>
              <Textarea id="cat-desc" placeholder="Brief description..." {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {category ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function DishCategoriesClient() {
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
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return
    try {
      await deleteMutation.mutateAsync(id)
      toast({ description: `Category "${name}" deleted` })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        <Button size="sm" onClick={handleNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No categories yet. Add one to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSuccess={handleClose}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
