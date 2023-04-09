import { Request, Response } from 'express';

import userService from '../user/service';

import { InvalidHttpRequestError, UnauthorizedHttpRequestError } from '../../shared/custom-errors';
import { ILoginBody, IRegisterBody } from './types';
import { createToken, successResponse, verifyToken } from '../../shared/utils';

const register = async (req: Request<any, any, IRegisterBody>, res: Response) => {
    const details = req.body;
    const existingUser = await userService.getOne({ email: details.email });
    if (existingUser) {
        throw new InvalidHttpRequestError('Invalid Email');
    }

    await userService.create({ ...details });
    // TODO: send register mail with account activation link
    return res.send(successResponse({ message: 'Registration successful' }));
};

const login = async (req: Request<any, any, ILoginBody>, res: Response) => {
    const details = req.body;

    // TODO: Add check in other routes if account is activated or nots
    const user = await userService.getOne({ ...details }, '-createdAt -updatedAt');
    if (!user) {
        throw new UnauthorizedHttpRequestError('Invalid Login Credentials');
    }

    const token = createToken(user);
    const refresh = createToken(user, 24 * 30);
    return res.send(successResponse({ message: 'Login Successful', data: { token, refresh } }));
};

const forgotPassword = (req: Request, res: Response) => {
    console.log('BODY ', req.body);
    // TODO: send email on email with password changed link, with min. expiry

    return res.send({ message: 'NOT IMPLEMENTED' });
};

const setPassword = (req: Request, res: Response) => {
    console.log('BODY ', req.body);
    // TODO: To set new password

    return res.send({ message: 'NOT IMPLEMENTED' });
};

const activateAccount = (req: Request, res: Response) => {
    console.log('BODY ', req.body);
    // TODO: To Activate Account

    return res.send({ message: 'NOT IMPLEMENTED' });
};

const refreshAccessToken = async (req: Request, res: Response) => {
    const data: any = verifyToken(req.body.refresh);
    const token = createToken(data);
    return res.send(successResponse({ data: { token } }));
};

export default {
    register,
    login,
    forgotPassword,
    setPassword,
    activateAccount,
    refreshAccessToken,
};