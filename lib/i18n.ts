export type Locale = "en" | "fi" | "zh";

export const LOCALES: Locale[] = ["en", "fi", "zh"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fi: "FI",
  zh: "中文",
};

export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  fi: "fi",
  zh: "zh-CN",
};

export function isValidLocale(s: string): s is Locale {
  return LOCALES.includes(s as Locale);
}

const dict = {
  en: {
    bestPlaces: "Best Places",
    subtitle: (city: string) => `The best spots in ${city}, updated daily`,
    tabs: { cafe: "Cafés", bar: "Bars", restaurant: "Restaurants", curated: "People Love", hiddenGems: "Hidden Gems" },
    sections: {
      cafe:       { title: (c: string) => `Top Cafés in ${c}`,       sub: "Highest rated cafés" },
      bar:        { title: (c: string) => `Top Bars in ${c}`,        sub: "Highest rated bars" },
      restaurant: { title: (c: string) => `Top Restaurants in ${c}`, sub: "Highest rated restaurants" },
      curated:    { title: (c: string) => `People Love · ${c}`,      sub: "The best spots across all types — quality, vibe & uniqueness" },
      hiddenGems: { title: (c: string) => `Hidden Gems · ${c}`,      sub: "Under-the-radar spots locals keep to themselves" },
    },
    backBy: "Back by",
    tomorrow: "tomorrow",
    noList: "No curated list yet",
    checkTomorrow: "Our picks are updated daily. Check back tomorrow.",
    loading: "Loading…",
    errorPlace: "Failed to load places",
    errorCurated: "Failed to load curated list",
    skipToContent: "Skip to content",
    reviewsLabel: "reviews",
    rankAriaLabel: (n: number) => `Ranked ${n}`,
    ratingAriaLabel: (r: string) => `Rated ${r} out of 5`,
    loadingPlaces: "Loading places",
    loadingWeather: "Loading weather…",
    tags: { hiddenGem: "Hidden Gem", localFavorite: "Local Favorite", mustVisit: "Must Visit" },
    hours: {
      openNow: "Open now",
      closedNow: "Closed now",
      unknownStatus: "Hours unknown",
      noInfo: "No hours info",
      specialUpcoming: (dates: string) => `Special hours: ${dates}`,
      showWeekly: "Show weekly hours",
      hideWeekly: "Hide weekly hours",
    },
    typeMap: {
      cafe: "Café", coffee_shop: "Coffee", bar: "Bar", restaurant: "Restaurant",
      sauna: "Sauna", bakery: "Bakery", brewery: "Brewery", wine_bar: "Wine Bar",
      night_club: "Club", pub: "Pub", cocktail_bar: "Cocktail Bar",
      hamburger_restaurant: "Burgers", pizza_restaurant: "Pizza",
      vietnamese_restaurant: "Vietnamese", seafood_restaurant: "Seafood",
      sushi_restaurant: "Sushi", ramen_restaurant: "Ramen",
      chinese_restaurant: "Chinese", japanese_restaurant: "Japanese",
      indian_restaurant: "Indian", thai_restaurant: "Thai",
      mexican_restaurant: "Mexican", italian_restaurant: "Italian",
      korean_restaurant: "Korean", museum: "Museum",
    },
  },

  fi: {
    bestPlaces: "Parhaat Paikat",
    subtitle: (city: string) => `Parhaat paikat – ${city}, päivitetään päivittäin`,
    tabs: { cafe: "Kahvilat", bar: "Baarit", restaurant: "Ravintolat", curated: "Suosikit", hiddenGems: "Piilokohde" },
    sections: {
      cafe:       { title: (c: string) => `Parhaat kahvilat – ${c}`,    sub: "Korkeimmin arvioidut kahvilat" },
      bar:        { title: (c: string) => `Parhaat baarit – ${c}`,      sub: "Korkeimmin arvioidut baarit" },
      restaurant: { title: (c: string) => `Parhaat ravintolat – ${c}`,  sub: "Korkeimmin arvioidut ravintolat" },
      curated:    { title: (c: string) => `Suosikit · ${c}`,            sub: "Parhaat paikat joka kategoriasta – laatu, tunnelma & persoonallisuus" },
      hiddenGems: { title: (c: string) => `Piilokohde · ${c}`,          sub: "Paikallisten salaisuudet — vähemmän tunnetut, mutta huikeat paikat" },
    },
    backBy: "Palaa ennen",
    tomorrow: "huomenna",
    noList: "Ei listaa vielä",
    checkTomorrow: "Valintamme päivitetään päivittäin. Tule huomenna uudelleen.",
    loading: "Ladataan…",
    errorPlace: "Paikkojen lataus epäonnistui",
    errorCurated: "Listan lataus epäonnistui",
    skipToContent: "Siirry sisältöön",
    reviewsLabel: "arvostelua",
    rankAriaLabel: (n: number) => `Sija ${n}`,
    ratingAriaLabel: (r: string) => `Arvosana ${r} / 5`,
    loadingPlaces: "Ladataan paikkoja",
    loadingWeather: "Haetaan säätietoja…",
    tags: { hiddenGem: "Piilokohde", localFavorite: "Paikallinen suosikki", mustVisit: "Ehdoton käynti" },
    hours: {
      openNow: "Auki nyt",
      closedNow: "Kiinni nyt",
      unknownStatus: "Aukioloajat tuntematon",
      noInfo: "Aukioloajat puuttuvat",
      specialUpcoming: (dates: string) => `Erikoisaukioloajat: ${dates}`,
      showWeekly: "Näytä viikkoaikataulu",
      hideWeekly: "Piilota viikkoaikataulu",
    },
    typeMap: {
      cafe: "Kahvila", coffee_shop: "Kahvi", bar: "Baari", restaurant: "Ravintola",
      sauna: "Sauna", bakery: "Leipomo", brewery: "Panimo", wine_bar: "Viinibaari",
      night_club: "Klubi", pub: "Pub", cocktail_bar: "Cocktailbaari",
      hamburger_restaurant: "Hampurilaiset", pizza_restaurant: "Pizza",
      vietnamese_restaurant: "Vietnamilainen", seafood_restaurant: "Mereneläväravintola",
      sushi_restaurant: "Sushi", ramen_restaurant: "Ramen",
      chinese_restaurant: "Kiinalainen", japanese_restaurant: "Japanilainen",
      indian_restaurant: "Intialainen", thai_restaurant: "Thaimaalainen",
      mexican_restaurant: "Meksikolainen", italian_restaurant: "Italialainen",
      korean_restaurant: "Korealainen", museum: "Museo",
    },
  },

  zh: {
    bestPlaces: "最佳地点",
    subtitle: (city: string) => `${city}精选好去处，每日更新`,
    tabs: { cafe: "咖啡馆", bar: "酒吧", restaurant: "餐厅", curated: "大家都爱", hiddenGems: "小众宝藏" },
    sections: {
      cafe:       { title: (c: string) => `${c}最佳咖啡馆`,   sub: "评分最高的咖啡馆" },
      bar:        { title: (c: string) => `${c}最佳酒吧`,     sub: "评分最高的酒吧" },
      restaurant: { title: (c: string) => `${c}最佳餐厅`,     sub: "评分最高的餐厅" },
      curated:    { title: (c: string) => `大家都爱 · ${c}`,  sub: "跨品类精选 — 品质、氛围与特色兼具" },
      hiddenGems: { title: (c: string) => `小众宝藏 · ${c}`,  sub: "本地人私藏的低调好去处" },
    },
    backBy: "回机场时间",
    tomorrow: "明天",
    noList: "暂无推荐列表",
    checkTomorrow: "我们的推荐每日更新，明天再来看看。",
    loading: "加载中…",
    errorPlace: "无法加载地点",
    errorCurated: "无法加载推荐列表",
    skipToContent: "跳至内容",
    reviewsLabel: "条评价",
    rankAriaLabel: (n: number) => `排名第${n}`,
    ratingAriaLabel: (r: string) => `评分${r}/5`,
    loadingPlaces: "加载地点中",
    loadingWeather: "正在加载天气…",
    tags: { hiddenGem: "小众宝藏", localFavorite: "本地最爱", mustVisit: "必去之地" },
    hours: {
      openNow: "营业中",
      closedNow: "已打烊",
      unknownStatus: "营业时间未知",
      noInfo: "暂无营业时间",
      specialUpcoming: (dates: string) => `近期特殊营业：${dates}`,
      showWeekly: "查看全周时间",
      hideWeekly: "收起",
    },
    typeMap: {
      cafe: "咖啡馆", coffee_shop: "咖啡", bar: "酒吧", restaurant: "餐厅",
      sauna: "桑拿", bakery: "面包店", brewery: "酿酒厂", wine_bar: "葡萄酒吧",
      night_club: "夜店", pub: "酒馆", cocktail_bar: "鸡尾酒吧",
      hamburger_restaurant: "汉堡", pizza_restaurant: "披萨",
      vietnamese_restaurant: "越南菜", seafood_restaurant: "海鲜",
      sushi_restaurant: "寿司", ramen_restaurant: "拉面",
      chinese_restaurant: "中餐", japanese_restaurant: "日料",
      indian_restaurant: "印度菜", thai_restaurant: "泰国菜",
      mexican_restaurant: "墨西哥菜", italian_restaurant: "意大利菜",
      korean_restaurant: "韩餐", museum: "博物馆",
    },
  },
} as const;

