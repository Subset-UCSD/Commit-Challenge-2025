export type Section =
  | "arts"
  | "automobiles"
  | "books/review"
  | "business"
  | "fashion"
  | "food"
  | "health"
  | "home"
  | "insider"
  | "magazine"
  | "movies"
  | "nyregion"
  | "obituaries"
  | "opinion"
  | "politics"
  | "realestate"
  | "science"
  | "sports"
  | "sundayreview"
  | "technology"
  | "theater"
  | "t-magazine"
  | "travel"
  | "upshot"
  | "us"
  | "world";

export type Article = {
  section: string;
  subsection: string;
  title: string;
  abstract: string;
  url: string;
  uri: string;
  byline: string;
  item_type: string;
  updated_date: string;
  created_date: string;
  published_date: string;
  material_type_facet: string;
  kicker: string;
  des_facet: string[];
  org_facet: string[];
  per_facet: string[];
  geo_facet: string[];
  multimedia: {
    url: string;
    format: string;
    height: number;
    width: number;
    type: string;
    subtype: string;
    caption: string;
    copyright: string;
  }[];
  short_url: string;
};

export type TopStoriesResponse = {
  status: string;
  copyright: string;
  section: string;
  last_updated: string;
  num_results: number;
  results: Article[];
};

/** https://developer.nytimes.com/docs/top-stories-product/1/routes/%7Bsection%7D.json/get */
export function getTopStories(
  section: Section = "home"
): Promise<TopStoriesResponse> {
  return fetch(
    `https://api.nytimes.com/svc/topstories/v2/${section}.json?${new URLSearchParams(
      {
        "api-key": process.env.NYT_API_KEY ?? "",
      }
    )}`
  ).then(async (r) => r.ok ? r.json() : new Error(`HTTP ${r.status} error:\n${await r.text()}`));
}
