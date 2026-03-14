
import { EventEmitter } from 'node:events'
import { sendEmail } from './send.email.js'
import { emailTemplate } from './template.email.js'
export const emailEmitter = new EventEmitter()

emailEmitter.on("Confirm-Email", async ({ to, subject = "Varify-Account",code, title = "confirm_Email" } = {}) => {
    try {
        await sendEmail({
        to,
        subject,
        html: emailTemplate({ code, title }),
    })
    } catch (error) {
      console.log(`Fail to send user email ${error}`);
        
    }
})