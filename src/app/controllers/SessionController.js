import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import User from '../models/User';
import authCongig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;
    const schema = Yup.object().shape({
      email: Yup.string().required(),
      password: Yup.string()
        .required()
        .min(6),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (!(await user.chekPassword(password))) {
      return res.status(401).json({ message: 'User does not match' });
    }

    const { id, name } = user;

    return res.json({
      user: {
        id,
        name,
        email,
      },
      token: jwt.sign({ id }, authCongig.secret, {
        expiresIn: authCongig.expiresIn,
      }),
    });
  }
}
export default new SessionController();