export type T = typeof dict.en;

export function getT(locale: Locale): T {
  return dict[locale] as unknown as T;
}

export const WMO_LABELS: Record<Locale, Record<number, string>> = {
  en: {
    0: "Clear sky",
    1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Icy fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow",
    77: "Snow grains",
    80: "Showers", 81: "Rain showers", 82: "Heavy showers",
    85: "Snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
  },
  fi: {
    0: "Selkeää",
    1: "Pääosin selkeää", 2: "Puolipilvistä", 3: "Pilvistä",
    45: "Sumua", 48: "Jäistä sumua",
    51: "Kevyttä tihkua", 53: "Tihkusadetta", 55: "Rankka tihkusade",
    61: "Kevyttä sadetta", 63: "Sadetta", 65: "Rankkaa sadetta",
    71: "Kevyttä lumisadetta", 73: "Lumisadetta", 75: "Rankkaa lumisadetta",
    77: "Lumirakeita",
    80: "Kuuroja", 81: "Sadekuuroja", 82: "Rankkoja sadekuuroja",
    85: "Lumikuuroja", 86: "Rankkoja lumikuuroja",
    95: "Ukkosta", 96: "Ukkosta ja raekuuroja", 99: "Ukkosta ja rankkoja raekuuroja",
  },
  zh: {
    0: "晴天",
    1: "晴间多云", 2: "局部多云", 3: "阴天",
    45: "大雾", 48: "冻雾",
    51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨",
    61: "小雨", 63: "中雨", 65: "大雨",
    71: "小雪", 73: "中雪", 75: "大雪",
    77: "雪粒",
    80: "阵雨", 81: "中阵雨", 82: "暴阵雨",
    85: "阵雪", 86: "大阵雪",
    95: "雷暴", 96: "雷暴伴冰雹", 99: "雷暴伴大冰雹",
  },
};
