import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  // Appointments list
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointments);
  }

  // creating appointment
  async store(req, res) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
      provider_id: Yup.number().required(),
    });
    // check if req.body is valid
    if (!schema.isValid(req.body)) {
      return res.status(400).json({ error: 'validaition fails ' });
    }
    // check if user and provider are de same

    // check if providers_id is provider
    const { provider_id, date } = req.body;
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });
    if (!isProvider) {
      return res.status(400).json({ error: 'invalid provider' });
    }
    /*
     * check if user and provider are de same
     */
    if (req.userId === provider_id) {
      return res
        .status(400)
        .json({ error: 'The provider can not be the user' });
    }
    // check of date is in the past
    const hourStart = startOfHour(parseISO(date));
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }

    // check if date avalibility
    const checkAvalability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });
    if (checkAvalability) {
      return res.status(400).json({ error: 'Applointment is not avaible' });
    }

    /*
     insert into database
    */
    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    /*
     notfy appointment provider
    */
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { localle: pt }
    );
    const user = await User.findByPk(req.userId);

    await Notification.create({
      content: `novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  // delete appointment
  async delete(req, res) {
    /*
     * Verify if user is the owner of appointment
     */
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });
    if (appointment.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: 'You can only delete your`s appointments' });
    }
    /*
     *Verify if appointment can be canceled
     */
    const dateWithSub = subHours(appointment.date, 2);
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can not cancel appointments 2 hours before starts',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    /*
     * Send cancelation email whith template
     */
    await Queue.add(CancellationMail.key, {
      appointment,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
