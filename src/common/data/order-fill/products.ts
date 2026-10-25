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
  {
    productCode: 'SP-SUNGLASS01',
    sku: 'RK-SG-UV400',
    brand: 'HIKARI',
    name: 'UVカットサングラス',
    price: 3_980,
    description: '偏光レンズ、ケース付き、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-HOODIE01',
    sku: 'RK-HD-GRY-L',
    brand: 'UNIQORA',
    name: '裏起毛パーカー',
    price: 4_980,
    description: 'ユニセックス、グレー、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-SLIPPER01',
    sku: 'RK-SLP-NV-M',
    brand: 'NEMURI',
    name: '室内スリッパ',
    price: 1_480,
    description: '洗える、静音ソール、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-BOWL01',
    sku: 'RK-BOWL-2P',
    brand: 'MUJIKE',
    name: 'どんぶり 2個セット',
    price: 1_980,
    description: '磁器、電子レンジ対応、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-MASK01',
    sku: 'RK-MASK-5P',
    brand: 'HADA LAB',
    name: '保湿フェイスマスク 5枚',
    price: 1_280,
    description: 'シートマスク、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-PACK01',
    sku: 'RK-PACK-BLK',
    brand: 'WALKNODE',
    name: 'デイパック 20L',
    price: 5_480,
    description: '撥水、PC収納、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-MOUSE01',
    sku: 'RK-MOUSE-WL',
    brand: 'SONIQ',
    name: 'ワイヤレスマウス',
    price: 1_980,
    description: '静音クリック、USB受信機、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-INCENSE01',
    sku: 'RK-INC-SBY',
    brand: 'KAORI',
    name: '白檀のお香',
    price: 880,
    description: 'スティック40本、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-CHOP01',
    sku: 'RK-CHOP-WD',
    brand: 'MUJIKE',
    name: '木製箸 2膳セット',
    price: 780,
    description: '天然木、食洗機対応、税込',
    imageUrl:
      'https://tshop.r10s.jp/hana2primitive/cabinet/kiju2023/b-9156x-top.jpg',
  },
  {
    productCode: 'SP-MUG01',
    sku: 'RK-MUG-350',
    brand: 'THERMOYA',
    name: '保温マグカップ 350ml',
    price: 2_280,
    description: '蓋付き、ステンレス、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-COAT01',
    sku: 'RK-COAT-BEG-L',
    brand: 'UNIQORA',
    name: 'チェスターコート',
    price: 12_800,
    description: 'ユニセックス、ベージュ、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-SHIRT01',
    sku: 'RK-SHIRT-BLU-M',
    brand: 'DENIMYA',
    name: 'オックスフォードシャツ',
    price: 3_980,
    description: '長袖、コットン混紡、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-DRESS01',
    sku: 'RK-DRESS-BLK-M',
    brand: 'UNIQORA',
    name: 'カジュアルワンピース',
    price: 4_980,
    description: 'シンプルなデザイン、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-SANDAL01',
    sku: 'RK-SANDAL-BRN-26',
    brand: 'WALKNODE',
    name: 'レザーサンダル',
    price: 5_480,
    description: '軽量ソール、デイリーユース、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-WALLET01',
    sku: 'RK-WALLET-BLK',
    brand: 'TOKII',
    name: '二つ折り財布',
    price: 3_280,
    description: 'コンパクト設計、カード収納付き、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-BELT01',
    sku: 'RK-BELT-BLK-100',
    brand: 'TOKII',
    name: '本革ベルト',
    price: 2_980,
    description: 'シンプルなバックル、長さ100cm、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1752386341161-de2b02ea1f50?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-BOTTLE01',
    sku: 'RK-BOTTLE-750',
    brand: 'THERMOYA',
    name: 'ステンレスボトル 750ml',
    price: 3_280,
    description: '保温・保冷対応、ワンタッチ開閉、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1523362628745-0c100150b8a3?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-SPEAKER01',
    sku: 'RK-SPK-BT-BK',
    brand: 'SONIQ',
    name: 'Bluetoothスピーカー',
    price: 4_980,
    description: 'コンパクト、防滴仕様、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-KEYBOARD01',
    sku: 'RK-KBD-WL-WHT',
    brand: 'SONIQ',
    name: 'ワイヤレスキーボード',
    price: 3_480,
    description: '薄型設計、静音キー、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-STAND01',
    sku: 'RK-STAND-PH',
    brand: 'SONIQ',
    name: 'スマートフォンスタンド',
    price: 1_280,
    description: '角度調整可能、折りたたみ式、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-POWER01',
    sku: 'RK-PBANK-10000',
    brand: 'SONIQ',
    name: 'モバイルバッテリー 10000mAh',
    price: 3_980,
    description: 'USB-C対応、コンパクト設計、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-ROUTER01',
    sku: 'RK-ROUTER-WIFI',
    brand: 'SONIQ',
    name: 'ポータブルWi-Fiルーター',
    price: 6_980,
    description: 'コンパクト設計、USB給電対応、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-CLOCK01',
    sku: 'RK-CLOCK-WHT',
    brand: 'TOKII',
    name: 'デジタル目覚まし時計',
    price: 2_480,
    description: 'LED表示、アラーム機能付き、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-PLANT01',
    sku: 'RK-PLANT-MINI',
    brand: 'MUJIKE',
    name: 'ミニ観葉植物',
    price: 1_680,
    description: '室内用、陶器鉢付き、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-VASE01',
    sku: 'RK-VASE-GLS',
    brand: 'MUJIKE',
    name: 'ガラスフラワーベース',
    price: 1_980,
    description: '透明ガラス製、シンプルデザイン、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-BLANKET01',
    sku: 'RK-BLANKET-GRY',
    brand: 'NEMURI',
    name: 'マイクロファイバー毛布',
    price: 2_980,
    description: '軽量、やわらかな肌触り、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-CUSHION01',
    sku: 'RK-CUSHION-BEG',
    brand: 'NEMURI',
    name: 'クッションカバー',
    price: 1_280,
    description: '45×45cm、洗濯可能、税込',
    imageUrl:
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-PLATE01',
    sku: 'RK-PLATE-2P',
    brand: 'MUJIKE',
    name: 'セラミックプレート 2枚セット',
    price: 1_780,
    description: '磁器製、電子レンジ対応、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-COFFEE01',
    sku: 'RK-COFFEE-200',
    brand: 'UJIKO',
    name: 'オリジナルコーヒー豆 200g',
    price: 1_580,
    description: '中煎り、豊かな香り、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&h=400',
  },
  {
    productCode: 'SP-HONEY01',
    sku: 'RK-HONEY-250',
    brand: 'UJIKO',
    name: '純粋はちみつ 250g',
    price: 1_280,
    description: '毎日の食卓におすすめ、税込',
    imageUrl:
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&h=400',
  },
];
