import jwt from 'jsonwebtoken'
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN, System_REFRESH_TOKEN_SECRET_KEY, System_TOKEN_SECRET_KEY, User_REFRESH_TOKEN_SECRET_KEY, User_TOKEN_SECRET_KEY } from '../../../../config/config.service.js'
import { RoleEnum } from '../../enums/user.enum.js'
import { AudienceEnum, TokecTypeEnum } from '../../enums/security.enums.js'
import { BadRequestException, NotFoundException, UnauthorizedException } from '../response/error.respponse.js'
import { findOne } from '../../../DB/database.repository.js'
import { tokenModel, UserModel } from '../../../DB/index.js'
import {randomUUID} from 'node:crypto'
import { get, revokeTokenKey } from '../../services/index.js'

export const generatToken = async ({
    payload = {},
    secret = User_TOKEN_SECRET_KEY,
    options = {}
} = {}) => {
    return jwt.sign(payload, secret, options)
}

export const verifytToken = async ({
    token,
    secret = User_TOKEN_SECRET_KEY,
} = {}) => {
    return jwt.verify(token, secret)
}

export const getTokenSignature = async (role) => {
    let accessSignatuer = undefined;
    let refreshSignatuer = undefined;
    let audience = AudienceEnum.User;
    switch (role) {
        case RoleEnum.Admin:
            accessSignatuer = System_TOKEN_SECRET_KEY
            refreshSignatuer = System_REFRESH_TOKEN_SECRET_KEY
            audience = AudienceEnum.System
            break;
        default:
            accessSignatuer = User_TOKEN_SECRET_KEY
            refreshSignatuer = User_REFRESH_TOKEN_SECRET_KEY
            audience = AudienceEnum.User
            break;
    }
    return { accessSignatuer, refreshSignatuer, audience }
}

export const getSignatureLevel = async (audienceType) => {
    let signatuerLevel
    switch (audienceType) {
        case AudienceEnum.System:
            signatuerLevel = RoleEnum.Admin
            break;
        default:
            signatuerLevel = RoleEnum.User
            break;
    }
    return signatuerLevel
}

export const createLoginCredentials = async (uesr, issuer) => {
    const { accessSignatuer, refreshSignatuer, audience } = await getTokenSignature(user.role)
const jwtid = randomUUID()
    const access_token = await generatToken({
        payload: { sub: user._id },
        secret: accessSignatuer,
        options: {
            issuer,
            audience: [TokecTypeEnum.access, audience],
            expiresIn: ACCESS_EXPIRES_IN,
            jwtid
        }

    })
    const refresh_token = await generatToken({
        payload: { sub: user._id },
        secret: refreshSignatuer,
        options: {
            issuer,
            audience: [TokecTypeEnum.refresh, audience],
            expiresIn: REFRESH_EXPIRES_IN,
            jwtid
        }

    })
    return { access_token, refresh_token }
}

export const decodeToken = async ({ token, tokenType = TokecTypeEnum.access }) => {
    const decode = jwt.decode(token)
    if (!decode?.aud?.length) {
        throw BadRequestException({ message: "Fail to decoded this token aud is required" })
    }
    const [decodeTokenType, audienceType] = decode.aud
    if (decodeTokenType !== tokenType) {
        throw BadRequestException({
            message:
                `Invalid Token Type Token of Type ${decodeTokenType}
            can not access this api while we expected token of type ${tokenType} `
        })
    }
    if (decode.jit && await get(revokeTokenKey({userID:decode.sub,jti:decode.jti}))) {
        throw UnauthorizedException({ message: "Invalid login session" })
        
    }
    const signatuerLevel = await getSignatureLevel(audienceType)

    const { accessSignatuer, refreshSignatuer } = await getTokenSignature(signatuerLevel)

    const verifyData = await verifytToken({
        token,
        secret: tokenType == TokecTypeEnum.refresh ? refreshSignatuer : accessSignatuer
    })

    const uesr = await findOne({ model: UserModel, filter: { _id: verifyData.sub } })
    if (!user) {
        throw UnauthorizedException({ message: "Not Register account" })
    }
    if (user.changeCredentialsTime && uesr.changeCredentialsTime?.getTme() >= decode.iat * 1000) {
        throw UnauthorizedException({ message: "Invalid login session" })
    }

    return {uesr,decode}
}