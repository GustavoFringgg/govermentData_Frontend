export interface Tender {
  id: number;
  agency_name: string;
  tender_name: string;
  tender_mode: string;
  procurement_nature: string;
  announcement_date: string;
  deadline: string;
  budget: string;
}

export interface Cached {
  data: Tender[];
  last_updated: string;
}
