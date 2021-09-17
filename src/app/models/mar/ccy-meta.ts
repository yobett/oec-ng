//{
//       "id": 1,
//       "name": "Bitcoin",
//       "symbol": "BTC",
//       "category": "coin",
//       "description": "Bitcoin (BTC) is a cryptocurrency ...",
//       "slug": "bitcoin",
//       "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
//       "subreddit": "bitcoin",
//       "notice": "",
//       "tags": [
//         "mineable",
//       ],
//       "tag-names": [
//         "Mineable",
//       ],
//       "tag-groups": [
//         "OTHER",
//       ],
//       "urls": {
//         "website": [
//           "https://bitcoin.org/"
//         ],
//         "twitter": [],
//         "message_board": [
//           "https://bitcointalk.org"
//         ],
//         "chat": [],
//         "explorer": [
//           "https://blockchain.coinmarketcap.com/chain/bitcoin",
//           "https://blockchain.info/",
//           "https://live.blockcypher.com/btc/",
//           "https://blockchair.com/bitcoin",
//           "https://explorer.viabtc.com/btc"
//         ],
//         "reddit": [
//           "https://reddit.com/r/bitcoin"
//         ],
//         "technical_doc": [
//           "https://bitcoin.org/bitcoin.pdf"
//         ],
//         "source_code": [
//           "https://github.com/bitcoin/"
//         ],
//         "announcement": []
//       },
//       "platform": null,
//       "date_added": "2013-04-28T00:00:00.000Z",
//       "twitter_username": "",
//       "is_hidden": 0
//     }
export interface CcyMeta {
  name: string;
  symbol: string;
  category: string;
  description: string;
  slug: string;
  logo: string;
  subreddit: string;
  notice: string;
  'tag-names': string;
  urls: CcyMetaUrls;
}

export interface CcyMetaUrls {
  website: string[];
  twitter: string[];
  message_board: string[];
  chat: string[];
  explorer: string[];
  reddit: string[];
  technical_doc: string[];
  source_code: string[];
  announcement: string[];
}
