"use client";

import { useLanguage, Language } from "@/components/LanguageContext";

const guideTranslations = {
  en: {
    title: "Farmer's Quick Helper",
    subtitle: "Simple tips to help you operate the AgriSync platform easily:",
    card1Title: "Speak to the AI Bot",
    card1Desc: "Tap the green chat bubble in the bottom-right corner, click the mic icon 🎤, and ask questions out loud in English or Hindi!",
    card2Title: "Leaf Disease Scan",
    card2Desc: "If your plant leaves have spots, go to \"Disease Detection\" in the menu, snap or upload a leaf photo, and get immediate treatment.",
  },
  hi: {
    title: "किसानों के लिए त्वरित गाइड",
    subtitle: "एग्रीसिंक प्लेटफॉर्म को आसानी से चलाने के लिए कुछ सरल सुझाव:",
    card1Title: "एआई बॉट से बात करें",
    card1Desc: "नीचे-दाएं कोने में हरे चैट बबल पर टैप करें, माइक आइकन 🎤 पर क्लिक करें और अंग्रेजी या हिंदी में जोर से सवाल पूछें!",
    card2Title: "पत्ती रोग स्कैन",
    card2Desc: "यदि आपके पौधे की पत्तियों पर धब्बे हैं, तो मेनू में \"पत्ती रोग परीक्षण\" पर जाएं, पत्ती की तस्वीर लें या अपलोड करें और तुरंत उपचार पाएं।",
  },
  ta: {
    title: "விவசாயிகளின் சுலப வழிகாட்டி",
    subtitle: "அக்ரிசின்க் தளத்தை எளிதாக இயக்குவதற்கான எளிய குறிப்புகள்:",
    card1Title: "ஏஐ பாட் உடன் பேசுங்கள்",
    card1Desc: "கீழ்-வலது மூலையில் உள்ள பச்சை அரட்டை குமிழியைத் தட்டவும், மைக் ஐகானைக் 🎤 கிளிக் செய்து, ஆங்கிலம் அல்லது இந்தியில் உரக்கக் கேளுங்கள்!",
    card2Title: "இலை நோய் சோதனை",
    card2Desc: "உங்கள் தாவர இலைகளில் புள்ளிகள் இருந்தால், மெனுவில் \"பயிர் நோய் கண்டறிதல்\" என்பதற்குச் சென்று, இலை புகைப்படத்தை எடுத்துப் பதிவேற்றி, உடனடியாக சிகிச்சை பெறவும்.",
  },
  te: {
    title: "రైతుల శీఘ్ర సహాయకారి",
    subtitle: "అగ్రిసింక్ ప్లాట్‌ఫారమ్‌ను సులభంగా నిర్వహించడానికి సాధారణ చిట్కాలు:",
    card1Title: "ఏఐ బాట్‌తో మాట్లాడండి",
    card1Desc: "దిగువ కుడి మూలలో ఉన్న గ్రీన్ చాట్ బబుల్‌ను నొక్కండి, మైక్ చిహ్నాన్ని 🎤 క్లిక్ చేసి, ఇంగ్లీష్ లేదా హిందీలో బిగ్గరగా ప్రశ్నలు అడగండి!",
    card2Title: "ఆకు తెగులు స్కానింగ్",
    card2Desc: "మీ మొక్క ఆకులపై మచ్చలు ఉంటే, మెనూలోని \"పంట తెగుళ్ల గుర్తింపు\" కి వెళ్లి, ఆకు ఫోటో తీసి అప్‌లోడ్ చేయండి మరియు తక్షణ చికిత్స పొందండి.",
  },
  bn: {
    title: "কৃষকদের কুইক হেল্পার",
    subtitle: "অ্যাগ্রিসিঙ্ক প্ল্যাটফর্মটি সহজে পরিচালনা করার জন্য সহজ টিপস:",
    card1Title: "এআই বটের সাথে কথা বলুন",
    card1Desc: "নীছের ডানদিকের কোণায় সবুজ চ্যাট বুদ্বুদ আলতো চাপুন, মাইক আইকন 🎤 ক্লিক করুন এবং ইংরেজি বা হিন্দিতে জোরে প্রশ্ন জিজ্ঞাসা করুন!",
    card2Title: "পাতার রোগ স্ক্যান",
    card2Desc: "আপনার গাছের পাতায় দাগ থাকলে, মেনু থেকে \"ফসল রোগ সনাক্তকরণ\"-এ যান, একটি পাতার ছবি তুলুন বা আপলোড করুন এবং তাত্ক্ষণিক সমাধান পান।",
  }
};

export default function FarmerHelper() {
  const { language, setLanguage } = useLanguage();

  const t = guideTranslations[language] || guideTranslations.en;

  return (
    <section className="mt-8 p-5 sm:p-6 rounded-2xl border border-green-200/50 dark:border-green-900/40 bg-green-50/20 dark:bg-green-950/10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-green-200/20 dark:border-green-900/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌾</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              {t.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 mt-0.5">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Global language selector dropdown */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-600/20 cursor-pointer text-zinc-700 dark:text-zinc-300"
        >
          <option value="en">English (EN)</option>
          <option value="hi">हिन्दी (HI)</option>
          <option value="bn">বাংলা (BN)</option>
          <option value="te">తెలుగు (TE)</option>
          <option value="ta">தமிழ் (TA)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
          <span className="text-2xl block mb-2">🎙️</span>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            {t.card1Title}
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
            {t.card1Desc}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
          <span className="text-2xl block mb-2">🔬</span>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            {t.card2Title}
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
            {t.card2Desc}
          </p>
        </div>
      </div>
    </section>
  );
}
