import nodemailer from 'nodemailer';
import { config } from '../server';

export class Notifier {
  transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.signIn.service,
      auth: {
        user: config.signIn.username,
        pass: config.signIn.password,
      },
    });
  }

  send(to: string, title: string, body: string, image: Buffer) {
    const mailOptions = {
      from: config.signIn.username,
      to: to,
      subject: title,
      text: body,
      html: `<img src="cid:unique"/>`,
      attachments: [
        {
          filename: 'screenshot.png',
          content: image,
          cid: 'unique',
        }
      ]
    };

    this.transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }
}
