/**
 * Entity Dictionaries — static arrays for rule-based entity extraction.
 * Matched against Dish model fields: tags, ingredients, allergens.
 *
 * Keep these small and domain-specific. Expand from search logs in V2.
 */

/** Taste keywords → matched against Dish.tags */
export const tasteDictionary: string[] = [
  'cay',
  'ngọt',
  'chua',
  'mặn',
  'béo',
  'đắng',
  'thanh',
  'nồng',
  'spicy',
  'sweet',
  'sour',
  'salty',
  'savory',
  'bitter',
  'mild',
  'hot'
]

/** Ingredient keywords → matched against Dish.ingredients */
export const ingredientDictionary: string[] = [
  'bò',
  'gà',
  'heo',
  'tôm',
  'cá',
  'mực',
  'trứng',
  'rau',
  'nấm',
  'phô mai',
  'bơ',
  'kem',
  'chocolate',
  'beef',
  'chicken',
  'pork',
  'shrimp',
  'fish',
  'egg',
  'cheese',
  'mushroom',
  'tofu',
  'đậu hũ'
]

/** Allergen-related phrases → matched against Dish.allergens for exclusion */
export const allergenPhrases: string[] = [
  'đậu phộng',
  'lạc',
  'gluten',
  'sữa bò',
  'hải sản',
  'trứng',
  'đậu nành',
  'hạt cây',
  'peanut',
  'shellfish',
  'dairy',
  'soy',
  'tree nut',
  'wheat'
]

/** Allergen exclusion patterns — phrases that signal "exclude this allergen" */
export const allergenExclusionPatterns: string[] = ['không ', 'no ', 'free ', 'without ', 'trừ ', 'bỏ ']
