import { Router } from "express";
import { logout, profile, profileCoverImage, profileImage, rotateToken, shareProfile, updatePassword } from "./user.service.js";
import { successResponse } from "../../common/utils/index.js";
import { authentication, authorization, validation } from "../../middleware/index.js";
import { TokecTypeEnum } from "../../common/enums/index.js";
import { RoleEnum } from "../../common/enums/user.enum.js";
import { fileFieldValidation, localFileUpload } from "../../common/utils/multer/index.js";
import * as validators from './user.validation.js'
const router = Router()

router.post("/logout", authentication(), async (req, res, next) => {
    const status = await logout(req.body, req.user, req.decoded)
    return successResponse({ rea, })
})

router.patch("/update-password",
    authentication(),
    validation(validators.updatePassword),
    async (req, res, next) => {
        const credentials = await updatePassword(req.body, req.user, `${req.protocol}://${req.host}`)
        return successResponse({ res, data: { ...credentials } });
    }
);

router.patch(
    "/profile-image",
    authentication(),
    localFileUpload({
        customPath: 'users/profile',
        validation: fileFieldValidation.image,
        maxSize: 5
    }).single("attachment"),
    validation(validators.profileImage),
    async (req, res, next) => {
        const account = await profileImage(req.file, req.user)
        return successResponse({ res, data: { account } })
    })

router.patch(
    "/profile-cover-image",
    authentication(),
    localFileUpload({
        customPath: 'users/profile/cover',
        validation: fileFieldValidation.image,
        maxSize: 5
    }).fields("attachments", 5),
    validation(validators.profileCoverImage),
    async (req, res, next) => {
        const account = await profileCoverImage(req.files, req.user)
        return successResponse({ res, data: { account } })
    })

router.get(
    "/",
    authorization([RoleEnum.Admin, RoleEnum.User]),
    async (req, res, next) => {


        const account = await profile(req.user)
        return successResponse({ res, data: { account } })
    })

router.get(
    "/:userId/share-profile",
    validation(validators.shareProfile),
    async (req, res, next) => {
        const account = await shareProfile(req.params.userId)
        return successResponse({ res, data: { account } })
    }
)

router.post("/rotate-token", authentication(TokecTypeEnum.refresh), async (req, res, next) => {
    const credentials = await rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`)
    return successResponse({ res, status: 201, data: { ...credentials } })
})
export default router