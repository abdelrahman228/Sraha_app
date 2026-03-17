import { Router } from "express";
import { BadRequestException, decodeToken, fileFieldValidation,  localFileUpload, successResponse, TokecTypeEnum } from "../../common/index.js";
import { deleteMessage, getMessage, getMessages, sendMessage } from "./message.service.js";
import { validation ,authentication} from "../../middleware/index.js";
import * as validators from './message.validation.js'


const router = Router()

router.post(
    "/:receiverId",
    async (req, res, next) => {
        if (req.headers.authorization) {
            try {
                const { user, decode } = await decodeToken({ token: req.headers.authorization.split(" ")[1], tokenType: TokecTypeEnum.access })
                req.user = user
                req.decode = decode
            } catch (error) {
                // Ignore invalid tokens for optional auth
            }
        }
        next()
    },
    localFileUpload({ validation: fileFieldValidation.image, customPath: "Massages", maxSize: 1 }).array("attachments", 2),
    validation(validators.sendMessage),
    async (req, res, next) => {
        if (!req.body?.content && !req.files?.length) {
            throw new BadRequestException({ message: "validation error", extra: { key: "body", path: ["content"], message: "missing content" } })
        }
        
        const message = await sendMessage(req.params.receiverId, req.body, req.files, req.user)
        return successResponse({ res, status: 201, data: { message } })
    })

router.get(
    "/list",
    authentication(),
    async (req, res, next) => {

        const messages = await getMessages(req.user)
        return successResponse({ res, status: 200, data: { messages } })
    })

router.get(
    "/:messageId",
    authentication(),
    validation(validators.getMessage),
    async (req, res, next) => {

        const message = await getMessage(req.params.messageId, req.user)
        return successResponse({ res, status: 200, data: { message } })
    })

router.delete(
    "/:messageId",
    authentication(),
    validation(validators.getMessage),
    async (req, res, next) => {

        const message = await deleteMessage (req.params.messageId, req.user)
        return successResponse({ res, status: 200, data: { message } })
    })

export default router