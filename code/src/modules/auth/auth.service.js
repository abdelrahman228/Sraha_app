import { ProviderEnum, RoleEnum, TokecTypeEnum } from "../../common/enums/index.js";
import { BadRequestException, ConflictException, NotFoundException, compareHash, createLoginCredentials, createNumberOtp, decrypt, emailEmitter, emailTemplate, encrypt, generatToken, generateHash, generateOtp, getTokenSignature, sendEmail, successResponse } from "../../common/utils/index.js";
import { UserModel, findOne, createOne, updateOne, findOneAndUpdate } from "../../DB/index.js";

import { OAuth2Client } from 'google-auth-library';
import { baseRevokeTokenKey, deletKey, get, increment, keys, otpBlockKey, otpKye, otpMaxRequestKye, revokeTokenKey, set, ttl, update } from "../../common/index.js";
import { hashSync } from "bcrypt";

const sendEamilOtp = async ({ email, subject, title } = {}) => {
    //check block condition
    const remainingBlockTime = await ttl(otpBlockKey({ email, subject }))
    if (remainingBlockTime > 0) {
        throw ConflictException({ message: `You have reached max request trail count please try again later after ${remainingBlockTime} seconds` })
    }

    //check max trial count 
    const maxTrialCountkey = otpMaxRequestKye({ email, subject })
    const checMAxOtpRequest = Number(await get(maxTrialCountkey) || 0)

    if (checMAxOtpRequest >= 3) {
        await set({
            key: otpBlockKey({ email, subject }),
            value: 0,
            ttl: 300
        })
        throw ConflictException({ message: "You have reached max request trail count please try again later 300 seconds" })
    }


    const code = await createNumberOtp()

    await set({
        key: otpKye({ email, subject }),
        value: await generateHash({ plainText: `${code}` }),
        ttl: 120
    })
    await sendEmail({
        to: email,
        subject,
        html: emailTemplate({ code, title })
    })
    maxTrialCountkey > 0 ? await increment(maxTrialCountkey) : await set({ key: maxTrialCountkey, value: 1, ttl: 300 })


    emailEmitter.emit("confirm_Email", { to: email, subject: "Confirm_Email", code, title: "Confirm_Email" })
    return;
}

export const signup = async (inputs) => {
    const { username, email, password, phone } = inputs;
    const checkUserExist = await findOne({
        model: UserModel,
        filter: { email }

    });
    if (checkUserExist) {
        return ConflictException({ message: 'Email Exist' })
    }

    const user = await createOne({
        model: UserModel,
        data: [{
            username,
            email,
            password: await generateHash({ plainText: password }),
            phone: await encrypt(phone)
        }]
    })

    await sendEamilOtp({ email, subject: EmailEnum.CONFIRM_EMAIL, title: "Confirm_Email" })

    return user
}

export const confirmEmail = async (inputs) => {
    const { email, otp } = inputs;

    const hashOtp = await get(otpKye({ email, subject: EmailEnum.CONFIRM_EMAIL }))
    if (!hashOtp) {
        throw NotFoundException({ message: 'Expired otp' })
    }

    const account = await findOne({
        model: UserModel,
        filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.System }
    });
    if (!account) {
        return NotFoundException({ message: 'Fail to find matching accont ' })
    }

    if (!await compareHash({ plainText: otp, cipherText: hashOtp })) {
        throw ConflictException({ message: "Invalid otp" })
    }
    account.confirmEmail = new Date();
    await account.save()

    await deletKey(await keys(otpKye(email)))

    return;
}

export const reSendConfirmEmail = async (inputs) => {
    const { email } = inputs;

    const account = await findOne({
        model: UserModel,
        filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.System }
    });
    if (!account) {
        return NotFoundException({ message: 'Fail to find matching accont ' })
    }
    const remainingTime = await ttl(otpKye(email))
    if (remainingTime > 0) {
        throw ConflictException({ message: `Sorre we cannot provide new otp until exits one is expired you can try again later ${remainingTime}s   ` })
    }

    await sendEamilOtp({ email, subject: EmailEnum.CONFIRM_EMAIL, title: "Confirm_Email" })

    return;
}

export const requestForgotPasswordOTP = async (inputs) => {
    const { email } = inputs;

    const account = await findOne({
        model: UserModel,
        filter: {
            email,
            confirmEmail: { $exists: true },
            provider: ProviderEnum.System
        }
    });
    if (!account) {
        return NotFoundException({ message: 'Fail to find matching accont ' })
    }

    await sendEamilOtp({ email, subject: EmailEnum.FORGOT_PASSWORD, title: "reset code" })

    return;
}

export const verifyForgotPasswordOTP = async (inputs) => {
    const { email, otp } = inputs;
    const hashOtp = await get(otpKye({ email, subject: EmailEnum.FORGOT_PASSWORD }))
    if (!hashOtp) {
        throw NotFoundException({ message: 'Expired otp' })
    }
    if (!await compareHash({ plainText: otp, cipherText: hashOtp })) {
        throw ConflictException({ message: "Invalid otp" })
    }

    return;
}

