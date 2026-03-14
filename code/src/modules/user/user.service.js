import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from "../../../config/config.service.js"
import { LogoutEnum } from "../../common/enums/index.js"
import { baseRevokeTokenKey, deletKey, keys, revokeTokenKey, set, ttl } from "../../common/services/index.js"
import { ConflictException, NotFoundException } from "../../common/utils/index.js"
import { compareHash, createLoginCredentials, generateHash } from "../../common/utils/security/index.js"
import {  findOne } from "../../DB/index.js"
import {  UserModel } from "../../DB/index.js"

const creatRevokeToken = async ({ userID, jti, ttl }) => {
    await set({
        key: revokeTokenKey({ userID, jti }),
        value: jti,
        ttl

    })
    return;
}

export const logout = async ({ flag }, uesr, { jti, iat, sub }) => {
    let status = 200
    switch (flag) {
        case LogoutEnum.All:
            uesr.changeCredentialsTime = new Date()
            await uesr.save()

            await deletKey(await keys(baseRevokeTokenKey(sub)))
            break;
        default:
            await creatRevokeToken({
                userID: sub,
                jti,
                ttl: iat + REFRESH_EXPIRES_IN
            })
            status = 201
            break;
    }
    return status
}

export const rotateToken = async (uesr, { sub, jti, iat }, issuer) => {
    if ((iat + ACCESS_EXPIRES_IN) * 1000 >= Date.now() + (30000)) {
        throw ConflictException({ message: "current access token still valid" })
    }
    creatRevokeToken({
        userID: sub,
        jti,
        ttl: iat + REFRESH_EXPIRES_IN
    })
    return await createLoginCredentials(uesr, issuer)
}

export const profileImage = async (file, uesr) => {
    uesr.profilePicture = file.finalPath
    await uesr.save()
    return uesr
}

export const profileCoverImage = async (files, uesr) => {
    uesr.coverProfilePictures = files.map(file => file.finalPath)
    await uesr.save()
    return uesr
}

export const profile = async (uesr) => {

    return uesr
}

export const shareProfile = async (userId) => {
    const profile = await findOne({
        model: UserModel,
        filter: { _id: userId },
        select: "-password"
    })
    if (!profile) {
        throw NotFoundException({ message: "Fail to find matching profile" })
    }
    if (profile.phone) {
        profile.phone = await generateDecryption(profile.phone)
    }
    return profile
}

export const updatePassword = async ({ oldPassword, newPassword }, user, issuer) => {
    if (!await compareHash({ plainText: oldPassword, cipherText: user.password })) {
        throw ConflictException({ message: 'Invalid old password' });
    }

    for (const hash of user.oldPasswords||[]) {
        if (await compareHash({ plainText: oldPassword, cipherText: hash })) {
            throw ConflictException({ message: 'this password is already used before' });
        }
    }

    user.oldPassword.push(user.password)
    user.password = await generateHash({ plainText: newPassword });
    user.changeCredentialsTime =new Date();
    await user.save();
    await deletKey(await keys(baseRevokeTokenKey(user._id)))
    return await createLoginCredentials(user, issuer);
};
