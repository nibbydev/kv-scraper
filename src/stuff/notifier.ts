import { createTransport, Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Action, ActionType } from '../model/action.model';
import { ListingLookup } from '../model/config.model';
import { config } from '../server';

export class Notifier {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      service: config.signIn.service,
      auth: {
        user: config.signIn.username,
        pass: config.signIn.password,
      },
    });
  }

  send(lookup: ListingLookup, action: Action) {
    const subject =
      action.type === ActionType.NOTIFY_CHANGED
        ? `${lookup.description} - Changed - ${action.listingId}`
        : `${lookup.description} - New - ${action.listingId}`;

    const mailOptions: Mail.Options = {
      from: config.signIn.username,
      to: lookup.notifyEmails,
      subject: subject,
      html: this.buildHtml(action),
      attachments: [
        {
          filename: 'screenshot.png',
          content: action.screenshot,
          cid: '1',
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

  private buildHtml(action: Action) {
    let changedFieldsHtml = '';

    if (action.type === ActionType.NOTIFY_CHANGED) {
      changedFieldsHtml += '<h2>Changed fields:</h2>\n';
      changedFieldsHtml += '<pre>\n';

      for (const change of action.changed) {
        changedFieldsHtml +=
          change.field + ': ' + change.from + ' -> ' + change.to + '\n';
      }

      changedFieldsHtml += '</pre>\n';
    }

    return `
      <a href="${action.href}" target="_blank">
        <img src="cid:1"/> 
        <br><br>
      </a>
      ${changedFieldsHtml}`.trim();
  }
}
