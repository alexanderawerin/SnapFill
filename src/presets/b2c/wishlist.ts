import { Preset } from '../types';

export const wishlistPreset: Preset = {
  id: 'wishlist',
  name: 'Избранное',
  description: 'Избранные товары пользователя',
  icon: 'Heart',
  category: 'b2c',
  data: [
    {
      id: '1',
      title: 'MacBook Pro 16"',
      price: '289 990',
      image: 'https://avatars.mds.yandex.net/get-mpic/5235129/img_id5468384092058403832.png',
      rating: '4.9',
      inStock: 'true',
      addedDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'iPad Air',
      price: '69 990',
      image: 'https://avatars.mds.yandex.net/get-mpic/5234659/img_id8865926301397365391.jpeg',
      rating: '4.8',
      inStock: 'true',
      addedDate: '2024-01-12'
    },
    {
      id: '3',
      title: 'Magic Keyboard',
      price: '12 990',
      image: 'https://avatars.mds.yandex.net/get-mpic/4578849/img_id2675453769807018987.jpeg',
      rating: '4.7',
      inStock: 'false',
      addedDate: '2024-01-10'
    }
  ]
};

