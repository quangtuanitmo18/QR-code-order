'use client'

import MarkdownEditor from '@/components/blog/markdown-editor'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUploadMediaMutation } from '@/queries/useMedia'
import { CreateBlogPostBody, CreateBlogPostBodyType } from '@/schemaValidations/blog-post.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import slugify from 'slugify'

interface BlogFormProps {
  defaultValues?: Partial<CreateBlogPostBodyType>
  onSubmit: (values: CreateBlogPostBodyType) => Promise<void>
  isLoading?: boolean
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  })
}

export default function BlogForm({ defaultValues, onSubmit, isLoading }: BlogFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true)
  const [tags, setTags] = useState<string[]>(defaultValues?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const uploadMediaMutation = useUploadMediaMutation()

  const form = useForm<CreateBlogPostBodyType>({
    resolver: zodResolver(CreateBlogPostBody),
    defaultValues: {
      title: defaultValues?.title || '',
      slug: defaultValues?.slug || '',
      excerpt: defaultValues?.excerpt || '',
      content: defaultValues?.content || '',
      featuredImage: defaultValues?.featuredImage || undefined,
      status: defaultValues?.status || 'DRAFT',
      featured: defaultValues?.featured || false,
      category: defaultValues?.category || '',
      tags: defaultValues?.tags || [],
    },
  })

  const title = form.watch('title')
  const slug = form.watch('slug')
  const featuredImage = form.watch('featuredImage')

  // Auto-generate slug from title
  useEffect(() => {
    if (autoGenerateSlug && title) {
      const newSlug = generateSlug(title)
      form.setValue('slug', newSlug, { shouldValidate: false })
    }
  }, [title, autoGenerateSlug, form])

  // Sync tags with form
  useEffect(() => {
    form.setValue('tags', tags, { shouldValidate: true })
  }, [tags, form])

  const previewImage = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    }
    return featuredImage
  }, [file, featuredImage])

  const handleSubmit = async (values: CreateBlogPostBodyType) => {
    try {
      let body = { ...values, tags }

      // Upload image if file selected
      if (file) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          const uploadResult = await uploadMediaMutation.mutateAsync(formData)
          body = {
            ...body,
            featuredImage: uploadResult.payload.data,
          }
        } catch (uploadError) {
          // If image upload fails, throw a more descriptive error
          throw new Error(
            'Failed to upload image. Please try again or remove the image and save without it.'
          )
        }
      }

      await onSubmit(body)
    } catch (error) {
      // Error handling is done in parent component
      throw error
    }
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10 && trimmed.length <= 30) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        className="grid auto-rows-max items-start gap-6"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter blog post title..." {...field} />
              </FormControl>
              <FormDescription>Minimum 10 characters, maximum 200 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Slug */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel className="flex-1">Slug *</FormLabel>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auto-slug"
                    checked={autoGenerateSlug}
                    onCheckedChange={(checked) => setAutoGenerateSlug(checked as boolean)}
                  />
                  <Label htmlFor="auto-slug" className="text-sm font-normal">
                    Auto-generate from title
                  </Label>
                </div>
              </div>
              <FormControl>
                <Input
                  placeholder="blog-post-slug"
                  {...field}
                  disabled={autoGenerateSlug}
                  pattern="^[a-z0-9-]+$"
                />
              </FormControl>
              <FormDescription>
                URL-friendly slug (lowercase, hyphens only, no special characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Excerpt */}
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the blog post (auto-generated if empty)..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional. If empty, will be auto-generated from content (max 500 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content *</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write your blog post content in Markdown..."
                  height={600}
                />
              </FormControl>
              <FormDescription>Minimum 100 characters. Use Markdown format.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Featured Image */}
        <FormField
          control={form.control}
          name="featuredImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Featured Image</FormLabel>
              <div className="flex items-start gap-4">
                <Avatar className="aspect-video h-[120px] w-[200px] rounded-md object-cover">
                  <AvatarImage src={previewImage || ''} />
                  <AvatarFallback className="rounded-none">No Image</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFile(file)
                        field.onChange(URL.createObjectURL(file))
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                  {previewImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null)
                        field.onChange(undefined)
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <FormDescription>Optional but recommended. JPG, PNG, or WebP format.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status and Featured */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Featured Post</FormLabel>
                  <FormDescription>
                    Featured posts appear at the top of the blog list
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Technology, Food, Travel..." {...field} />
              </FormControl>
              <FormDescription>
                Optional. Free-form category name (max 50 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormItem>
          <FormLabel>Tags</FormLabel>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                maxLength={30}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <FormDescription>Maximum 10 tags, each tag maximum 30 characters</FormDescription>
          </div>
        </FormItem>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
