export interface FillCarrier {
  name: string;
  depot: string;
  currentCityId: string;
}

export const FILL_CARRIERS: FillCarrier[] = [
  {
    name: 'ヤマト運輸',
    depot: '東京ベース店',
    currentCityId: 'jp-tokyo',
  },
  {
    name: '佐川急便',
    depot: '大阪営業所',
    currentCityId: 'jp-osaka',
  },
  {
    name: '日本郵便',
    depot: '渋谷郵便局',
    currentCityId: 'jp-shibuya',
  },
];

export const FILL_PAYMENT_METHODS = [
  'クレジットカード',
  'コンビニ払い',
  '代金引換',
  '銀行振込',
] as const;

export const JP_SHIPMENT_NOTES: Record<string, string> = {
  pending: '集荷の受付が完了しました',
  in_transit: '輸送中です。到着予定を確認してください',
  delivered: '配達が完了しました',
  created: '荷物を受け付けました',
};
