import { convert } from 'html-to-text'

export const htmlToTextForDescription = (html: string) => {
  return convert(html, {
    limits: {
      maxInputLength: 300
    }
  })
}
