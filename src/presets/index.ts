import { Preset } from './types';
import {
  productsData,
  reviewsData,
  messagesData,
  promotionData,
  ordersData,
  suppliesData
} from './data';

// Preset definitions
const productsPreset: Preset = {
  id: 'products',
  name: 'Товары',
  icon: 'ShoppingCart',
  description: 'Карточки товаров маркетплейса',
  data: productsData
};

const reviewsPreset: Preset = {
  id: 'reviews',
  name: 'Отзывы',
  icon: 'Star',
  description: 'Отзывы покупателей с оценками',
  data: reviewsData
};

const messagesPreset: Preset = {
  id: 'messages',
  name: 'Сообщения',
  icon: 'MessageCircle',
  description: 'Сообщения и уведомления',
  data: messagesData
};

const promotionPreset: Preset = {
  id: 'promotion',
  name: 'Реклама и продвижение',
  icon: 'Megaphone',
  description: 'Рекламные кампании и продвижение',
  data: promotionData
};

const ordersPreset: Preset = {
  id: 'orders',
  name: 'Заказы и отгрузки',
  icon: 'ClipboardList',
  description: 'Заказы и отгрузки товаров',
  data: ordersData
};

const suppliesPreset: Preset = {
  id: 'supplies',
  name: 'Поставки',
  icon: 'Package',
  description: 'Поставки и приёмка товаров',
  data: suppliesData
};

export const presets = {
  all: [
    productsPreset,
    reviewsPreset,
    messagesPreset,
    promotionPreset,
    ordersPreset,
    suppliesPreset
  ]
};

export * from './types';
