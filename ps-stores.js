const STORES = ["en-us", "en-gb", "es-ar", "en-ar", "en-au", "nl-be", "fr-be", "en-bh", "ar-bh", "pt-br", "en-br", "en-bg", "en-ca", "fr-ca", "zh-hans-cn", "es-cl", "en-cl", "en-co", "es-co", "es-cr", "en-hr", "en-cy", "en-cz", "da-dk", "en-dk", "de-de", "es-ec", "es-sv", "es-es", "en-fi", "fr-fr", "en-gr", "es-gt", "es-hn", "zh-hans-hk", "zh-hant-hk", "en-hk", "en-hu", "en-is", "en-in", "en-id", "en-ie", "en-il", "it-it", "ja-jp", "ko-kr", "en-kw", "ar-kw", "en-lb", "ar-lb", "fr-lu", "de-lu", "en-my", "en-mt", "es-mx", "en-mx", "nl-nl", "en-nz", "no-no", "en-no", "en-om", "ar-om", "de-at", "es-pa", "es-py", "en-pe", "es-pe", "en-pl", "pl-pl", "pt-pt", "en-qa", "ar-qa", "en-ro", "ru-ru", "en-sa", "ar-sa", "de-ch", "en-sg", "en-sk", "en-si", "en-za", "fr-ch", "fi-fi", "sv-se", "it-ch", "en-se", "zh-hant-tw", "en-tw", "en-th", "en-tr", "tr-tr", "ru-ua", "en-ae", "ar-ae"]
const STORES_MAP = [
  {
    "en-us": "United States - English"
  },
  {
    "en-gb": "United Kingdom - English"
  },
  {
    "es-ar": "Argentina - Español"
  },
  {
    "en-ar": "Argentina - English"
  },
  {
    "en-au": "Australia - English"
  },
  {
    "nl-be": "België - Nederlands"
  },
  {
    "fr-be": "Belgique - Français"
  },
  {
    "en-bh": "Bahrain - English"
  },
  {
    "ar-bh": "مملكة البحرين - العربية"
  },
  {
    "pt-br": "Brasil - Português"
  },
  {
    "en-br": "Brazil - English"
  },
  {
    "en-bg": "Bulgaria - English"
  },
  {
    "en-ca": "Canada - English"
  },
  {
    "fr-ca": "Canada - Français"
  },
  {
    "zh-hans-cn": "中国 - 中文"
  },
  {
    "es-cl": "Chile - Español"
  },
  {
    "en-cl": "Chile - English"
  },
  {
    "en-co": "Colombia - English"
  },
  {
    "es-co": "Colombia - Español"
  },
  {
    "es-cr": "Costa Rica - Español"
  },
  {
    "en-hr": "Croatia - English"
  },
  {
    "en-cy": "Cyprus - English"
  },
  {
    "en-cz": "Czech Republic - English"
  },
  {
    "da-dk": "Danmark - Dansk"
  },
  {
    "en-dk": "Denmark - English"
  },
  {
    "de-de": "Deutschland - Deutsch"
  },
  {
    "es-ec": "Ecuador - Español"
  },
  {
    "es-sv": "El Salvador - Español"
  },
  {
    "es-es": "España - Español"
  },
  {
    "en-fi": "Finland - English"
  },
  {
    "fr-fr": "France - Français"
  },
  {
    "en-gr": "Greece - English"
  },
  {
    "es-gt": "Guatemala - Español"
  },
  {
    "es-hn": "Honduras - Español"
  },
  {
    "zh-hans-hk": "香港 - 中文"
  },
  {
    "zh-hant-hk": "香港 - 繁体中文 (台灣)"
  },
  {
    "en-hk": "Hong Kong - English"
  },
  {
    "en-hu": "Hungary - English"
  },
  {
    "en-is": "Iceland - English"
  },
  {
    "en-in": "India - English"
  },
  {
    "en-id": "Indonesia - English"
  },
  {
    "en-ie": "Ireland - English"
  },
  {
    "en-il": "Israel - English"
  },
  {
    "it-it": "Italia - Italiano"
  },
  {
    "ja-jp": "日本 - 日本語"
  },
  {
    "ko-kr": "한국 - 한국어"
  },
  {
    "en-kw": "Kuwait - English"
  },
  {
    "ar-kw": "دولة الكويت - العربية"
  },
  {
    "en-lb": "Lebanon - English"
  },
  {
    "ar-lb": "الجمهورية اللبنانية - العربية"
  },
  {
    "fr-lu": "Luxembourg - Français"
  },
  {
    "de-lu": "Luxemburg - Deutsch"
  },
  {
    "en-my": "Malaysia - English"
  },
  {
    "en-mt": "Malta - English"
  },
  {
    "es-mx": "México - Español"
  },
  {
    "en-mx": "Mexico - English"
  },
  {
    "nl-nl": "Nederland - Nederlands"
  },
  {
    "en-nz": "New Zealand - English"
  },
  {
    "no-no": "Norge - Norsk"
  },
  {
    "en-no": "Norway - English"
  },
  {
    "en-om": "Oman - English"
  },
  {
    "ar-om": "سلطنة عُمان - العربية"
  },
  {
    "de-at": "Österreich - Deutsch"
  },
  {
    "es-pa": "Panama - Español"
  },
  {
    "es-py": "Paraguay - Español"
  },
  {
    "en-pe": "Peru - English"
  },
  {
    "es-pe": "Peru - Español"
  },
  {
    "en-pl": "Poland - English"
  },
  {
    "pl-pl": "Polska - Polski"
  },
  {
    "pt-pt": "Portugal - Português"
  },
  {
    "en-qa": "Qatar - English"
  },
  {
    "ar-qa": "دولة قطر - العربية"
  },
  {
    "en-ro": "Romania - English"
  },
  {
    "ru-ru": "Россия - Русский"
  },
  {
    "en-sa": "Saudi Arabia - English"
  },
  {
    "ar-sa": "المملكة العربية السعودية - العربية"
  },
  {
    "de-ch": "Schweiz - Deutsch"
  },
  {
    "en-sg": "Singapore - English"
  },
  {
    "en-sk": "Slovakia - English"
  },
  {
    "en-si": "Slovenia - English"
  },
  {
    "en-za": "South Africa - English"
  },
  {
    "fr-ch": "Suisse - Français"
  },
  {
    "fi-fi": "Suomi - Suomi"
  },
  {
    "sv-se": "Sverige - Svenska"
  },
  {
    "it-ch": "Svizzera - Italiano"
  },
  {
    "en-se": "Sweden - English"
  },
  {
    "zh-hant-tw": "台灣 - 繁體中文"
  },
  {
    "en-tw": "Taiwan - English"
  },
  {
    "en-th": "Thailand - English"
  },
  {
    "en-tr": "Turkey - English"
  },
  {
    "tr-tr": "Türkiye - Türkçe"
  },
  {
    "ru-ua": "Украина - Pусский"
  },
  {
    "en-ae": "United Arab Emirates - English"
  },
  {
    "ar-ae": "الإمارات العربية المتحدة - العربية"
  }
];
