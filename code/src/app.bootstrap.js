
import {  port } from '../config/config.service.js'
import { globalErrorHandling } from './common/utils/index.js'
import { authenticationDB, connectRedis } from './DB/index.js'
import { authRouter, messageRouter, userRouter } from './modules/index.js'
import express from 'express'
import cors from 'cors'
import { resolve } from 'node:path'
import helmet from 'helmet'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import axios from "axios";
import geoip from 'geoip-lite'

async function bootstrap() {
    const app = express()
    //convert buffer data

    const fromWhere = async (ip) => {

        try {
            const response = await axios.get(`https://ipapi.co/${ip}/json`);
            console.log(response.data);
            return response.data
        } catch (error) {
            console.error(error);
        }

    }

    // var corsOptions = {
    //     origin: function (origin, callback) {
    //         if (!ORIGINS.includes(origin)) {
    //             callback(new Error('Not authorized origin'))
    //         } else {
    //             callback(null, true )
    //         }
    //     }
    // };

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: async function (req) {
            // const { country_code } = await fromWhere(req.ip)|| {} 
            const {country} = geoip.lookup(req.ip)
            return country == "EG" ? 5 : 3;
        },
        legacyHeaders: false,
        standardHeaders: 'draft-8',
        skipSuccessfulRequests: true,
        keyGenerator: (req, res, next) => {
            const ip = ipKeyGenerator(req.ip, 56)
            return `${ip}-${req.path}`
        }
    });
    app.set("trust proxy", true)
    app.use(cors(), helmet(), express.json())
    app.use("/uploads", express.static(resolve("../uploads")))
    //DB
    await authenticationDB()
    await connectRedis()


    //application routing
    app.get('/', (req, res) => res.send('Hello World!'))
    app.use('/auth', authRouter)
    app.use('/user', userRouter)
    app.use('/message', messageRouter)

    //invalid routing
    app.use('{/*dummy}', (req, res) => {
        return res.status(404).json({ message: "Invalid application routing" })
    })

    //error-handling
    app.use(globalErrorHandling)

    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}
export default bootstrap