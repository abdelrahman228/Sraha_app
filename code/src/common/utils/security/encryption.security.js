import crypto  from 'node:crypto'
import { ENC_BYTE } from '../../../../config/config.service.js';

const IV_LENGTH = 16;

const ENCRYPTION_SECRET_KEY = Buffer.from(ENC_BYTE)

export const encrypt =async (text)=>{
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv('aes-256-cbc',ENCRYPTION_SECRET_KEY,iv)

    let encryptedData = cipher.update(text,'utf-8','hex')
    encryptedData+=cipher.final('hex')
    return `${iv.toString('hex')}:${encryptedData}`
}

export const decrypt =async (encryptedData)=>{
    const [iv,encryptText] = encryptedData.split(":")
    const binaryLikeIv = Buffer.from(iv,'hex');

    const deCipher =  crypto.createDecipheriv('aes-256-cbc',ENCRYPTION_SECRET_KEY,binaryLikeIv);
    let decryptData = deCipher.update(encryptText,'hex','utf-8');
    decryptData += deCipher.final('utf-8')
    return decryptData
}