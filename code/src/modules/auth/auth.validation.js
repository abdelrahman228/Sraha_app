import joi from 'joi'
import { generalValidationFields } from '../../common/utils/validation.js'

export const login = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
        password: generalValidationFields.password.required(),
    }).required()
}

export const signup = {
    body: login.body.append().keys({
        username: generalValidationFields.username.messages({
            "any.required": "username is required",
            "string.empty": "username cannot be empty"
        }),
        phone: generalValidationFields.phone.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required()
    }).required(),
}

export const reSendConfirmEmailc = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
    }).required(),
}

export const confirmEmail = {
    body: reSendConfirmEmailc.body.append({
        otp: generalValidationFields.otp.required(),
    }).required(),
}

export const resetForgotPasswordCode = {
    body: confirmEmail.body.append({
        Password: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required()
    }).required(),
}
/*********************************** */
export const requestEnable2fa = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
    }).required()
}

export const verifyEnable2fa = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
        otp: generalValidationFields.otp.required()
    }).required()
}

export const confirmLogin = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
        otp: generalValidationFields.otp.required()
    }).required()
}



/******************* */