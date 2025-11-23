import { Preset } from '../types';

export const usersPreset: Preset = {
  id: 'b2c-users',
  name: 'Пользователи',
  icon: 'Users',
  description: 'Профили пользователей для социальных и административных интерфейсов',
  data: [
    {
      name: 'Александр Петров',
      email: 'a.petrov@example.com',
      avatar: 'https://i.pravatar.cc/150?img=11',
      role: 'Администратор',
      status: 'Онлайн',
      join_date: '15 января 2023',
      location: 'Москва, Россия',
      bio: 'Full-stack разработчик с 8-летним опытом. Люблю создавать удобные интерфейсы.',
      stats: '1 240 заказов, 89 отзывов'
    },
    {
      name: 'Мария Соколова',
      email: 'm.sokolova@example.com',
      avatar: 'https://i.pravatar.cc/150?img=5',
      role: 'Покупатель',
      status: 'Онлайн',
      join_date: '22 марта 2023',
      location: 'Санкт-Петербург, Россия',
      bio: 'Люблю шопинг и новые технологии. Активный покупатель электроники.',
      stats: '87 заказов, 156 отзывов'
    },
    {
      name: 'Дмитрий Волков',
      email: 'd.volkov@example.com',
      avatar: 'https://i.pravatar.cc/150?img=33',
      role: 'Модератор',
      status: 'Не в сети',
      join_date: '10 июня 2022',
      location: 'Екатеринбург, Россия',
      bio: 'Помогаю поддерживать качество контента на платформе.',
      stats: '523 заказа, 234 отзыва'
    },
    {
      name: 'Елена Иванова',
      email: 'e.ivanova@example.com',
      avatar: 'https://i.pravatar.cc/150?img=9',
      role: 'Покупатель',
      status: 'Онлайн',
      join_date: '5 сентября 2023',
      location: 'Новосибирск, Россия',
      bio: 'Мама двоих детей. Покупаю товары для дома и семьи.',
      stats: '234 заказа, 78 отзывов'
    },
    {
      name: 'Игорь Смирнов',
      email: 'i.smirnov@example.com',
      avatar: 'https://i.pravatar.cc/150?img=68',
      role: 'VIP покупатель',
      status: 'Онлайн',
      join_date: '1 декабря 2021',
      location: 'Казань, Россия',
      bio: 'Предприниматель. Интересуюсь гаджетами и умным домом.',
      stats: '2 890 заказов, 445 отзывов'
    },
    {
      name: 'Ольга Новикова',
      email: 'o.novikova@example.com',
      avatar: 'https://i.pravatar.cc/150?img=20',
      role: 'Покупатель',
      status: 'Не в сети',
      join_date: '18 апреля 2023',
      location: 'Краснодар, Россия',
      bio: 'Фрилансер и любитель онлайн-шопинга.',
      stats: '156 заказов, 92 отзыва'
    },
    {
      name: 'Сергей Кузнецов',
      email: 's.kuznetsov@example.com',
      avatar: 'https://i.pravatar.cc/150?img=14',
      role: 'Покупатель',
      status: 'Онлайн',
      join_date: '7 июля 2023',
      location: 'Ростов-на-Дону, Россия',
      bio: 'IT-специалист. Слежу за новинками техники.',
      stats: '67 заказов, 34 отзыва'
    }
  ]
};

