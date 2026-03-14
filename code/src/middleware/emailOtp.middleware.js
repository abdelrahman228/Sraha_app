import  nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `Your App <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP is ${otp}. It will expire in 10 minutes.`
  };

  await transporter.sendMail(mailOptions);
};