import { resolve } from 'node:path'
import { config } from 'dotenv'

export const NODE_ENV = process.env.NODE_ENV

const envPath = {
    development: `.env.development`,
    production: `.env.production`,
}
console.log({ en: envPath[NODE_ENV] });


config({ path: resolve(`./config/${envPath[NODE_ENV]}`) })


export const port = process.env.PORT ?? 7000

export const EMAIL_APP_PASSWORD =process.env.EMAIL_APP_PASSWORD
export const EMAIL_APP =process.env.EMAIL_APP
export const APPLICATION_NAME=process.env.APPLICATION_NAME

export const FACEBOOK_INK =process.env.FACEBOOK_INK
export const INSTEGRAM_LINK =process.env.INSTEGRAM_LINK
export const TWITTER_LINK =process.env.TWITTER_LINK

export const DB_URI = process.env.DB_URI
export const REDIS_URI =process.env.REDIS_URI

export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? '10')
export const ENC_TV_LENGTH = parseInt(process.env.ENC_TV_LENGTH ?? '16')
export const ENC_BYTE =Buffer.from(process.env.ENC_BYTE)

export const User_TOKEN_SECRET_KEY = process.env.User_TOKEN_SECRET_KEY
export const User_REFRESH_TOKEN_SECRET_KEY = process.env.User_REFRESH_TOKEN_SECRET_KEY

export const System_TOKEN_SECRET_KEY = process.env.System_TOKEN_SECRET_KEY
export const System_REFRESH_TOKEN_SECRET_KEY = process.env.System_REFRESH_TOKEN_SECRET_KEY

export const ACCESS_EXPIRES_IN=parseInt(process.env.ACCESS_EXPIRES_IN ?? "1800")
export const REFRESH_EXPIRES_IN=parseInt(process.env.REFRESH_EXPIRES_IN ?? "1800")


export const ORIGINS =process.env.ORIGINS?.split(",")||[]
