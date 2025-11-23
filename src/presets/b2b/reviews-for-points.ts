import { Preset } from '../types';

export const reviewsForPointsPreset: Preset = {
  id: 'b2b-reviews-for-points',
  name: 'Отзывы за баллы',
  icon: 'Star',
  description: 'Кампании стимулирования отзывов покупателей',
  data: [
    {
      campaign_name: 'Thermaltake / Марголин Илья / Бюджет 12 000 / с 12 августа',
      tag: 'Файл',
      status: 'Выключена',
      products_in_campaign: '2',
      reviews_target: '10',
      reviews_left: '20',
      max_budget: 'до 12 000 ₽'
    },
    {
      campaign_name: 'БЗО-НОВЫЙ Баранова с 03.06 ФБС',
      tag: 'Файл',
      status: 'Выключена',
      products_in_campaign: '59',
      reviews_target: '10',
      reviews_left: '590',
      max_budget: 'до 88 500 ₽'
    },
    {
      campaign_name: 'шпд - Баранова Л. - от 23.01.25 - 134 товаров - фбс',
      tag: 'Файл',
      status: 'Выключена',
      products_in_campaign: '117',
      reviews_target: '10',
      reviews_left: '1170',
      max_budget: 'до 175 500 ₽'
    },
    {
      campaign_name: '[БЗО] видеокарты 50я серия с 18.04 по 17.05 (месяц) Вендор',
      tag: 'Файл, Вендор',
      status: 'Выключена',
      products_in_campaign: '4',
      reviews_target: '10',
      reviews_left: '40',
      max_budget: 'до 120 000 ₽'
    },
    {
      campaign_name: 'ОЗБ на ноутбуки Acer с 28.02. по 30.04 ФБС Вендор',
      tag: 'Файл',
      status: 'Выключена',
      products_in_campaign: '18',
      reviews_target: '20',
      reviews_left: '—',
      max_budget: 'до 360 000 ₽'
    }
  ]
};

