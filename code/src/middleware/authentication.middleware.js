import { TokecTypeEnum } from "../common/enums/security.enums.js"
import { BadRequestException, decodeToken, ForbiddenException } from "../common/utils/index.js"



export const authentication = (tokenType = TokecTypeEnum.access) => {
    return async (req, res, next) => {
        if (!req?.headers?.authorization) {
            throw BadRequestException({ message: "Missing athorization key" })
        }
        const { authorization } = req.headers
        const [flag, credential] = authorization.split(" ")
        if (!flag||!credential) {
            throw BadRequestException({ message: "Missing athorization parts" })
            
        }
        switch (flag) {
            case 'Basic':
                const data = Buffer.from(credential, 'base64').toString()
                const [username, password] = data.split(":")
                break;
            case 'Bearer':
                const {uesr,decode} = await decodeToken({ token: credential, tokenType })
                req.uesr=uesr
                req.decode=decode
                break;
            default:
                break;
        }
        next()
    }
}

export const authorization = (accessRoles = [], tokenType = TokecTypeEnum.access) => {
    return async (req, res, next) => {
      
        if (!accessRoles.includes(req, user.role)) {
            throw ForbiddenException({ message: "Not allowed account" })
        }
        next()
    }
}