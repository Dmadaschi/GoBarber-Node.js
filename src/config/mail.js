export default {
  // smtp config
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_USER,
  secure: process.env.MAIL_PASS,
  auth: {
    user: '77108505fff917',
    pass: '638159984cfc3b',
  },
  default: {
    from: 'GoBarber <gobarber@gobarber.com>',
  },
};
