const nodemailer = require('nodemailer');

const htmlToText = require('nodemailer-html-to-text').htmlToText;

const MAIL_USER_NAME = process.env.MAIL_USER_NAME;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: MAIL_USER_NAME, 
    pass: MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});
transporter.use('compile', htmlToText());

const templates = {
  confirm_account: data => ({
    to: data.email,
    subject: 'Welcome to UAAchat!',
    html: `
      <div style="
        width: 400px;
        min-width: 400px;
        height: fit-content;
        min-height: fit-content;
        text-align: center;
        padding: 30px 0px;
        background-color: rgb(241, 242, 238);
        border: 1px solid rgb(87, 77, 101);
        border-radius: 20px;
      " >
        <span style="
          font-size: 24px;
          color: rgb(87, 77, 101);
          font-weight: 600;
          font-family: Arial, Helvetica, sans-serif;
          margin-bottom: 30px;
          width: 100%;
          display: inline-block;
          text-align: center;
        " >
        Welcome to UAAchat, ${data.name}!</span>
        <span style="
          font-size: 15px;
          color: rgb(67, 80, 88);
          font-weight: 300;
          font-family: Arial, Helvetica, sans-serif;
          margin-bottom: 10px;
          width: 300px;
          display: inline-block;
          text-align: center;
        " >Please confirm your account before you start to reach your teachers and chat with your friends.</span>
        <span style="
          font-size: 15px;
          color: rgb(67, 80, 88);
          font-weight: 300;
          font-family: Arial, Helvetica, sans-serif;
          margin-bottom: 60px;
          width: 300px;
          display: inline-block;
          text-align: center;
        " >If you have any further questions or concerns, you can reach us from this email address.</span>
        <span style="
          font-size: 12px;
          color: rgb(115, 90, 160);
          font-weight: 600;
          font-family: Arial, Helvetica, sans-serif;
          margin-bottom: 0px;
          width: 100%;
          display: inline-block;
          text-align: center;
        " >Your one time code:</span>
        <span style="
          font-size: 26px;
          letter-spacing: 2px;
          color: rgb(87, 77, 101);
          font-weight: 600;
          font-family: Arial, Helvetica, sans-serif;
          margin-bottom: 30px;
          width: 100%;
          display: inline-block;
          text-align: center;
        " >${data.code}</span>
        <span style="
          font-size: 14px;
          color: rgb(67, 80, 88);
          font-weight: 300;
          font-family: Arial, Helvetica, sans-serif;
          width: 300px;
          display: inline-block;
          text-align: center;
        " >This code will expire in 1 hour, please relogin to renew your code.</span>
      </div>
    `
  })
};

module.exports = (data, template, callback) => {
  const mailOptions = {
    from: "uaachat",
    ...templates[template](data)
  };
  transporter.sendMail(mailOptions, callback);
};

