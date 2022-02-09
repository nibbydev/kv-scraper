import nodemailer from 'nodemailer';
import { Action, ActionType } from '../model/action.model';
import { config } from '../server';

export class Notifier {
  transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.signIn.service,
      auth: {
        user: config.signIn.username,
        pass: config.signIn.password,
      },
    });
  }

  send(action: Action) {
    const subject =
      action.type === ActionType.NOTIFY_CHANGED
        ? `KV scraper - Changed - ${action.listing.id}`
        : `KV scraper - New - ${action.listing.id}`;

    const mailOptions = {
      from: config.signIn.username,
      to: action.notifyEmails,
      subject: subject,
      html: this.buildHtml(action),
      attachments: [
        {
          filename: 'screenshot.png',
          content: action.screenshot,
          cid: 'unique',
        },
      ],
    };

    this.transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  buildHtml(action: Action) {
    let changedFieldsHtml = '';
    if (action.changedFields) {
      changedFieldsHtml += '<pre>' + action.changedFields.join(', ') + '</pre>';
    }

    return `<a href="${action.listing.href}" target="_blank">
      <img src="cid:unique"/> 
      <br><br>
      ${changedFieldsHtml}
    </a>`;
  }
}
