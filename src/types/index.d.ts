type Config = {
  /**
   * Donation Tracker URL
   * @example "https://tracker.rtain.jp"
   */
  trackerUrl: string;
  /** Donation Tracker ログインユーザ名 */
  username: string;
  /** Donation Tracker ログインパスワード */
  password: string;
  /** 監視対象のイベントID */
  eventId: number;
  /** チェック間隔(秒) */
  checkInterval: number;
  /**
   * 匿名ユーザーを表す名称
   * @example "(匿名)"
   */
  anonymousName: string;
};

type V1SearchAllComment = {
  /** @example 'tracker.donation' */
  model: string;
  pk: number;
  fields: {
    donor: number;
    event: number;
    domain: 'PAYPAL';
    transactionstate: 'COMPLETED';
    readstate: 'PENDING';
    commentstate: 'PENDING';
    amount: number;
    currency: 'JPY';
    /** @example '2021-12-29T15:42:29.238Z' */
    timereceived: string;
    comment: string;
    commentlanguage: 'un';
    pinned: boolean;
    /** @example 'https://tracker.rtain.jp/donation/7709' */
    canonical_url: string;
    public: string;
    /** @example 'ぱすた' */
    donor__alias: string;
    donor__alias_num: number;
    donor__visibility: 'ALIAS';
    /** @example 'https://tracker.rtain.jp/donor/3660' */
    donor__canonical_url: string;
    /** @example 'ぱすた' */
    donor__public: string;
  };
};