export const resetForgotPasswordOtp = async (inputs) => {
    const { email, otp, password } = inputs;

    await verifyForgotPasswordOTP({ email, otp })
    const user = await findOneAndUpdate({
        model: UserModel,
        filter: {
            email,
            confirmEmail: { $exists: true },
            provider: ProviderEnum.System
        },
        update: {
            password: await generateHash({ plainText: password }),
            changeCredentialsTime: new Date()
        }
    })
    if (!user) {
        throw NotFoundException({ message: 'Account not found' });
    }
    const tokenKeys =await await keys(baseRevokeTokenKey(user._id))
    const otpKeys =await await keys(otpKye({ email, subject: EmailEnum.FORGOT_PASSWORD }))
    await deletKey([...tokenKeys,...otpKeys])
    return;
}


/********************** */
export const requestEnableTwoFactor = async (inputs) => {
    const { email } = inputs;
    const user = await findOne({ model: UserModel, filter: { email, confirmEmail: { $exists: true } } });
    if (!user) throw NotFoundException({ message: 'User not found' });

    await sendEamilOtp(email);
    return successResponse({ message: 'Two-factor authentication OTP sent to your email' });
};
/****** */
export const verifyEnableTwoFactor = async (inputs) => {
    const { email, otp } = inputs;
    const user = await findOne({ model: UserModel, filter: { email } });
    if (!user) throw NotFoundException({ message: 'User not found' });

    const hash = await get(otpKye(email));
    if (!hash || !(await compareHash({ plainText: otp, cipherText: hash }))) {
        throw ConflictException({ message: 'Invalid or expired OTP' });
    }
    await deletKey(await keys(otpKye(email)));
    user.isTwoFactorEnabled = true;
    await user.save();
    return successResponse({ message: 'Two-factor authentication enabled successfully' });
};
/*** */
export const confirmLogin = async (inputs, issuer) => {
    const { email, otp } = inputs;
    const user = await findOne({ model: UserModel, filter: { email, isTwoFactorEnabled: true } });
    if (!user) throw NotFoundException({ message: 'User not found or 2FA not enabled' });

    const hash = await get(otpKye(email));
    if (!hash || !(await compareHash({ plainText: otp, cipherText: hash }))) {
        throw ConflictException({ message: 'Invalid or expired OTP' });
    }
    await deletKey(await keys(otpKye(email)));
    return await createLoginCredentials(user, issuer);
};
/** */

/**************************** */
export const loginWithGmail = async ({ idToken }, issuer) => {

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: "380492623229-dvastokrebmghr0r4704bk35e59s0uhb.apps.googleusercontent.com",  // Specify the WEB_CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
        throw BadRequestException({ message: "Fail to verfy this account with google" })
    }
    const checkUserExist = await findOne({ model: UserModel, filter: { email: payload.email } })
    if (!checkUserExist?.provider != ProviderEnum.Google) {
        throw NotFoundException({ message: 'invalid login credentials or invalid login approach' })
    }

    return await createLoginCredentials(checkUserExist, issuer)
}

export const signupWithGmail = async ({ idToken }, issuer) => {

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: "380492623229-dvastokrebmghr0r4704bk35e59s0uhb.apps.googleusercontent.com",  // Specify the WEB_CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
        throw BadRequestException({ message: "Fail to verfy this account with google" })
    }
    const checkUserExist = await findOne({
        model: UserModel,
        filter: { email: payload.email }
    })
    if (checkUserExist) {
        if (checkUserExist.provider == ProviderEnum.System) {
            throw ConflictException({ message: "Account already exist with diffrent Provider" })

        }
        const account = await loginWithGmail({ idToken }, issuer)

        return { account, status: 200 }
    }
    const user = await createOne({
        model: UserModel, data: {
            firstName: payload.given_name,
            lastName: payload.family_name,
            email: payload.email,
            provider: ProviderEnum.Google,
            profilePic: payload.picture,
            confirmEmail: new Date()
        }
    })
    return { account: await createLoginCredentials(user, issuer) }
}


export const login = async (inputs, issuer) => {
    const { email, password } = inputs;

    const account = await findOne({
        model: UserModel,
        filter: { email, provider: ProviderEnum.System, confirmEmail: { $exists: true } },
        option: {
            // lean: true,
        }
    });
    if (!account) {
        return NotFoundException({ message: 'invalid login credentials or invalid login approach' })
    }
    let match = await compareHash({ plainText: password, cipherText: account.password })
    if (!match) {
        return NotFoundException({ message: 'invalid login credentials or invalid login approach' })
    }
    /***** */
    if (account.isTwoFactorEnabled) {
        await requestEnableTwoFactor({ email })
        return successResponse({ message: 'Two-factor authentication OTP sent to your email' });
    }
    /*** */
    return await createLoginCredentials(account, issuer)
}
