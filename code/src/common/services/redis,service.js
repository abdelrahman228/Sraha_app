import { redisClient } from "../../DB/index.js";
import { EmailEnum } from "../enums/email.enums.js";
export const otpKye = ({email, subject=EmailEnum.CONFIRM_EMAIL}) => {
    return `OTP::User::${email}::${subject}`
}

export const otpMaxRequestKye = ({email, subject=EmailEnum.CONFIRM_EMAIL}) => {
    return `${otpKye({email, subject})}::MaxTrial`
}

export const otpBlockKey = ({email, subject=EmailEnum.CONFIRM_EMAIL}) => {
    return `${otpKye({email, subject})}::Block`
}

export const baseRevokeTokenKey = (userID) => {
    return `RevokeToken::${userID.toString()}`
}

export const revokeTokenKey = ({ userID, jti }) => {
    return `${baseRevokeTokenKey(userID)}::${jti}`
}



export const set = async ({
    key,
    value,
    ttl
} = {}) => {
    try {
        let data = value === 'string' ? value : JSON.stringify(value)
        return ttl ? await redisClient.set(key, data, { EX: ttl }) : await redisClient.set(key, data)

    } catch (error) {
        console.log(`Fail in redis set operation ${error}`);

    }
}

export const update = async ({
    key,
    value,
    ttl
} = {}) => {
    try {
        if (!await redisClient.exists(key)) return 0;
        return await set({ key, value, ttl })

    } catch (error) {
        console.log(`Fail in redis set operation ${error}`);

    }
}

export const increment = async (key) => {
    try {
        if (!await redisClient.exists(key)) {
            return 0
        };
        return redisClient.incr(key)

    } catch (error) {
        console.log(`Fail in redis set operation ${error}`);

    }
}

export const get = async (key) => {
    try {
        try {
            return JSON.parse(await redisClient.get(key))
        } catch (error) {
            return await redisClient.get(key)
        }
    } catch (error) {
        console.log(`Fail in redis set operation ${error}`);

    }
}

export const ttl = async (key) => {
    try {
        return await redisClient.ttl(key)
    } catch (error) {
        console.log(`Fail in redis ttl operation ${error}`);
    }
}

export const exists = async (key) => {
    try {
        return await redisClient.exists(key)
    } catch (error) {
        console.log(`Fail in redis exists operation ${error}`);
    }
}

export const expire = async ({ key, ttl } = {}) => {
    try {
        return await redisClient.expire(key, ttl)
    } catch (error) {
        console.log(`Fail in redis add-expire operation ${error}`);
    }
}

export const mGet = async (keys = []) => {
    try {
        if (!keys.length) return 0;
        return await redisClient.mGet(keys)
    } catch (error) {
        console.log(`Fail in redis mGet operation ${error}`);
    }
}

export const keys = async (prefix) => {
    try {
        return await redisClient.keys(`${prefix}*`)
    } catch (error) {
        console.log(`Fail in redis keys operation ${error}`);
    }
}

export const deletKey = async (key) => {
    try {
        if (!key.length) return 0;
        return await redisClient.del(key)
    } catch (error) {
        console.log(`Fail in redis dell operation ${error}`);
    }
}