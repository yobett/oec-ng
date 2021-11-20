import { Quote } from './quote';
import { Ccy } from './ccy';

export interface CcyListingItem {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  date_added: string;
  tags: string[];
  cmc_rank: number;
  max_supply: number;
  circulating_supply: number;
  total_supply: number;

  // USD
  quote: Quote;

  ccy?: Ccy;
}

export interface ListingOptions {
  // convert?: string;
  sort?: string;
  sort_dir?: string;
  // aux?: string;
}
