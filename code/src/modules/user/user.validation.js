import joi from 'joi'
import { generalValidationFields } from '../../common/utils/index.js'
import { fileFieldValidation } from '../../common/utils/index.js'

export const updatePassword = {
    body: joi.object().keys({
        oldPassword: generalValidationFields.password.required(),
        Password: generalValidationFields.password.not("oldPassword").required(),
        confirmNewPassword: generalValidationFields.confirmPassword("password").required()
    }).required()
}

export const shareProfile = {
    params: joi.object().keys({
        userId: generalValidationFields.id.required()
    }).required()
}

export const profileImage = {
    file: generalValidationFields.file(fileFieldValidation.image).required()
}

export const profileCoverImage = {
    file: joi.array().items(
        generalValidationFields.file(fileFieldValidation.image)
    ).min(1).max(5).required()
}

export const profileAttachments = {
    file: joi.object().keys({
        profileImage:
            joi.array().items(
                generalValidationFields.file(fileFieldValidation.image).required()
            ).length(1).required(),
        profileCoverImage:
            joi.array().items(
                generalValidationFields.file(fileFieldValidation.image).required()
            ).min(1).max(5).required()
    }).required()
}
