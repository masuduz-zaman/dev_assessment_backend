import { OAuth2Client } from 'google-auth-library';
import { env } from './env';

/** Google Cloud OAuth client used to verify ID tokens issued by "Sign in with Google". */
export const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : undefined;
