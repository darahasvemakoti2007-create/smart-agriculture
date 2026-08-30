"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi" | "ta" | "te" | "bn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navbar & Common
    home: "Home",
    features: "Features",
    howItWorks: "How It Works",
    login: "Login",
    getStarted: "Get Started",
    // Hero
    heroTitle1: "Smart Farming.",
    heroTitle2: "Smarter Decisions.",
    heroHeadingPrefix: "Grow Smarter with ",
    heroSub: "AI-powered crop disease detection and personalized farm advisory for better agricultural decisions.",
    analyzeCrop: "Analyze Your Crop",
    exploreFeatures: "Explore Features",
    selectLanguage: "Language Translator:",
    // Trust
    trustedBy: "Trusted by progressive farmers worldwide",
    // Features
    featuresCatalog: "Features Catalog",
    featuresTitle: "Powering Smarter Farms",
    featuresSub: "Everything you need to optimize yield, save water, and prevent crop diseases.",
    diseaseTitle: "AI Crop Diagnosis",
    diseaseDesc: "Scan leaf photos to diagnose diseases instantly with expert treatment guides.",
    soilTitle: "Soil Telemetry",
    soilDesc: "Track Nitrogen, Phosphorus, Potassium, moisture, and pH values in real-time.",
    weatherTitle: "Microclimate Alerts",
    weatherDesc: "Stay ahead with rain probabilities, wind speed warnings, and frost advisories.",
    irrigationTitle: "Water-Saving Advice",
    irrigationDesc: "Obtain dynamic crop watering durations and early warning alarms.",
    exploreTool: "Explore Tool",
    // How it works
    workflow: "Workflow",
    howItWorksTitle: "How It Works",
    howItWorksSub: "Three simple steps to transition your farm to data-driven precision guidance.",
    step1Title: "1. Link Your Farm",
    step1Desc: "Register your farm boundaries, area details, and active crops.",
    step2Title: "2. Log Telemetry",
    step2Desc: "Submit local soil readings or snap photos of affected leaves.",
    step3Title: "3. Act on AI Insights",
    step3Desc: "Receive personalized NPK recommendations, alerts, and watering guides.",
    // CTA
    ctaTitle: "Ready to optimize your yield?",
    ctaSub: "Join thousands of farmers using AgriSync to secure crop health and conserve water.",
    startFree: "Start Smart Farming Free",
    soilIntelligence: "Soil Intelligence",
    npkOptimal: "NPK Optimal Balance",
    // Footer
    footerSub: "AI-powered agriculture for smarter farming.",
    copyright: "AgriSync. All rights reserved.",

    // Sidebar Nav Items
    navDashboard: "Dashboard",
    navMyFarm: "My Farm",
    navCrops: "Crops",
    navDisease: "Disease Detection",
    navWeather: "Weather",
    navSoil: "Soil Health",
    navFertilizer: "Fertilizer Advisor",
    navIrrigation: "Irrigation",
    navRecommendations: "Recommendations",
    navAlerts: "Alerts",
    navHistory: "History & Analytics",
    navCalendar: "AI Planting Calendar",
    signOut: "Sign Out",

    // Dashboard Headers & Cards
    dashboardTitle: "Farmer Dashboard",
    dashboardSub: "Monitor your farm and make smarter agricultural decisions.",
    myCrops: "My Crops",
    noCropsYet: "No crops registered yet",
    weather: "Weather",
    notAvailable: "Not Available",
    connectFarmLocation: "Connect farm location for local weather",
    soilMoisture: "Soil Moisture",
    noReadingsRecorded: "No readings recorded yet",
    activeAlerts: "Active Alerts",
    noCriticalIssues: "No critical issues detected",
    quickActions: "Quick Actions",
    fastAccessTools: "Fast access to core AgriSync tools",
    farmOverview: "Farm Overview",
    locationSizeSoil: "Location, size, soil profile, and irrigation structure",
  },
  hi: {
    // Navbar
    home: "होम",
    features: "विशेषताएं",
    howItWorks: "यह कैसे काम करता है",
    login: "लॉगिन",
    getStarted: "शुरू करें",
    // Hero
    heroTitle1: "स्मार्ट खेती।",
    heroTitle2: "बेहतर निर्णय।",
    heroHeadingPrefix: "स्मार्ट खेती करें ",
    heroSub: "बेहतर कृषि निर्णयों के लिए एआई-संचालित फसल रोग पहचान और व्यक्तिगत कृषि सलाह।",
    analyzeCrop: "फसल का विश्लेषण करें",
    exploreFeatures: "विशेषताएं देखें",
    selectLanguage: "भाषा अनुवादक:",
    // Trust
    trustedBy: "दुनिया भर के प्रगतिशील किसानों द्वारा विश्वसनीय",
    // Features
    featuresCatalog: "विशेषताएं कैटलॉग",
    featuresTitle: "स्मार्ट खेतों को सशक्त बनाना",
    featuresSub: "उपज बढ़ाने, पानी बचाने और फसल रोगों को रोकने के लिए आवश्यक सब कुछ।",
    diseaseTitle: "एआई फसल निदान",
    diseaseDesc: "विशेषज्ञ उपचार गाइडों के साथ तुरंत रोगों का निदान करने के लिए पत्तियों की तस्वीरें स्कैन करें।",
    soilTitle: "मिट्टी की टेलीमेट्री",
    soilDesc: "वास्तविक समय में नाइट्रोजन, फास्फोरस, पोटेशियम, नमी और पीएच मान को ट्रैक करें।",
    weatherTitle: "मौसम अलर्ट",
    weatherDesc: "बारिश की संभावनाओं, हवा की गति की चेतावनियों और पाले की सलाह के साथ आगे रहें।",
    irrigationTitle: "जल-बचत सलाह",
    irrigationDesc: "गतिशील फसल सिंचाई अवधि और प्रारंभिक चेतावनी अलार्म प्राप्त करें।",
    exploreTool: "टूल देखें",
    // How it works
    workflow: "कार्यप्रवाह",
    howItWorksTitle: "यह कैसे काम करता है",
    howItWorksSub: "अपने खेत को डेटा-संचालित परिशुद्धता मार्गदर्शन में बदलने के लिए तीन सरल चरण।",
    step1Title: "1. अपना खेत जोड़ें",
    step1Desc: "अपने खेत की सीमाएं, क्षेत्रफल और सक्रिय फसलें दर्ज करें।",
    step2Title: "2. डेटा दर्ज करें",
    step2Desc: "मिट्टी की रीडिंग जमा करें या प्रभावित पत्तियों की तस्वीरें लें।",
    step3Title: "3. एआई अंतर्दृष्टि पर कार्य करें",
    step3Desc: "व्यक्तिगत एनपीके सिफारिशें, अलर्ट और सिंचाई गाइड प्राप्त करें।",
    // CTA
    ctaTitle: "क्या आप अपनी उपज बढ़ाने के लिए तैयार हैं?",
    ctaSub: "फसल स्वास्थ्य को सुरक्षित करने और पानी बचाने के लिए AgriSync का उपयोग करने वाले हजारों किसानों में शामिल हों।",
    startFree: "स्मार्ट खेती मुफ्त शुरू करें",
    soilIntelligence: "मिट्टी बुद्धिमत्ता",
    npkOptimal: "एनपीके अनुकूलन संतुलन",
    // Footer
    footerSub: "स्मार्ट खेती के लिए एआई-संचालित कृषि।",
    copyright: "AgriSync. सभी अधिकार सुरक्षित।",

    // Sidebar Nav Items
    navDashboard: "डैशबोर्ड",
    navMyFarm: "मेरा खेत",
    navCrops: "फसलें",
    navDisease: "रोग पहचान",
    navWeather: "मौसम",
    navSoil: "मिट्टी का स्वास्थ्य",
    navFertilizer: "उर्वरक सलाहकार",
    navIrrigation: "सिंचाई",
    navRecommendations: "सिफारिशें",
    navAlerts: "अलर्ट",
    navHistory: "इतिहास और विश्लेषण",
    navCalendar: "एआई बुआई कैलेंडर",
    signOut: "साइन आउट",

    // Dashboard Headers & Cards
    dashboardTitle: "किसान डैशबोर्ड",
    dashboardSub: "अपने खेत की निगरानी करें और स्मार्ट कृषि निर्णय लें।",
    myCrops: "मेरी फसलें",
    noCropsYet: "अभी कोई फसल दर्ज नहीं",
    weather: "मौसम",
    notAvailable: "उपलब्ध नहीं",
    connectFarmLocation: "स्थानीय मौसम के लिए खेत का स्थान जोड़ें",
    soilMoisture: "मिट्टी की नमी",
    noReadingsRecorded: "अभी कोई रीडिंग दर्ज नहीं",
    activeAlerts: "सक्रिय अलर्ट",
    noCriticalIssues: "कोई गंभीर समस्या नहीं मिली",
    quickActions: "त्वरित कार्य",
    fastAccessTools: "AgriSync टूल तक त्वरित पहुँच",
    farmOverview: "खेत का अवलोकन",
    locationSizeSoil: "स्थान, आकार, मिट्टी और सिंचाई संरचना",
  },
  ta: {
    // Navbar
    home: "முகப்பு",
    features: "அம்சங்கள்",
    howItWorks: "செயல்முறை",
    login: "உள்நுழை",
    getStarted: "தொடங்கு",
    // Hero
    heroTitle1: "ஸ்மார்ட் விவசாயம்.",
    heroTitle2: "சிறந்த முடிவுகள்.",
    heroHeadingPrefix: "ஸ்மார்ட் விவசாயம் செய்யுங்கள் ",
    heroSub: "சிறந்த விவசாய முடிவுகளுக்கு ஏஐ-இயங்கும் பயிர் நோய் கண்டறிதல் மற்றும் தனிப்பயனாக்கப்பட்ட பண்ணை ஆலோசனை.",
    analyzeCrop: "பயிரை பகுப்பாய்வு செய்",
    exploreFeatures: "அம்சங்களை ஆராய்",
    selectLanguage: "மொழி பெயர்ப்பு:",
    // Trust
    trustedBy: "உலகளவில் முற்போக்கான விவசாயிகளால் நம்பப்படுகிறது",
    // Features
    featuresCatalog: "அம்சங்கள் அட்டவணை",
    featuresTitle: "ஸ்மார்ட் பண்ணைகளை மேம்படுத்துதல்",
    featuresSub: "விளைச்சலை மேம்படுத்தவும், நீரைச் சேமிக்கவும், பயிர் நோய்களைத் தடுக்கவும் தேவையான அனைத்தும்.",
    diseaseTitle: "ஏஐ பயிர் கண்டறிதல்",
    diseaseDesc: "நிபுணர் சிகிச்சை வழிகாட்டிகளுடன் உடனடியாக நோய்களைக் கண்டறிய இலை புகைப்படங்களை ஸ்கேன் செய்யவும்.",
    soilTitle: "மண் டெலிமெட்ரி",
    soilDesc: "நைட்ரஜன், பாஸ்பரஸ், பொட்டாசியம், ஈரப்பதம் மற்றும் pH மதிப்புகளை நிகழ்நேரத்தில் கண்காணிக்கவும்.",
    weatherTitle: "நுண்ணிய காலநிலை விழிப்பூட்டல்கள்",
    weatherDesc: "மழை வாய்ப்புகள், காற்றின் வேக எச்சரிக்கைகள் மற்றும் பனி ஆலோசனைகளுடன் முந்திக் கொள்ளுங்கள்.",
    irrigationTitle: "நீர் சேமிப்பு ஆலோசனை",
    irrigationDesc: "பாசன காலங்கள் மற்றும் முன்கூட்டிய எச்சரிக்கை அலாரங்களைப் பெறுங்கள்.",
    exploreTool: "கருவியைப் பார்க்கவும்",
    // How it works
    workflow: "செயல்முறை",
    howItWorksTitle: "செயல்முறை விளக்கம்",
    howItWorksSub: "உங்கள் பண்ணையை தரவு சார்ந்த துல்லியமான வழிகாட்டுதலுக்கு மாற்ற மூன்று எளிய படிகள்.",
    step1Title: "1. பண்ணையை இணைக்கவும்",
    step1Desc: "உங்கள் பண்ணை எல்லைகள், பரப்பளவு விவரங்கள் மற்றும் செயலில் உள்ள பயிர்களைப் பதிவு செய்யவும்.",
    step2Title: "2. டெலிமெட்ரி பதிவு",
    step2Desc: "உள்ளூர் மண் அளவீடுகளைச் சமர்ப்பிக்கவும் அல்லது பாதிக்கப்பட்ட இலைகளின் புகைப்படங்களை எடுக்கவும்.",
    step3Title: "3. ஏஐ நுண்ணறிவின்படி செயல்படுங்கள்",
    step3Desc: "தனிப்பயனாக்கப்பட்ட NPK பரிந்துரைகள், எச்சரிக்கைகள் மற்றும் நீர்ப்பாசன வழிகாட்டிகளைப் பெறுங்கள்.",
    // CTA
    ctaTitle: "உங்கள் விளைச்சலை மேம்படுத்த தயாரா?",
    ctaSub: "பயிர் ஆரோக்கியத்தைப் பாதுகாக்கவும் தண்ணீரைச் சேமிக்கவும் AgriSync ஐப் பயன்படுத்தும் ஆயிரக்கணக்கான விவசாயிகளுடன் இணையுங்கள்.",
    startFree: "இலவசமாக தொடங்கவும்",
    soilIntelligence: "மண் நுண்ணறிவு",
    npkOptimal: "NPK உகந்த சமநிலை",
    // Footer
    footerSub: "சிறந்த விவசாயத்திற்கான ஏஐ-இயங்கும் வேளாண்மை.",
    copyright: "AgriSync. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",

    // Sidebar Nav Items
    navDashboard: "டேஷ்போர்டு",
    navMyFarm: "என் பண்ணை",
    navCrops: "பயிர்கள்",
    navDisease: "நோய் கண்டறிதல்",
    navWeather: "வானிலை",
    navSoil: "மண் ஆரோக்கியம்",
    navFertilizer: "உரம் ஆலோசகர்",
    navIrrigation: "நீர்ப்பாசனம்",
    navRecommendations: "பரிந்துரைகள்",
    navAlerts: "விழிப்பூட்டல்கள்",
    navHistory: "வரலாறு & பகுப்பாய்வு",
    navCalendar: "ஏஐ நடவு காலண்டர்",
    signOut: "வெளியேறு",

    // Dashboard Headers & Cards
    dashboardTitle: "விவசாயி டேஷ்போர்டு",
    dashboardSub: "உங்கள் பண்ணையைக் கண்காணித்து சிறந்த விவசாய முடிவுகளை எடுங்கள்.",
    myCrops: "என் பயிர்கள்",
    noCropsYet: "இன்னும் பயிர்கள் பதிவு செய்யப்படவில்லை",
    weather: "வானிலை",
    notAvailable: "கிடைக்கவில்லை",
    connectFarmLocation: "உள்ளூர் வானிலைக்கு பண்ணை இருப்பிடத்தை இணைக்கவும்",
    soilMoisture: "மண் ஈரப்பதம்",
    noReadingsRecorded: "இன்னும் அளவீடுகள் பதிவு செய்யப்படவில்லை",
    activeAlerts: "செயலில் உள்ள விழிப்பூட்டல்கள்",
    noCriticalIssues: "சிக்கலான பிரச்சனைகள் எதுவும் கண்டறியப்படவில்லை",
    quickActions: "விரைவு நடவடிக்கைகள்",
    fastAccessTools: "AgriSync கருவிகளுக்கான விரைவான அணுகல்",
    farmOverview: "பண்ணை மேலோட்டம்",
    locationSizeSoil: "இருப்பிடம், அளவு, மண் விவரம் மற்றும் நீர்ப்பாசனம்",
  },
  te: {
    // Navbar
    home: "హోమ్",
    features: "ఫీచర్లు",
    howItWorks: "ఎలా పనిచేస్తుంది",
    login: "లాగిన్",
    getStarted: "ప్రారంభించండి",
    // Hero
    heroTitle1: "స్మార్ట్ వ్యవసాయం.",
    heroTitle2: "మంచి నిర్ణయాలు.",
    heroHeadingPrefix: "తెలివిగా సాగు చేయండి ",
    heroSub: "వ్యవసాయ నిర్ణయాల కోసం ఏఐ-ఆధారిత పంట తెగుళ్ల గుర్తింపు మరియు వ్యక్తిగతీకరించిన వ్యవసాయ సలహా.",
    analyzeCrop: "పంటను విశ్లేషించండి",
    exploreFeatures: "ఫీచర్లు చూడండి",
    selectLanguage: "భాష అనువాదకం:",
    // Trust
    trustedBy: "ప్రపంచవ్యాప్తంగా ప్రగతిశీల రైతులచే విశ్వసించబడింది",
    // Features
    featuresCatalog: "ఫీచర్ల క్యాటలాగ్",
    featuresTitle: "స్మార్ట్ ఫామ్‌ల సాధికారత",
    featuresSub: "దిగుబడిని పెంచడానికి, నీటిని ఆదా చేయడానికి మరియు పంట తెగుళ్లను నివారించడానికి కావలసినవన్నీ.",
    diseaseTitle: "ఏఐ పంట నిర్ధారణ",
    diseaseDesc: "నిపుణుల చికిత్స గైడ్‌లతో తక్షణమే తెగుళ్లను గుర్తించడానికి ఆకుల ఫోటోలను స్కాన్ చేయండి.",
    soilTitle: "నేల టెలిమెట్రీ",
    soilDesc: "నత్రజని, భాస్వరం, పొటాషియం, తేమ మరియు pH విలువలను నిజ సమయంలో ట్రాక్ చేయండి.",
    weatherTitle: "వాతావరణ హెచ్చరికలు",
    weatherDesc: "వర్షం సంభావ్యతలు, గాలి వేగం మరియు మంచు సలహాలతో అప్రమత్తంగా ఉండండి.",
    irrigationTitle: "నీటి పొదుపు సలహా",
    irrigationDesc: "పంటకు నీరు పెట్టే సమయాలు మరియు ముందస్తు హెచ్చరిక అలారాలను పొందండి.",
    exploreTool: "సాధనం చూడండి",
    // How it works
    workflow: "పనివిధానం",
    howItWorksTitle: "పనిచేసే విధానం",
    howItWorksSub: "డేటా-ఆధారిత ఖచ్చితమైన మార్గదర్శకత్వానికి మారడానికి మూడు సాధారణ దశలు.",
    step1Title: "1. మీ పొలాన్ని జోడించండి",
    step1Desc: "మీ పొలం సరిహద్దులు, విస్తీర్ణం మరియు పంటల వివరాలను నమోదు చేయండి.",
    step2Title: "2. రీడింగ్స్ నమోదు చేయండి",
    step2Desc: "స్థానిక నేల రీడింగ్‌లను సమర్పించండి లేదా తెగులు సోకిన ఆకుల ఫోటోలను తీయండి.",
    step3Title: "3. ఏఐ అంతర్దృష్టులను అనుసరించండి",
    step3Desc: "వ్యక్తిగతీకరించిన NPK సిఫార్సులు, అలర్ట్‌లు మరియు నీటి పారుదల గైడ్‌లను పొందండి.",
    // CTA
    ctaTitle: "దిగుబడిని ఆప్టిమైజ్ చేయడానికి సిద్ధంగా ఉన్నారా?",
    ctaSub: "పంట ఆరోగ్యాన్ని కాపాడటానికి మరియు నీటిని ఆదా చేయడానికి AgriSync ఉపయోగిస్తున్న వేలాది మంది రైతులతో చేరండి.",
    startFree: "స్మార్ట్ వ్యవసాయం ఉచితంగా ప్రారంభించండి",
    soilIntelligence: "నేల మేధస్సు",
    npkOptimal: "NPK సమతుల్యత",
    // Footer
    footerSub: "స్మార్ట్ వ్యవసాయం కోసం ఏఐ-ఆధారిత సాంకేతికత.",
    copyright: "AgriSync. సర్వ హక్కులూ ప్రత్యేకించబడినవి.",

    // Sidebar Nav Items
    navDashboard: "డాష్‌బోర్డ్",
    navMyFarm: "నా పొలం",
    navCrops: "పంటలు",
    navDisease: "తెగుళ్ల గుర్తింపు",
    navWeather: "వాతావరణం",
    navSoil: "నేల ఆరోగ్యం",
    navFertilizer: "ఎరువుల సలహాదారు",
    navIrrigation: "నీటి పారుదల",
    navRecommendations: "సిఫార్సులు",
    navAlerts: "హెచ్చరికలు",
    navHistory: "చరిత్ర & విశ్లేషణ",
    navCalendar: "ఏఐ విత్తే క్యాలెండర్",
    signOut: "లాగ్ అవుట్",

    // Dashboard Headers & Cards
    dashboardTitle: "రైతు డాష్‌బోర్డ్",
    dashboardSub: "మీ పొలాన్ని పర్యవేక్షించండి మరియు తెలివైన నిర్ణయాలు తీసుకోండి.",
    myCrops: "నా పంటలు",
    noCropsYet: "ఇంకా పంటలు నమోదు చేయలేదు",
    weather: "వాతావరణం",
    notAvailable: "లభ్యం కాలేదు",
    connectFarmLocation: "స్థానిక వాతావరణం కోసం పొలం స్థానాన్ని జోడించండి",
    soilMoisture: "నేల తేమ",
    noReadingsRecorded: "ఇంకా రీడింగ్‌లు నమోదు చేయలేదు",
    activeAlerts: "సక్రియ అలర్ట్‌లు",
    noCriticalIssues: "తీవ్రమైన సమస్యలు ఏవీ లేవు",
    quickActions: "త్వరిత చర్యలు",
    fastAccessTools: "AgriSync సాధనాలకు శీఘ్ర ప్రాప్యత",
    farmOverview: "పొలం అవలోకనం",
    locationSizeSoil: "స్థానం, పరిమాణం, నేల వివరాలు మరియు నీటి పారుదల",
  },
  bn: {
    // Navbar
    home: "হোম",
    features: "বৈশিষ্ট্যসমূহ",
    howItWorks: "কার্যপ্রণালী",
    login: "লগইন",
    getStarted: "শুরু করুন",
    // Hero
    heroTitle1: "স্মার্ট চাষাবাদ।",
    heroTitle2: "উন্নত সিদ্ধান্ত।",
    heroHeadingPrefix: "স্মার্ট চাষাবাদ করুন ",
    heroSub: "উন্নত কৃষি সিদ্ধান্তের জন্য এআই-চালিত ফসল রোগ সনাক্তকরণ এবং ব্যক্তিগতকৃত খামার পরামর্শ।",
    analyzeCrop: "ফসল বিশ্লেষণ করুন",
    exploreFeatures: "বৈশিষ্ট্যসমূহ দেখুন",
    selectLanguage: "ভাষা অনুবাদক:",
    // Trust
    trustedBy: "বিশ্বব্যাপী প্রগতিশীল কৃষকদের দ্বারা বিশ্বস্ত",
    // Features
    featuresCatalog: "বৈশিষ্ট্যসমুহ ক্যাটালগ",
    featuresTitle: "স্মার্ট খামারগুলির ক্ষমতায়ন",
    featuresSub: "ফলন বৃদ্ধি, জল সাশ্রয় এবং ফসলের রোগ প্রতিরোধ করার জন্য প্রয়োজনীয় সবকিছু।",
    diseaseTitle: "এআই ফসল নির্ণয়",
    diseaseDesc: "বিশেষজ্ঞদের চিকিত্সা নির্দেশিকা সহ তাত্ক্ষণিকভাবে রোগ নির্ণয় করতে পাতার ছবি স্ক্যান করুন।",
    soilTitle: "মাটির টেলিমেট্রি",
    soilDesc: "বাস্তব সময়ে নাইট্রোজেন, ফসফরাস, পটাসিয়াম, আর্দ্রতা এবং পিএইচ মান ট্র্যাক করুন।",
    weatherTitle: "আবহাওয়া সতর্কতা",
    weatherDesc: "বৃষ্টির সম্ভাবনা, বাতাসের গতিবেগ এবং তুষারপাতের পরামর্শ নিয়ে এগিয়ে থাকুন।",
    irrigationTitle: "জল-সাশ্রয়ী পরামর্শ",
    irrigationDesc: "গতিশীল ফসলের সেচের সময়কাল এবং প্রাথমিক সতর্কতা অ্যালার্ম পান।",
    exploreTool: "টুল দেখুন",
    // How it works
    workflow: "কার্যপ্রণালী",
    howItWorksTitle: "কার্যপদ্ধতি",
    howItWorksSub: "আপনার খামারকে ডেটা-চালিত নির্ভুল নির্দেশিকায় রূপান্তর করতে তিনটি সহজ পদক্ষেপ।",
    step1Title: "1. খামার সংযুক্ত করুন",
    step1Desc: "আপনার খামারের সীমানা, এলাকা বিবরণ এবং সক্রিয় ফসল নিবন্ধন করুন।",
    step2Title: "2. টেলিমেট্রি লগ করুন",
    step2Desc: "স্থানীয় মাটির রিডিং জমা দিন বা ক্ষতিগ্রস্ত পাতার ছবি তুলুন।",
    step3Title: "3. এআই অন্তর্দৃষ্টি অনুযায়ী কাজ করুন",
    step3Desc: "ব্যক্তিগতকৃত NPK সুপারিশ, সতর্কতা এবং সেচ নির্দেশিকা পান।",
    // CTA
    ctaTitle: "আপনার ফলন অপ্টিমাইজ করতে প্রস্তুত?",
    ctaSub: "ফসলের স্বাস্থ্য সুরক্ষিত করতে এবং জল সংরক্ষণ করতে AgriSync ব্যবহার করে হাজার হাজার কৃষকের সাথে যোগ দিন।",
    startFree: "স্মার্ট চাষাবাদ বিনামূল্যে শুরু করুন",
    soilIntelligence: "মাটির বুদ্ধিমত্তা",
    npkOptimal: "NPK সেরা ভারসাম্য",
    // Footer
    footerSub: "উন্নত চাষাবাদের জন্য এআই-চালিত কৃষি।",
    copyright: "AgriSync. সর্বস্বত্ব সংরক্ষিত।",

    // Sidebar Nav Items
    navDashboard: "ড্যাশবোর্ড",
    navMyFarm: "আমার খামার",
    navCrops: "ফসলসমূহ",
    navDisease: "রোগ সনাক্তকরণ",
    navWeather: "আবহাওয়া",
    navSoil: "মাটির স্বাস্থ্য",
    navFertilizer: "সার পরামর্শদাতা",
    navIrrigation: "সেচ",
    navRecommendations: "সুপারিশসমূহ",
    navAlerts: "সতর্কতা",
    navHistory: "ইতিহাস ও বিশ্লেষণ",
    navCalendar: "এআই রোপণ ক্যালেন্ডার",
    signOut: "সাইন আউট",

    // Dashboard Headers & Cards
    dashboardTitle: "কৃষক ড্যাশবোর্ড",
    dashboardSub: "আপনার খামার পর্যবেক্ষণ করুন এবং আরও স্মার্ট কৃষি সিদ্ধান্ত নিন।",
    myCrops: "আমার ফসল",
    noCropsYet: "এখনও কোনো ফসল নিবন্ধিত হয়নি",
    weather: "আবহাওয়া",
    notAvailable: "উপলব্ধ নেই",
    connectFarmLocation: "স্থানীয় আবহাওয়ার জন্য খামারের অবস্থান সংযোগ করুন",
    soilMoisture: "মাটির আর্দ্রতা",
    noReadingsRecorded: "এখনও কোনো রিডিং রেকর্ড করা হয়নি",
    activeAlerts: "সক্রিয় সতর্কতা",
    noCriticalIssues: "কোনো সংকটজনক সমস্যা পাওয়া যায়নি",
    quickActions: "দ্রুত পদক্ষেপ",
    fastAccessTools: "AgriSync টুলগুলিতে দ্রুত অ্যাক্সেস",
    farmOverview: "খামারের বিবরণ",
    locationSizeSoil: "অবস্থান, আকার, মাটির প্রোফাইল এবং সেচ",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("agrisync_lang") as Language;
    if (saved && (saved === "en" || saved === "hi" || saved === "ta" || saved === "te" || saved === "bn")) {
      setLanguageState(saved);
    }

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ lang: Language }>;
      if (customEvt.detail?.lang) {
        setLanguageState(customEvt.detail.lang);
      }
    };

    window.addEventListener("agrisync_language_changed", handleCustomEvent);
    return () => {
      window.removeEventListener("agrisync_language_changed", handleCustomEvent);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("agrisync_lang", lang);
    window.dispatchEvent(new CustomEvent("agrisync_language_changed", { detail: { lang } }));
  };

  const t = (key: string): string => {
    return translations[language]?.[key as keyof typeof translations["en"]] || translations["en"][key as keyof typeof translations["en"]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
