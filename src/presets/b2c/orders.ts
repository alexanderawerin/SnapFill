import { Preset } from '../types';

export const ordersPreset: Preset = {
  id: 'orders',
  name: 'История заказов',
  description: 'Заказы пользователя',
  icon: 'Package',
  category: 'b2c',
  data: [
    {
      orderId: '#12345678',
      date: '15 января 2024',
      status: 'Доставлен',
      total: '189 980',
      items: '3 товара',
      deliveryAddress: 'Москва, ул. Ленина, 10',
      paymentMethod: 'Картой онлайн'
    },
    {
      orderId: '#12345677',
      date: '10 января 2024',
      status: 'В пути',
      total: '44 990',
      items: '1 товар',
      deliveryAddress: 'Москва, ул. Ленина, 10',
      paymentMethod: 'Картой онлайн'
    },
    {
      orderId: '#12345676',
      date: '28 декабря 2023',
      status: 'Доставлен',
      total: '119 990',
      items: '1 товар',
      deliveryAddress: 'Москва, ул. Ленина, 10',
      paymentMethod: 'При получении'
    }
  ]
};

