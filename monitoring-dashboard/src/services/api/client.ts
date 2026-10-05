import axios from 'axios'; import { env } from '../../config/env'; export const api=axios.create({baseURL:env.apiUrl,timeout:5000,headers:{'Content-Type':'application/json'}});
