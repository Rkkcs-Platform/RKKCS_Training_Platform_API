/**
 * Lightweight i18n for API error/success messages.
 *
 * Design constraints (zero-impact):
 *  - No new npm packages
 *  - No module / DI changes
 *  - No change to response shapes — only the *text* inside `message` fields changes
 *  - Existing English strings remain the default fallback
 */

export type ApiLocale = 'vi' | 'en' | 'ja';

const translations: Record<string, Record<ApiLocale, string>> = {
  // ── Auth ──────────────────────────────────────────────────────────────
  'auth.email_already_registered': {
    en: 'Email already registered',
    vi: 'Email đã được đăng ký',
    ja: 'メールアドレスは既に登録されています',
  },
  'auth.staff_code_already_registered': {
    en: 'Staff code already registered',
    vi: 'Mã nhân viên đã được đăng ký',
    ja: 'スタッフコードは既に登録されています',
  },
  'auth.invalid_credentials': {
    en: 'Invalid email or password',
    vi: 'Email hoặc mật khẩu không đúng',
    ja: 'メールアドレスまたはパスワードが正しくありません',
  },
  'auth.account_inactive': {
    en: 'Account is inactive',
    vi: 'Tài khoản không hoạt động',
    ja: 'アカウントが無効です',
  },
  'auth.user_not_found': {
    en: 'User not found',
    vi: 'Không tìm thấy người dùng',
    ja: 'ユーザーが見つかりません',
  },
  'auth.current_password_incorrect': {
    en: 'Current password is incorrect',
    vi: 'Mật khẩu hiện tại không đúng',
    ja: '現在のパスワードが正しくありません',
  },
  'auth.new_password_same': {
    en: 'New password must be different from current password',
    vi: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    ja: '新しいパスワードは現在のパスワードと異なる必要があります',
  },
  'auth.password_changed': {
    en: 'Password changed successfully',
    vi: 'Đổi mật khẩu thành công',
    ja: 'パスワードが変更されました',
  },
  'auth.logged_out': {
    en: 'Logged out successfully',
    vi: 'Đăng xuất thành công',
    ja: 'ログアウトしました',
  },
  'auth.invalid_refresh_token': {
    en: 'Invalid or expired refresh token',
    vi: 'Token làm mới không hợp lệ hoặc đã hết hạn',
    ja: 'リフレッシュトークンが無効または期限切れです',
  },
  'auth.invalid_or_inactive': {
    en: 'Invalid or inactive account',
    vi: 'Tài khoản không hợp lệ hoặc không hoạt động',
    ja: '無効または非アクティブなアカウントです',
  },

  // ── Submissions ───────────────────────────────────────────────────────
  'submission.batch_completed': {
    en: "Today's batch is already completed",
    vi: 'Batch hôm nay đã hoàn thành',
    ja: '本日のバッチは既に完了しています',
  },
  'submission.all_codes_submitted': {
    en: 'All codes have already been submitted',
    vi: 'Tất cả mã đã được gửi',
    ja: 'すべてのコードは既に送信されています',
  },
  'submission.not_found_today': {
    en: 'No submission found for today',
    vi: 'Không tìm thấy bài nộp cho hôm nay',
    ja: '本日の送信が見つかりません',
  },
  'submission.not_found': {
    en: 'Submission not found',
    vi: 'Không tìm thấy bài nộp',
    ja: '送信が見つかりません',
  },
  'submission.invalid_id': {
    en: 'Invalid submission ID',
    vi: 'ID bài nộp không hợp lệ',
    ja: '送信IDが無効です',
  },

  // ── Common / Validation ───────────────────────────────────────────────
  'common.invalid_date': {
    en: 'Invalid date format. Use YYYY-MM-DD',
    vi: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
    ja: '日付形式が無効です。YYYY-MM-DDを使用してください',
  },
  'common.invalid_id': {
    en: 'Invalid ID',
    vi: 'ID không hợp lệ',
    ja: 'IDが無効です',
  },

  // ── Shops ─────────────────────────────────────────────────────────────
  'shop.not_found': {
    en: 'Shop not found',
    vi: 'Không tìm thấy shop',
    ja: 'ショップが見つかりません',
  },
  'shop.invalid_id': {
    en: 'Invalid shop ID',
    vi: 'ID shop không hợp lệ',
    ja: 'ショップIDが無効です',
  },
  'shop.invalid_owner_id': {
    en: 'Invalid owner ID',
    vi: 'ID chủ shop không hợp lệ',
    ja: 'オーナーIDが無効です',
  },
  'shop.owner_not_found': {
    en: 'Owner user not found',
    vi: 'Không tìm thấy người dùng chủ shop',
    ja: 'オーナーユーザーが見つかりません',
  },
  'shop.owner_must_be_user': {
    en: 'Shop owner must have role user',
    vi: 'Chủ shop phải có vai trò user',
    ja: 'ショップオーナーはuserロールが必要です',
  },
  'shop.only_user_role': {
    en: 'Only role user can own a shop',
    vi: 'Chỉ vai trò user mới có thể sở hữu shop',
    ja: 'userロールのみがショップを所有できます',
  },
  'shop.only_user_assigned': {
    en: 'Only role user can be assigned to a shop',
    vi: 'Chỉ vai trò user mới được gán vào shop',
    ja: 'userロールのみがショップに割り当てられます',
  },
  'shop.user_not_found': {
    en: 'User not found',
    vi: 'Không tìm thấy người dùng',
    ja: 'ユーザーが見つかりません',
  },
  'shop.invalid_user_id': {
    en: 'Invalid user ID',
    vi: 'ID người dùng không hợp lệ',
    ja: 'ユーザーIDが無効です',
  },
  'shop.owner_belongs_to_another': {
    en: 'Owner already belongs to another shop',
    vi: 'Chủ shop đã thuộc về shop khác',
    ja: 'オーナーは既に別のショップに所属しています',
  },
  'shop.default_not_found': {
    en: 'Default shop not found',
    vi: 'Không tìm thấy shop mặc định',
    ja: 'デフォルトショップが見つかりません',
  },
  'shop.only_owner_update': {
    en: 'Only shop owner can update shop settings',
    vi: 'Chỉ chủ shop mới có thể cập nhật cài đặt shop',
    ja: 'ショップオーナーのみがショップ設定を更新できます',
  },

  // ── Orders ────────────────────────────────────────────────────────────
  'order.invalid_id': {
    en: 'Invalid order ID',
    vi: 'ID đơn hàng không hợp lệ',
    ja: '注文IDが無効です',
  },
  'order.not_found': {
    en: 'Order not found',
    vi: 'Không tìm thấy đơn hàng',
    ja: '注文が見つかりません',
  },
  'order.must_have_products': {
    en: 'Order must have at least one product',
    vi: 'Đơn hàng phải có ít nhất một sản phẩm',
    ja: '注文には少なくとも1つの商品が必要です',
  },

  // ── Customers ─────────────────────────────────────────────────────────
  'customer.not_found': {
    en: 'Customer not found',
    vi: 'Không tìm thấy khách hàng',
    ja: '顧客が見つかりません',
  },
  'customer.invalid_id': {
    en: 'Invalid customer ID',
    vi: 'ID khách hàng không hợp lệ',
    ja: '顧客IDが無効です',
  },

  // ── Payments ──────────────────────────────────────────────────────────
  'payment.not_found': {
    en: 'Payment not found',
    vi: 'Không tìm thấy thanh toán',
    ja: '支払いが見つかりません',
  },
  'payment.invalid_id': {
    en: 'Invalid payment ID',
    vi: 'ID thanh toán không hợp lệ',
    ja: '支払いIDが無効です',
  },

  // ── Shipments ─────────────────────────────────────────────────────────
  'shipment.not_found': {
    en: 'Shipment not found',
    vi: 'Không tìm thấy vận đơn',
    ja: '出荷が見つかりません',
  },
  'shipment.invalid_id': {
    en: 'Invalid shipment ID',
    vi: 'ID vận đơn không hợp lệ',
    ja: '出荷IDが無効です',
  },

  // ── Challenges ────────────────────────────────────────────────────────
  'challenge.not_found': {
    en: 'Challenge not found for this date',
    vi: 'Không tìm thấy challenge cho ngày này',
    ja: 'この日のチャレンジが見つかりません',
  },
  'challenge.not_active': {
    en: 'Challenge is not active',
    vi: 'Challenge không hoạt động',
    ja: 'チャレンジはアクティブではありません',
  },
  'challenge.already_exists': {
    en: 'Challenge already exists for this date',
    vi: 'Challenge đã tồn tại cho ngày này',
    ja: 'この日のチャレンジは既に存在します',
  },
  'challenge.invalid_id': {
    en: 'Invalid challenge ID',
    vi: 'ID challenge không hợp lệ',
    ja: 'チャレンジIDが無効です',
  },

  // ── News ──────────────────────────────────────────────────────────────
  'news.not_found': {
    en: 'News not found',
    vi: 'Không tìm thấy tin tức',
    ja: 'ニュースが見つかりません',
  },
  'news.invalid_id': {
    en: 'Invalid news ID',
    vi: 'ID tin tức không hợp lệ',
    ja: 'ニュースIDが無効です',
  },
  'news.slug_conflict': {
    en: 'Unable to generate unique slug',
    vi: 'Không thể tạo slug duy nhất',
    ja: '一意のスラッグを生成できません',
  },

  // ── Settings ──────────────────────────────────────────────────────────
  'settings.default_not_found': {
    en: 'Default challenge settings not found',
    vi: 'Không tìm thấy cài đặt challenge mặc định',
    ja: 'デフォルトのチャレンジ設定が見つかりません',
  },

  // ── Processing ────────────────────────────────────────────────────────
  'processing.job_not_found': {
    en: 'Processing job not found',
    vi: 'Không tìm thấy job xử lý',
    ja: '処理ジョブが見つかりません',
  },
};

/**
 * Parse `Accept-Language` header to determine locale.
 * Returns 'en' (default) if no match found.
 */
export function parseLocale(acceptLanguage?: string): ApiLocale {
  if (!acceptLanguage) return 'en';
  const lower = acceptLanguage.toLowerCase();
  if (lower.startsWith('vi')) return 'vi';
  if (lower.startsWith('ja')) return 'ja';
  return 'en';
}

/**
 * Get a translated message by key + locale.
 * Falls back to English, then to the key itself.
 */
export function t(key: string, locale: ApiLocale = 'en'): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[locale] ?? entry['en'] ?? key;
}

/**
 * Helper: resolve locale from a NestJS Request object.
 * Usage in service: `const locale = reqLocale(request);`
 */
export function reqLocale(
  request?: { headers?: Record<string, string | string[] | undefined> },
): ApiLocale {
  const raw = request?.headers?.['accept-language'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return parseLocale(value);
}
