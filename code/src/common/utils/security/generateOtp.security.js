import otpGenerator from 'otp-generator'
export const generateOtp = (length=6) => {

    
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}

export const compareOTP = (receivedOTP, storedOTP) => {
    return receivedOTP === storedOTP;
}