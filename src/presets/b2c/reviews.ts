import { Preset } from '../types';

export const reviewsPreset: Preset = {
  id: 'b2c-reviews',
  name: 'Отзывы покупателей',
  icon: 'MessageSquare',
  description: 'Отзывы с оценками для товаров',
  data: [
    {
      author_name: 'Алексей М.',
      author_avatar: 'https://i.pravatar.cc/150?img=12',
      rating: '5',
      review_text: 'Отличный смартфон! Камера просто огонь, особенно в ночном режиме. Батарея держит целый день активного использования. Титановый корпус очень приятный на ощупь.',
      review_date: '15 ноября 2024',
      helpful_count: '234',
      images: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80',
      verified_purchase: 'Подтвержденная покупка'
    },
    {
      author_name: 'Мария К.',
      author_avatar: 'https://i.pravatar.cc/150?img=5',
      rating: '4',
      review_text: 'Пылесос работает отлично, убирает качественно. Станция самоочистки очень удобная. Единственный минус - немного шумный на максимальной мощности.',
      review_date: '12 ноября 2024',
      helpful_count: '89',
      images: '',
      verified_purchase: 'Подтвержденная покупка'
    },
    {
      author_name: 'Дмитрий В.',
      author_avatar: 'https://i.pravatar.cc/150?img=33',
      rating: '5',
      review_text: 'MacBook просто бомба! M2 чип справляется со всеми задачами на ура. Монтирую видео в 4K без тормозов. Тишина работы и автономность впечатляют.',
      review_date: '10 ноября 2024',
      helpful_count: '156',
      images: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=80, https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80',
      verified_purchase: 'Подтвержденная покупка'
    },
    {
      author_name: 'Елена П.',
      author_avatar: 'https://i.pravatar.cc/150?img=9',
      rating: '5',
      review_text: 'Наушники Sony - лучшее что я покупала! Шумоподавление работает идеально, звук чистый и объемный. Удобно сидят, не давят даже при долгом ношении.',
      review_date: '8 ноября 2024',
      helpful_count: '201',
      images: '',
      verified_purchase: 'Подтвержденная покупка'
    },
    {
      author_name: 'Игорь С.',
      author_avatar: 'https://i.pravatar.cc/150?img=68',
      rating: '4',
      review_text: 'Яндекс Станция отлично вписалась в дом. Алиса умная, звук хороший. Иногда бывают проблемы с распознаванием команд, но в целом доволен.',
      review_date: '5 ноября 2024',
      helpful_count: '67',
      images: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=200&q=80',
      verified_purchase: 'Подтвержденная покупка'
    },
    {
      author_name: 'Ольга Н.',
      author_avatar: 'https://i.pravatar.cc/150?img=20',
      rating: '3',
      review_text: 'Планшет неплохой за свои деньги, но экран мог бы быть поярче. Для просмотра видео и чтения вполне подходит.',
      review_date: '2 ноября 2024',
      helpful_count: '34',
      images: '',
      verified_purchase: 'Подтвержденная покупка'
    }
  ]
};

