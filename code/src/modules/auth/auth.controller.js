import { Router } from 'express'
import { confirmEmail, confirmLogin, login, loginWithGmail, requestEnableTwoFactor, requestForgotPasswordOTP, reSendConfirmEmail, resetForgotPasswordOtp, signup, signupWithGmail, verifyEnableTwoFactor, verifyForgotPasswordOTP } from './auth.service.js';
import { BadRequestException, successResponse } from '../../common/utils/index.js';
import * as validators from './auth.validation.js'
import { validation } from '../../middleware/index.js';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import geoip from 'geoip-lite'
import { redisClient } from '../../DB/redis.connection.db.js';
const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: async function (req) {
        // const { country_code } = await fromWhere(req.ip)|| {} 
        const { country } = geoip.lookup(req.ip)
        return country == "EG" ? 5 : 3;
    },
    legacyHeaders: false,
    standardHeaders: 'draft-8',
    skipSuccessfulRequests: true,
    keyGenerator: (req, res, next) => {
        const ip = ipKeyGenerator(req.ip, 56)
        return `${ip}-${req.path}`
    },
    store: {
        async incr(key, cb) { // get called by keyGenerator
            try {
                const count = await redisClient.incr(key);
                if (count === 1) await redisClient.expire(key, 60); // 1 min TTL
                cb(null, count);
            } catch (err) {
                cb(err);
            }
        },

        async decrement(key) {  // called by kipFailedRequests:true ,  skipSuccessfulRequests:true,
            if (await redisClient.exists(key)) {
                await redisClient.decr(key);

            }

        },
    },
});

router.post("/login",loginLimiter ,validation(validators.login), async (req, res, next) => {
    const account = await login(req.body, `${req.protocol}://${req.host}`)
    await deletekey(`${req.ip}-${req.path}`)
    return successResponse({ res, data: { account } })
})

router.post("/signup",
    validation(validators.signup),
    async (req, res, next) => {

        const account = await signup(req.body)
        return successResponse({ res, status: 201, data: { account } })
    })

router.patch(
    "/confirm-email",
    validation(validators.confirmEmail),
    async (req, res, next) => {

        await confirmEmail(req.body)
        return successResponse({ res })
    })

router.patch(
    "/resend-confirm-email",
    validation(validators.reSendConfirmEmailc),
    async (req, res, next) => {

        await reSendConfirmEmail(req.body)
        return successResponse({ res })
    })

router.post(
    "/request-forgot-password-code",
    validation(validators.reSendConfirmEmailc),
    async (req, res, next) => {

        await requestForgotPasswordOTP(req.body)
        return successResponse({ res })
    })

router.patch(
    "/verify-forgot-password-code",
    validation(validators.confirmEmail),
    async (req, res, next) => {

        await verifyForgotPasswordOTP(req.body)
        return successResponse({ res })
    })

router.patch(
    "/reset-forgot-password-code",
    validation(validators.resetForgotPasswordCode),
    async (req, res, next) => {

        await resetForgotPasswordOtp(req.body)
        return successResponse({ res })
    })

/********* */


router.post('/2fa/request-enable', validation(validators.requestEnable2fa), async (req, res) => {
    const data = await requestEnableTwoFactor(req.body);
    return successResponse({ res, data });
})

router.post('/2fa/verify-enable', validation(validators.verifyEnable2fa), async (req, res) => {
    const data = await verifyEnableTwoFactor(req.body);
    return successResponse({ res, data });
})

router.post('/login/confirm', validation(validators.confirmLogin), async (req, res) => {
    const account = await confirmLogin(req.body, `${req.protocol}://${req.host}`);
    return successResponse({ res, data: { account } });
})


/******** */


router.post("/signup/gmail", async (req, res, next) => {
    const { account, status = 201 } = await signupWithGmail(req.body, `${req.protocol}://${req.host}`)
    return successResponse({ res, status: 201, data: { account } })
})

router.post("/login/gmail", async (req, res, next) => {
    const account = await loginWithGmail(req.body, `${req.protocol}://${req.host}`)
    return successResponse({ res, data: { account } })
})

export default router