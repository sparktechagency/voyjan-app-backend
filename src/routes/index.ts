import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { AddressRoutes } from '../app/modules/address/address.route';
import { ChatbotRoutes } from '../app/modules/chatbot/chatbot.route';
import { CategoryRoutes } from '../app/modules/category/category.route';
const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/address',
    route: AddressRoutes,
  },
  {
    path: '/chatbot',
    route: ChatbotRoutes,
  },
  {
    path: '/category',
    route: CategoryRoutes
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
