import envConfig from '@/config'
import { TokenType } from '@/constants/type'
import { TokenPayload } from '@/types/jwt.types'
import { PrivateKey, SignerOptions, createSigner, createVerifier } from 'fast-jwt'
import ms from 'ms'

export const signAccessToken = (
  payload: Pick<TokenPayload, 'userId' | 'role'> & {
    exp?: number
  },
  options?: SignerOptions
) => {
  const { exp } = payload
  const optionSigner: Partial<SignerOptions & { key: string | Buffer | PrivateKey }> = exp
    ? {
        key: envConfig.ACCESS_TOKEN_SECRET,
        algorithm: 'HS256',
        ...options
      }
    : {
        key: envConfig.ACCESS_TOKEN_SECRET,
        algorithm: 'HS256',
        expiresIn: ms(envConfig.ACCESS_TOKEN_EXPIRES_IN),
        ...options
      }
  const signSync = createSigner(optionSigner)
  return signSync({ ...payload, tokenType: TokenType.AccessToken })
}

export const signRefreshToken = (
  payload: Pick<TokenPayload, 'userId' | 'role'> & {
    exp?: number
  },
  options?: SignerOptions
) => {
  const { exp } = payload
  const optionSigner: Partial<SignerOptions & { key: string | Buffer | PrivateKey }> = exp
    ? {
        key: envConfig.REFRESH_TOKEN_SECRET,
        algorithm: 'HS256',
        ...options
      }
    : {
        key: envConfig.REFRESH_TOKEN_SECRET,
        algorithm: 'HS256',
        expiresIn: ms(envConfig.REFRESH_TOKEN_EXPIRES_IN),
        ...options
      }
  const signSync = createSigner(optionSigner)
  return signSync({ ...payload, tokenType: TokenType.RefreshToken })
}

export const verifyAccessToken = (token: string) => {
  const verifySync = createVerifier({
    key: envConfig.ACCESS_TOKEN_SECRET
  })
  return verifySync(token) as TokenPayload
}

export const verifyRefreshToken = (token: string) => {
  const verifySync = createVerifier({
    key: envConfig.REFRESH_TOKEN_SECRET
  })
  return verifySync(token) as TokenPayload
}
