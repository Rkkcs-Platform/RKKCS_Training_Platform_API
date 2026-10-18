export interface FillProductCatalogItem {
  productCode: string;
  sku: string;
  brand: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}

/** Japanese e-commerce catalog (JPY, 税込). productCode kept stable for existing shops. */
export const FILL_PRODUCTS: FillProductCatalogItem[] = [
  {
    productCode: 'SP-TEE01',
    sku: 'RK-TEE-WHT-M',
    brand: 'UNIQORA',
    name: 'コットンクルーネックTシャツ',
    price: 2_980,
    description: 'ユニセックス、綿100%、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-SHOE01',
    sku: 'RK-SHOE-WHT-27',
    brand: 'WALKNODE',
    name: 'ホワイトスニーカー',
    price: 8_980,
    description: 'デイリーユースのローカット、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-BAG01',
    sku: 'RK-BAG-CNV-BE',
    brand: 'MUJIKE',
    name: 'キャンバストートバッグ',
    price: 3_480,
    description: 'A4サイズ対応、肩掛けトート、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-WATCH01',
    sku: 'RK-WATCH-LTH-BK',
    brand: 'TOKII',
    name: 'レザーバンド腕時計',
    price: 12_800,
    description: 'アナログ、本革ベルト、税込',
    imageUrl:
      'https://ringodou.shop/cdn/shop/files/202409sasi-top.jpg?v=1771300147',
  },
  {
    productCode: 'SP-HEAD01',
    sku: 'RK-HEAD-BT-BK',
    brand: 'SONIQ',
    name: 'ワイヤレスイヤホン',
    price: 6_980,
    description: 'Bluetooth、再生時間24時間、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-CUP01',
    sku: 'RK-BOTTLE-500',
    brand: 'THERMOYA',
    name: 'ステンレス水筒 500ml',
    price: 2_480,
    description: '保温・保冷約8時間、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-SKIN01',
    sku: 'RK-SERUM-30',
    brand: 'HADA LAB',
    name: '保湿美容液 30ml',
    price: 4_180,
    description: '乾燥肌向けセラム、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-BOOK01',
    sku: 'RK-NOTE-A5',
    brand: 'MIDORIYA',
    name: 'A5レザーノート',
    price: 1_280,
    description: 'ドット方眼 160ページ、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-LAMP01',
    sku: 'RK-LAMP-LED',
    brand: 'MUJIKE',
    name: 'LEDデスクライト',
    price: 3_980,
    description: '3段階調光、USB給電、税込',
    imageUrl:
      'https://cdn.sanwadirect.jp/images/goods/800-LED082W_MX.JPG',
  },
  {
    productCode: 'SP-PILLOW01',
    sku: 'RK-PILLOW-MEM',
    brand: 'NEMURI',
    name: '低反発枕',
    price: 3_280,
    description: 'メモリーフォーム枕、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-PANTS01',
    sku: 'RK-JEAN-SLIM-32',
    brand: 'DENIMYA',
    name: 'スリムフィットジーンズ',
    price: 5_980,
    description: 'ストレッチデニム、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-HAT01',
    sku: 'RK-HAT-BKT-KH',
    brand: 'UNIQORA',
    name: 'バケットハット',
    price: 1_980,
    description: 'ユニセックス、カーキ、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1560774358-d727658f457c?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-SOCK01',
    sku: 'RK-SOCK-5P',
    brand: 'MUJIKE',
    name: 'クルーソックス 5足セット',
    price: 980,
    description: '綿混ショートソックス、税込',
    imageUrl:
      'https://item-shopping.c.yimg.jp/i/n/stream-twin_tx6209set',
  },
  {
    productCode: 'SP-KEY01',
    sku: 'RK-KEY-ENM',
    brand: 'OMIYAGE',
    name: 'エナメルキーホルダー',
    price: 680,
    description: '金属製チャーム、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-TOWEL01',
    sku: 'RK-TOWEL-BAM',
    brand: 'NEMURI',
    name: '竹繊維バスタオル',
    price: 1_680,
    description: '70×140cm、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-CANDLE01',
    sku: 'RK-CANDLE-VN',
    brand: 'KAORI',
    name: 'バニラ香りのキャンドル',
    price: 1_480,
    description: 'ソイワックス、税込',
    imageUrl:
      'https://www.bathandbodyworks.vn/dw/image/v2/BLFZ_PRD/on/demandware.static/-/Sites-bbw-master-catalog/default/dwe26b535a/hires/28005589.jpg?sw=350&sh=600&sm=fit',
  },
  {
    productCode: 'SP-CHARGER01',
    sku: 'RK-CHG-30W',
    brand: 'SONIQ',
    name: 'USB-C急速充電器 30W',
    price: 2_980,
    description: 'PD 30W対応、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-CASE01',
    sku: 'RK-CASE-SLC',
    brand: 'SONIQ',
    name: 'スマートフォンケース',
    price: 1_280,
    description: '耐衝撃シリコン、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-UMBRELLA01',
    sku: 'RK-UMB-UV',
    brand: 'AMEFURI',
    name: '折りたたみ日傘',
    price: 2_280,
    description: 'UVカット、3段折り、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1505483531331-fc3cf89fd382?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-TEA01',
    sku: 'RK-TEA-MTC-50',
    brand: 'UJIKO',
    name: '抹茶 50g 缶',
    price: 2_480,
    description: '石臼挽き抹茶、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=400&h=400',
  },
];
