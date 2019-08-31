import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    // using the get to import de method withaut instance, like import CancellationMail.key
    return 'CancellatioMail';
  }

  async handle({ data }) {
    const { appointment } = data;

    await Mail.sendMail({
      to: `${appointment.provider.name}<${appointment.provider.email}>`,
      subject: 'Appointment canceled',
      template: 'cancelation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(
          parseISO(appointment.date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            localle: pt,
          }
        ),
      },
    });
  }
}

export default new CancellationMail();
