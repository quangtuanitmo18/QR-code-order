import z from 'zod'

export const RegisterFcmTokenBody = z
  .object({
    token: z.string(),
    deviceType: z.string().optional()
  })
  .strict()

export type RegisterFcmTokenBodyType = z.TypeOf<typeof RegisterFcmTokenBody>

export const UnregisterFcmTokenBody = z
  .object({
    token: z.string()
  })
  .strict()

export type UnregisterFcmTokenBodyType = z.TypeOf<typeof UnregisterFcmTokenBody>
