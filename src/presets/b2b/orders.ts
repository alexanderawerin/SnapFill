import { Preset } from '../types';

export const ordersPreset: Preset = {
  id: 'b2b-orders',
  name: 'Заказы',
  icon: 'ShoppingBag',
  description: 'Заказы и отгрузки товаров',
  category: 'b2b',
  data: [
    {
      order_id: '#ORD-2024-001',
      date: '15.01.2024',
      company: 'ООО "Технострой"',
      status: 'Отгружен',
      items_count: '15',
      total_amount: '485 000 ₽',
      payment_status: 'Оплачен',
      delivery_address: 'Москва, ул. Производственная, 12',
      manager: 'Иванов И.И.'
    },
    {
      order_id: '#ORD-2024-002',
      date: '14.01.2024',
      company: 'ИП Петров',
      status: 'В обработке',
      items_count: '8',
      total_amount: '125 000 ₽',
      payment_status: 'Ожидает оплаты',
      delivery_address: 'СПб, пр. Невский, 45',
      manager: 'Сидорова А.В.'
    },
    {
      order_id: '#ORD-2024-003',
      date: '13.01.2024',
      company: 'ООО "МегаСтрой"',
      status: 'Доставляется',
      items_count: '25',
      total_amount: '890 000 ₽',
      payment_status: 'Оплачен',
      delivery_address: 'Казань, ул. Баумана, 78',
      manager: 'Козлов П.С.'
    }
  ]
};

