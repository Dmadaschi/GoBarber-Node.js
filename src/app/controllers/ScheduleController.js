import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    // verify if user loger is a provider
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });
    if (!checkUserProvider) {
      return res.status(401).json({ erro: 'Provider not found' });
    }
    // select appointmentes by provider and date
    const { date } = req.query;
    const parseDate = parseISO(date);
    // 2019-11-01 00:00:00
    // 2019-11-01 23:59:59
    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parseDate), endOfDay(parseDate)],
        },
      },
      order: ['date'],
    });
    return res.json(appointments);
  }
}
export default new ScheduleController();
