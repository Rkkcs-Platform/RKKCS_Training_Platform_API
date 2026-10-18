export interface FillAddress {
  cityId: string;
  postalCode: string;
  prefecture: string;
  city: string;
  line1: string;
}

/** Delivery addresses aligned with MOCK_CITIES Japan ids. */
export const FILL_ADDRESSES: FillAddress[] = [
  {
    cityId: 'jp-shibuya',
    postalCode: '150-0002',
    prefecture: '東京都',
    city: '渋谷区',
    line1: '渋谷1-1-2 クロスビル3F',
  },
  {
    cityId: 'jp-tokyo',
    postalCode: '100-0005',
    prefecture: '東京都',
    city: '千代田区',
    line1: '丸の内1-9-1',
  },
  {
    cityId: 'jp-yokohama',
    postalCode: '220-0011',
    prefecture: '神奈川県',
    city: '横浜市西区',
    line1: '高島2-19-12',
  },
  {
    cityId: 'jp-osaka',
    postalCode: '530-0001',
    prefecture: '大阪府',
    city: '大阪市北区',
    line1: '梅田3-1-3',
  },
  {
    cityId: 'jp-kyoto',
    postalCode: '600-8216',
    prefecture: '京都府',
    city: '京都市下京区',
    line1: '東塩小路町843-2',
  },
  {
    cityId: 'jp-nagoya',
    postalCode: '450-0002',
    prefecture: '愛知県',
    city: '名古屋市中村区',
    line1: '名駅1-1-4',
  },
  {
    cityId: 'jp-kobe',
    postalCode: '650-0011',
    prefecture: '兵庫県',
    city: '神戸市中央区',
    line1: '下山手通2-11-1',
  },
  {
    cityId: 'jp-fukuoka',
    postalCode: '812-0012',
    prefecture: '福岡県',
    city: '福岡市博多区',
    line1: '博多駅中央街1-1',
  },
  {
    cityId: 'jp-sapporo',
    postalCode: '060-0005',
    prefecture: '北海道',
    city: '札幌市中央区',
    line1: '北5条西2-5',
  },
  {
    cityId: 'jp-sendai',
    postalCode: '980-0021',
    prefecture: '宮城県',
    city: '仙台市青葉区',
    line1: '中央1-1-1',
  },
  {
    cityId: 'jp-hiroshima',
    postalCode: '730-0011',
    prefecture: '広島県',
    city: '広島市中区',
    line1: '基町6-27',
  },
  {
    cityId: 'jp-naha',
    postalCode: '900-0015',
    prefecture: '沖縄県',
    city: '那覇市',
    line1: '久茂地1-1-1',
  },
];

export function formatJpAddress(address: FillAddress): string {
  return `〒${address.postalCode} ${address.prefecture}${address.city}${address.line1}`;
}
