import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';
import { Language } from '../types/agro';

export interface LocationSearchResult {
  id: string;
  nameAr: string;
  nameEn: string;
  regionAr: string;
  regionEn: string;
  lat: number;
  lng: number;
  type: 'city' | 'village' | 'reclamation' | 'oasis' | 'governorate';
}

// Comprehensive Egyptian, Arab, and Global Agricultural Gazetteer
export const PRESET_AGRICULTURAL_PLACES: LocationSearchResult[] = [
  // --- دلتا النيل ومحافظات شمال ووسط الدلتا ---
  { id: 'kafr-el-sheikh', nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', regionAr: 'شمال الدلتا (أرز وأسماك)', regionEn: 'North Delta', lat: 31.1107, lng: 30.9388, type: 'governorate' },
  { id: 'desouk', nameAr: 'دسوق', nameEn: 'Desouk', regionAr: 'كفر الشيخ (أراضي طميية خصبة)', regionEn: 'Kafr El Sheikh', lat: 31.1311, lng: 30.6483, type: 'city' },
  { id: 'biyala', nameAr: 'بيلا', nameEn: 'Biyala', regionAr: 'كفر الشيخ (زراعة القمح والقطن)', regionEn: 'Kafr El Sheikh', lat: 31.1738, lng: 31.2215, type: 'city' },
  { id: 'al-riyad-ks', nameAr: 'الرياض', nameEn: 'Al Riyadh (Kafr El Sheikh)', regionAr: 'كفر الشيخ (أرز ومحاصيل صيفية)', regionEn: 'Kafr El Sheikh', lat: 31.2333, lng: 30.9500, type: 'city' },
  { id: 'sidi-salem', nameAr: 'سيدي سالم', nameEn: 'Sidi Salem', regionAr: 'كفر الشيخ (حقول أرز وبنجر)', regionEn: 'Kafr El Sheikh', lat: 31.2747, lng: 30.7853, type: 'city' },
  { id: 'baltim', nameAr: 'بلطيم', nameEn: 'Baltim', regionAr: 'شمال كفر الشيخ (طماطم ودفيئات)', regionEn: 'Kafr El Sheikh', lat: 31.5833, lng: 31.0833, type: 'city' },

  { id: 'tanta', nameAr: 'طنطا', nameEn: 'Tanta', regionAr: 'الغربية (قلب الدلتا - حبوب وخضار)', regionEn: 'Gharbia', lat: 30.7865, lng: 31.0004, type: 'governorate' },
  { id: 'mahalla', nameAr: 'المحلة الكبرى', nameEn: 'El Mahalla El Kubra', regionAr: 'الغربية (أراضي القطن والقمح)', regionEn: 'Gharbia', lat: 30.9706, lng: 31.1669, type: 'city' },
  { id: 'zefta', nameAr: 'زفتى', nameEn: 'Zefta', regionAr: 'الغربية (كتان وحبوب)', regionEn: 'Gharbia', lat: 30.7139, lng: 31.2464, type: 'city' },
  { id: 'samannoud', nameAr: 'سمنود', nameEn: 'Samannoud', regionAr: 'الغربية (خضار وبطاطس)', regionEn: 'Gharbia', lat: 30.9608, lng: 31.2422, type: 'city' },

  { id: 'mansoura', nameAr: 'المنصورة', nameEn: 'Mansoura', regionAr: 'الدقهلية (سلة الغذاء - أرز وبصل)', regionEn: 'Dakahlia', lat: 31.0409, lng: 31.3785, type: 'governorate' },
  { id: 'mit-ghamr', nameAr: 'ميت غمر', nameEn: 'Mit Ghamr', regionAr: 'الدقهلية (أراضي الطمي القديمة الخصبة)', regionEn: 'Dakahlia', lat: 30.7192, lng: 31.2592, type: 'city' },
  { id: 'senbellawin', nameAr: 'السنبلاوين', nameEn: 'El Senbellawein', regionAr: 'الدقهلية (قمح وبنجر سكر)', regionEn: 'Dakahlia', lat: 30.8872, lng: 31.4644, type: 'city' },
  { id: 'belqas', nameAr: 'بلقاس', nameEn: 'Belqas', regionAr: 'الدقهلية (بنجر سكر ومزارع كبرى)', regionEn: 'Dakahlia', lat: 31.2294, lng: 31.3653, type: 'city' },
  { id: 'sherbin', nameAr: 'شربين', nameEn: 'Sherbin', regionAr: 'الدقهلية (أرز وخضروات حقلية)', regionEn: 'Dakahlia', lat: 31.1925, lng: 31.5222, type: 'city' },
  { id: 'dekernes', nameAr: 'دكرنس', nameEn: 'Dikirnis', regionAr: 'الدقهلية (محاصيل حقلية)', regionEn: 'Dakahlia', lat: 31.0856, lng: 31.5956, type: 'city' },

  { id: 'damanhour', nameAr: 'دمنهور', nameEn: 'Damanhur', regionAr: 'البحيرة (أكبر مساحة زراعية في مصر)', regionEn: 'Beheira', lat: 31.0425, lng: 30.4703, type: 'governorate' },
  { id: 'kafr-el-dawar', nameAr: 'كفر الدوار', nameEn: 'Kafr El Dawar', regionAr: 'البحيرة (أراضي الخضار والحبوب)', regionEn: 'Beheira', lat: 31.1342, lng: 30.1292, type: 'city' },
  { id: 'etay-el-baroud', nameAr: 'إيتاي البارود', nameEn: 'Itay El Barud', regionAr: 'البحيرة (قمح وبصل)', regionEn: 'Beheira', lat: 30.8872, lng: 30.6653, type: 'city' },
  { id: 'kom-hamada', nameAr: 'كوم حمادة', nameEn: 'Kom Hamada', regionAr: 'البحيرة (بطاطس وفراولة)', regionEn: 'Beheira', lat: 30.7558, lng: 30.7011, type: 'city' },
  { id: 'abu-hummus', nameAr: 'أبو حمص', nameEn: 'Abu Hummus', regionAr: 'البحيرة (حبوب وأعلاف)', regionEn: 'Beheira', lat: 31.1008, lng: 30.3081, type: 'city' },
  { id: 'delengat', nameAr: 'الدلنجات', nameEn: 'El Delengat', regionAr: 'البحيرة (بطاطس وتصدير)', regionEn: 'Beheira', lat: 30.8258, lng: 30.5367, type: 'city' },

  { id: 'zagazig', nameAr: 'الزقازيق', nameEn: 'Zagazig', regionAr: 'الشرقية (أراضي القمح والسمسم)', regionEn: 'Sharqia', lat: 30.5877, lng: 31.5020, type: 'governorate' },
  { id: 'faqous', nameAr: 'فاقوس', nameEn: 'Faqous', regionAr: 'الشرقية (محاصيل حقلية وبساتين)', regionEn: 'Sharqia', lat: 30.7308, lng: 31.7989, type: 'city' },
  { id: 'bilbeis', nameAr: 'بلبيس', nameEn: 'Bilbeis', regionAr: 'الشرقية (بوابة الدلتا وخضار)', regionEn: 'Sharqia', lat: 30.4206, lng: 31.5622, type: 'city' },
  { id: 'hehya', nameAr: 'ههيا', nameEn: 'Hehia', regionAr: 'الشرقية (أراضي طميية)', regionEn: 'Sharqia', lat: 30.6692, lng: 31.5911, type: 'city' },
  { id: 'husseiniya', nameAr: 'الحسينية', nameEn: 'El Husseiniya', regionAr: 'الشرقية (أراضي استصلاح وترع)', regionEn: 'Sharqia', lat: 30.8717, lng: 31.9189, type: 'city' },
  { id: 'saleheya', nameAr: 'الصالحية الجديدة', nameEn: 'New Salheya', regionAr: 'الشرقية (مزارع الموالح والتصدير)', regionEn: 'Sharqia', lat: 30.6500, lng: 31.8667, type: 'reclamation' },

  { id: 'shebin-el-kom', nameAr: 'شبين الكوم', nameEn: 'Shebin El Koum', regionAr: 'المنوفية (كثافة زراعية وإنتاجية عالية)', regionEn: 'Monufia', lat: 30.5516, lng: 31.0116, type: 'governorate' },
  { id: 'menouf', nameAr: 'منوف', nameEn: 'Menouf', regionAr: 'المنوفية (خضار وبطاطس)', regionEn: 'Monufia', lat: 30.4658, lng: 30.9317, type: 'city' },
  { id: 'ashmoun', nameAr: 'أشمون', nameEn: 'Ashmoun', regionAr: 'المنوفية (أراضي النيل)', regionEn: 'Monufia', lat: 30.2961, lng: 30.9786, type: 'city' },
  { id: 'quesna', nameAr: 'قويسنا', nameEn: 'Quesna', regionAr: 'المنوفية (حبوب وأعلاف)', regionEn: 'Monufia', lat: 30.5186, lng: 31.1444, type: 'city' },
  { id: 'tala', nameAr: 'تلا', nameEn: 'تلا', regionAr: 'المنوفية (بصل وحبوب)', regionEn: 'Monufia', lat: 30.6806, lng: 30.9431, type: 'city' },

  { id: 'benha', nameAr: 'بنها', nameEn: 'Benha', regionAr: 'القليوبية (عاصمة الموالح والعسل)', regionEn: 'Qalyubia', lat: 30.4660, lng: 31.1853, type: 'governorate' },
  { id: 'toukh', nameAr: 'طوخ', nameEn: 'Toukh', regionAr: 'القليوبية (موالح وفراولة)', regionEn: 'Qalyubia', lat: 30.3547, lng: 31.1989, type: 'city' },
  { id: 'qalyub', nameAr: 'قليوب', nameEn: 'Qalyub', regionAr: 'القليوبية (خضراوات العاصمة)', regionEn: 'Qalyubia', lat: 30.1800, lng: 31.2064, type: 'city' },

  // --- أراضي الاستصلاح الحديثة ومشاريع مصر القومية ---
  { id: 'nobaria', nameAr: 'النوبارية الجديدة', nameEn: 'New Nobariya', regionAr: 'البحيرة (عاصمة الزراعة الحديثة والتصدير)', regionEn: 'Beheira / Modern Ag', lat: 30.6667, lng: 30.0667, type: 'reclamation' },
  { id: 'wadi-el-natrun', nameAr: 'وادي النطرون', nameEn: 'Wadi El Natrun', regionAr: 'البحيرة (مزارع زيتون وعنب وتين)', regionEn: 'Beheira / Desert Edge', lat: 30.4000, lng: 30.3500, type: 'reclamation' },
  { id: 'sadat-city', nameAr: 'مدينة السادات الزراعية', nameEn: 'Sadat Agri Zone', regionAr: 'المنوفية (مزارع الفاكهة والبيوت المحمية)', regionEn: 'Monufia Desert', lat: 30.3800, lng: 30.5200, type: 'reclamation' },
  { id: 'mostaqbal-misr', nameAr: 'مشروع مستقبل مصر (الدلتا الجديدة)', nameEn: 'Mostaqbal Misr (New Delta)', regionAr: 'محور الضبعة (قمح، بنجر، بطاطس بالبيفوت)', regionEn: 'New Delta Mega Project', lat: 30.2200, lng: 29.8500, type: 'reclamation' },
  { id: 'toshka', nameAr: 'توشكى الخير', nameEn: 'Toshka Spillway & Farms', regionAr: 'جنوب الوادي (قمح ونخيل تمور مجدول)', regionEn: 'South Valley Mega Farms', lat: 22.8000, lng: 31.8500, type: 'reclamation' },
  { id: 'east-owinat', nameAr: 'شرق العوينات', nameEn: 'East Oweinat', regionAr: 'الوادي الجديد (أكبر مزارع قمح وبطاطس أورجانيك)', regionEn: 'New Valley Deep South', lat: 22.4500, lng: 28.7000, type: 'reclamation' },
  { id: 'sanabel-sono', nameAr: 'سنابل سونو', nameEn: 'Sanabel Sono Farms', regionAr: 'أسوان (مشروع استصلاح القمح والتمور)', regionEn: 'Aswan Agri Project', lat: 23.5000, lng: 32.2000, type: 'reclamation' },

  // --- مصر الوسطى والصعيد والواحات ---
  { id: 'giza-agri', nameAr: 'الجيزة الزراعية (العياط وأطفيح)', nameEn: 'Giza Agri (Ayat & Atfih)', regionAr: 'الجيزة (أراضي النيل وبساتين النخيل)', regionEn: 'Giza', lat: 29.6200, lng: 31.2500, type: 'city' },
  { id: 'fayoum', nameAr: 'الفيوم', nameEn: 'Fayoum', regionAr: 'الفيوم (واحة خصبة - زيتون، نباتات طبية)', regionEn: 'Fayoum Oasis', lat: 29.3084, lng: 30.8428, type: 'governorate' },
  { id: 'itsa', nameAr: 'إطسا', nameEn: 'Itsa', regionAr: 'الفيوم (قمح وقطن ونباتات طبية)', regionEn: 'Fayoum', lat: 29.2372, lng: 30.7906, type: 'city' },
  { id: 'sinnuris', nameAr: 'سنورس', nameEn: 'Sinnuris', regionAr: 'الفيوم (فاكهة وبساتين تين وزيتون)', regionEn: 'Fayoum', lat: 29.4089, lng: 30.8653, type: 'city' },
  { id: 'tamya', nameAr: 'طامية', nameEn: 'Tamiya', regionAr: 'الفيوم (طماطم وأراضي استصلاح)', regionEn: 'Fayoum', lat: 29.4792, lng: 30.9631, type: 'city' },

  { id: 'beni-suef', nameAr: 'بني سويف', nameEn: 'Beni Suef', regionAr: 'شمال الصعيد (نباتات طبية وعطرية، قمح)', regionEn: 'Beni Suef', lat: 29.0744, lng: 31.0978, type: 'governorate' },
  { id: 'beba', nameAr: 'ببا', nameEn: 'Beba', regionAr: 'بني سويف (بصل وثوم ونباتات عطرية)', regionEn: 'Beni Suef', lat: 28.9247, lng: 30.9856, type: 'city' },
  { id: 'wasta', nameAr: 'الواسطى', nameEn: 'El Wasta', regionAr: 'بني سويف (محاصيل حقلية وخضار)', regionEn: 'Beni Suef', lat: 29.3364, lng: 31.2014, type: 'city' },

  { id: 'minya', nameAr: 'المنيا', nameEn: 'Minya', regionAr: 'عروس الصعيد (سلة السكر - بنجر وقصب وبصل)', regionEn: 'Minya', lat: 28.1099, lng: 30.7503, type: 'governorate' },
  { id: 'samalut', nameAr: 'سمالوط', nameEn: 'Samalut', regionAr: 'المنيا (بنجر سكر وعنب ومزارع حديثة)', regionEn: 'Minya', lat: 28.3122, lng: 30.7100, type: 'city' },
  { id: 'maghagha', nameAr: 'مغاغة', nameEn: 'Maghagha', regionAr: 'المنيا (قمح وبصل وبقوليات)', regionEn: 'Minya', lat: 28.6483, lng: 30.8417, type: 'city' },
  { id: 'mallawi', nameAr: 'ملوي', nameEn: 'Mallawi', regionAr: 'المنيا (قصب سكر ونباتات عطرية)', regionEn: 'Minya', lat: 27.7317, lng: 30.8419, type: 'city' },
  { id: 'west-minya', nameAr: 'غرب المنيا (مشروع 1.5 مليون فدان)', nameEn: 'West Minya Reclamation', regionAr: 'المنيا (بنجر سكر بالبيفوت ومزارع كانولا)', regionEn: 'Minya Desert West', lat: 28.0500, lng: 30.1500, type: 'reclamation' },

  { id: 'asyut', nameAr: 'أسيوط', nameEn: 'Asyut', regionAr: 'قلب الصعيد (رمان، قطن، قمح، ذرة رفيعة)', regionEn: 'Asyut', lat: 27.1801, lng: 31.1837, type: 'governorate' },
  { id: 'manfalut', nameAr: 'منفلوط', nameEn: 'Manfalut', regionAr: 'أسيوط (عاصمة الرمان في العالم العربي)', regionEn: 'Asyut', lat: 27.3131, lng: 30.9703, type: 'city' },
  { id: 'dayrut', nameAr: 'ديروط', nameEn: 'Dayrut', regionAr: 'أسيوط (قمح وقصب وبصل)', regionEn: 'Asyut', lat: 27.5564, lng: 30.8081, type: 'city' },
  { id: 'qusiya', nameAr: 'القوصية', nameEn: 'El Qusiya', regionAr: 'أسيوط (حبوب وبقوليات)', regionEn: 'Asyut', lat: 27.4411, lng: 30.8186, type: 'city' },

  { id: 'sohag', nameAr: 'سوهاج', nameEn: 'Sohag', regionAr: 'الصعيد (بصل، قصب، قمح، سمسم)', regionEn: 'Sohag', lat: 26.5569, lng: 31.6948, type: 'governorate' },
  { id: 'tahta', nameAr: 'طهطا', nameEn: 'Tahta', regionAr: 'سوهاج (محاصيل حقلية وحبوب)', regionEn: 'Sohag', lat: 26.7694, lng: 31.5022, type: 'city' },
  { id: 'girga', nameAr: 'جرجا', nameEn: 'Girga', regionAr: 'سوهاج (قصب سكر وبصل صعيدي)', regionEn: 'Sohag', lat: 26.3383, lng: 31.8919, type: 'city' },

  { id: 'qena', nameAr: 'قنا', nameEn: 'Qena', regionAr: 'جنوب الصعيد (عاصمة قصب السكر والموز)', regionEn: 'Qena', lat: 26.1551, lng: 32.7160, type: 'governorate' },
  { id: 'nagaa-hammadi', nameAr: 'نجع حمادي', nameEn: 'Nagaa Hammadi', regionAr: 'قنا (مزارع قصب سكر ضخمة)', regionEn: 'Qena', lat: 26.0494, lng: 32.2414, type: 'city' },
  { id: 'qous', nameAr: 'قوص', nameEn: 'Qous', regionAr: 'قنا (قصب وموز ونخيل)', regionEn: 'Qena', lat: 25.9189, lng: 32.7639, type: 'city' },

  { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor', regionAr: 'الأقصر (طماطم تجفيف شمسي وقصب)', regionEn: 'Luxor', lat: 25.6872, lng: 32.6396, type: 'governorate' },
  { id: 'esna', nameAr: 'إسنا', nameEn: 'Esna', regionAr: 'الأقصر (أكبر مركز تجفيف طماطم وموز)', regionEn: 'Luxor', lat: 25.2933, lng: 32.5539, type: 'city' },

  { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', regionAr: 'أقصى الجنوب (تمور فاخرة وقصب وموز)', regionEn: 'Aswan', lat: 24.0889, lng: 32.8998, type: 'governorate' },
  { id: 'kom-ombo', nameAr: 'كوم أمبو', nameEn: 'Kom Ombo', regionAr: 'أسوان (أكبر مصانع وقصب سكر)', regionEn: 'Aswan', lat: 24.4764, lng: 32.9461, type: 'city' },
  { id: 'edfu', nameAr: 'إدفو', nameEn: 'Edfu', regionAr: 'أسوان (قصب سكر ونخيل بلح)', regionEn: 'Aswan', lat: 24.9781, lng: 32.8753, type: 'city' },

  // --- الوادي الجديد والواحات الغربية ---
  { id: 'kharga', nameAr: 'الخارجة (الوادي الجديد)', nameEn: 'Al Kharga Oasis', regionAr: 'الوادي الجديد (تمور صعيدي وزيتون وقمح)', regionEn: 'New Valley Oasis', lat: 25.4390, lng: 30.5586, type: 'oasis' },
  { id: 'dakhla', nameAr: 'الداخلة', nameEn: 'Al Dakhla Oasis', regionAr: 'الوادي الجديد (مزارع نخيل وبرسيم حجازي)', regionEn: 'New Valley Oasis', lat: 25.5200, lng: 28.9800, type: 'oasis' },
  { id: 'farafra', nameAr: 'الفرافرة (مشروع الريف المصري)', nameEn: 'Farafra Oasis', regionAr: 'الوادي الجديد (أكبر مشروع استصلاح بالعيون الجوفية)', regionEn: 'New Valley Reclamation', lat: 27.0583, lng: 27.9694, type: 'oasis' },
  { id: 'siwa', nameAr: 'سيوة', nameEn: 'Siwa Oasis', regionAr: 'مطروح (أجود تمور وزيتون طبيعي بدون كيماويات)', regionEn: 'Western Desert Oasis', lat: 29.2032, lng: 25.5195, type: 'oasis' },

  // --- سيناء والقناة والساحل الشمالي ---
  { id: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia', regionAr: 'القناة (عاصمة المانجو والفول السوداني)', regionEn: 'Suez Canal Zone', lat: 30.5965, lng: 32.2715, type: 'governorate' },
  { id: 'qantara', nameAr: 'القنطرة شرق وغرب', nameEn: 'Qantara East & West', regionAr: 'سيناء / القناة (ترعة السلام ومزارع الزيتون)', regionEn: 'Sinai Canal Zone', lat: 30.8569, lng: 32.3125, type: 'city' },
  { id: 'arish', nameAr: 'العريش', nameEn: 'El Arish', regionAr: 'شمال سيناء (زيتون سيناوي ولوز ورمان)', regionEn: 'North Sinai', lat: 31.1316, lng: 33.7984, type: 'city' },
  { id: 'sheikh-zuweid', nameAr: 'الشيخ زويد ورفح', nameEn: 'Sheikh Zuweid & Rafah', regionAr: 'شمال سيناء (خوخ وتين ولوز وزيتون)', regionEn: 'North Sinai Border', lat: 31.2114, lng: 34.1103, type: 'city' },
  { id: 'bir-al-abd', nameAr: 'بئر العبد', nameEn: 'Bir Al Abd', regionAr: 'شمال سيناء (مزارع ملاحية وتربة رملية)', regionEn: 'North Sinai Coast', lat: 31.0200, lng: 33.0100, type: 'city' },
  { id: 'tor-sinai', nameAr: 'طور سيناء', nameEn: 'El Tor Sinai', regionAr: 'جنوب سيناء (وديان زراعية وأعشاب طبية)', regionEn: 'South Sinai', lat: 28.2417, lng: 33.6250, type: 'city' },
  { id: 'nubariya-coast', nameAr: 'الحمام والعلمين الزراعية', nameEn: 'El Hammam & Alamein', regionAr: 'مطروح (تين وبنجر سكر وزيتون مطروحي)', regionEn: 'North Coast Agri', lat: 30.8400, lng: 29.3900, type: 'city' },

  // --- مراكز زراعية في الدول العربية ---
  { id: 'qassim-buraidah', nameAr: 'بريدة (القصيم)', nameEn: 'Buraidah (Qassim)', regionAr: 'السعودية (سلة تمور السكري والقمح والخضار)', regionEn: 'Saudi Arabia', lat: 26.3260, lng: 43.9750, type: 'city' },
  { id: 'al-kharj', nameAr: 'الخرج', nameEn: 'Al Kharj', regionAr: 'السعودية (أكبر مزارع ألبان وأعلاف وخضار محمية)', regionEn: 'Saudi Arabia', lat: 24.1556, lng: 47.3119, type: 'city' },
  { id: 'al-jouf-sakaka', nameAr: 'سكاكا (الجوف)', nameEn: 'Sakaka (Al Jouf)', regionAr: 'السعودية (أكبر مزرعة زيتون حديثة في العالم)', regionEn: 'Saudi Arabia', lat: 29.9697, lng: 40.2064, type: 'city' },
  { id: 'wadi-dawasir', nameAr: 'وادي الدواسر', nameEn: 'Wadi Ad Dawasir', regionAr: 'السعودية (زراعة القمح والبطاطس بالرش المحوري)', regionEn: 'Saudi Arabia', lat: 20.4800, lng: 44.8600, type: 'reclamation' },
  { id: 'hail-agri', nameAr: 'حائل', nameEn: 'Hail Agricultural Zone', regionAr: 'السعودية (بطاطس، بصل، أعلاف، قمح)', regionEn: 'Saudi Arabia', lat: 27.5219, lng: 41.6907, type: 'city' },
  { id: 'al-ahsa', nameAr: 'الأحساء', nameEn: 'Al Ahsa Oasis', regionAr: 'السعودية (أكبر واحة نخيل ورز حساوي في العالم)', regionEn: 'Saudi Arabia', lat: 25.3800, lng: 49.5800, type: 'oasis' },

  { id: 'bekaa-valley', nameAr: 'سهل البقاع', nameEn: 'Bekaa Valley', regionAr: 'لبنان (بطاطس، عنب، تفاح، قمح)', regionEn: 'Lebanon', lat: 33.8463, lng: 35.9020, type: 'reclamation' },
  { id: 'irbid-jordan', nameAr: 'إربد والأغوار', nameEn: 'Irbid & Jordan Valley', regionAr: 'الأردن (خضروات شتوية وموالح وزيتون)', regionEn: 'Jordan', lat: 32.5568, lng: 35.8469, type: 'city' },
  { id: 'ghouta-damascus', nameAr: 'الغوطة وحمص', nameEn: 'Ghouta & Homs', regionAr: 'سوريا (أشجار مثمرة وحبوب وقطن)', regionEn: 'Syria', lat: 33.5138, lng: 36.3500, type: 'city' },
  { id: 'ninawa-mosul', nameAr: 'نينوى وسهل الموصل', nameEn: 'Nineveh Plains (Mosul)', regionAr: 'العراق (سلة قمح وشعير بلاد الرافدين)', regionEn: 'Iraq', lat: 36.3400, lng: 43.1300, type: 'city' },
  { id: 'kairouan-tunis', nameAr: 'القيروان والوطن القبلي', nameEn: 'Kairouan & Cap Bon', regionAr: 'تونس (زيتون، قمح، طماطم، قوارص)', regionEn: 'Tunisia', lat: 35.6781, lng: 10.0963, type: 'city' },
  { id: 'mitidja-algeria', nameAr: 'سهل متيجة ووهران', nameEn: 'Mitidja Plain & Oran', regionAr: 'الجزائر (حمضيات، كروم، حبوب)', regionEn: 'Algeria', lat: 36.5500, lng: 3.0000, type: 'city' },
  { id: 'gharb-morocco', nameAr: 'سهل الغرب وتادلة', nameEn: 'Gharb & Tadla Plains', regionAr: 'المغرب (أرز، سكر، بواكير، حمضيات، زيتون)', regionEn: 'Morocco', lat: 34.2610, lng: -6.5802, type: 'city' },
  { id: 'souss-massa', nameAr: 'سوس ماسة (أكادير)', nameEn: 'Souss-Massa (Agadir)', regionAr: 'المغرب (عاصمة الطماطم والبواكير التصديرية)', regionEn: 'Morocco', lat: 30.4200, lng: -9.5900, type: 'reclamation' },

  // --- مناطق زراعية عالمية شهيرة ---
  { id: 'california-central-valley', nameAr: 'الوادي الأوسط (كاليفورنيا)', nameEn: 'California Central Valley', regionAr: 'الولايات المتحدة (أكبر سلة لوز وعنب وخضار)', regionEn: 'USA', lat: 36.7468, lng: -119.7726, type: 'reclamation' },
  { id: 'iowa-corn-belt', nameAr: 'حزام الذرة والصويا (آيوا)', nameEn: 'Iowa Corn Belt', regionAr: 'الولايات المتحدة (أكبر إنتاج ذرة وصويا عالمياً)', regionEn: 'USA', lat: 41.8780, lng: -93.0977, type: 'reclamation' },
  { id: 'mato-grosso-brazil', nameAr: 'ماتو غروسو (البرازيل)', nameEn: 'Mato Grosso', regionAr: 'البرازيل (عملاق فول الصويا والذرة العالمي)', regionEn: 'Brazil', lat: -12.6819, lng: -55.6267, type: 'reclamation' },
  { id: 'punjab-agri', nameAr: 'إقليم البنجاب (الهند/باكستان)', nameEn: 'Punjab Agricultural Belt', regionAr: 'آسيا (أكبر سهول قمح وأرز بسمتي)', regionEn: 'India/Pakistan', lat: 31.1471, lng: 75.3412, type: 'reclamation' },
  { id: 'po-valley-italy', nameAr: 'وادي البو (إيطاليا)', nameEn: 'Po Valley (Italy)', regionAr: 'أوروبا (أرز إيطالي، ذرة، بساتين)', regionEn: 'Italy', lat: 45.0703, lng: 10.1500, type: 'reclamation' },
  { id: 'andalusia-spain', nameAr: 'الأندلس (إسبانيا)', nameEn: 'Andalusia Olive Sea', regionAr: 'إسبانيا (بحر الزيتون والدفيئات في ألميريا)', regionEn: 'Spain', lat: 37.3891, lng: -5.9845, type: 'city' },
  { id: 'ukraine-steppe', nameAr: 'السهوب الأوكرانية (التربة السوداء)', nameEn: 'Ukrainian Chernozem Belt', regionAr: 'أوروبا الشرقية (قمح، دوار الشمس، ذرة)', regionEn: 'Ukraine', lat: 49.0000, lng: 31.0000, type: 'reclamation' },
];

interface MapLocationSearchBarProps {
  language: Language;
  onSelectLocation: (lat: number, lng: number, placeNameAr: string) => void;
  className?: string;
}

export const MapLocationSearchBar: React.FC<MapLocationSearchBarProps> = ({
  language,
  onSelectLocation,
  className = '',
}) => {
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter local gazetteer immediately on query change
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // 1. Instant local search across rich preset catalog
    const localMatches = PRESET_AGRICULTURAL_PLACES.filter((p) => {
      return (
        p.nameAr.toLowerCase().includes(trimmed) ||
        p.nameEn.toLowerCase().includes(trimmed) ||
        p.regionAr.toLowerCase().includes(trimmed) ||
        p.regionEn.toLowerCase().includes(trimmed)
      );
    }).slice(0, 8);

    setResults(localMatches);
    setIsOpen(true);
    setSelectedIndex(-1);

    // 2. Debounced online fallback if user typed > 2 chars and few local results
    if (trimmed.length >= 2 && localMatches.length < 3) {
      const timer = setTimeout(async () => {
        try {
          setIsLoadingOnline(true);
          const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            trimmed
          )}&limit=5&accept-language=ar`;
          const resp = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(4500),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              const onlineItems: LocationSearchResult[] = data.map((item: any, idx: number) => ({
                id: `online-${item.place_id || idx}`,
                nameAr: item.name || item.display_name.split(',')[0],
                nameEn: item.name || item.display_name.split(',')[0],
                regionAr: item.display_name,
                regionEn: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                type: 'city',
              }));

              setResults((prev) => {
                // Merge unique items by lat/lng
                const existingCoords = new Set(prev.map((p) => `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`));
                const filteredOnline = onlineItems.filter(
                  (oi) => !existingCoords.has(`${oi.lat.toFixed(2)},${oi.lng.toFixed(2)}`)
                );
                return [...prev, ...filteredOnline].slice(0, 9);
              });
            }
          }
        } catch {
          // Gracefully fallback to local matches
        } finally {
          setIsLoadingOnline(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [query]);

  const handleSelect = (item: LocationSearchResult) => {
    setQuery(isAr ? item.nameAr : item.nameEn);
    setIsOpen(false);
    onSelectLocation(item.lat, item.lng, item.nameAr);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < results.length) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative z-40 w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] ${className}`}
    >
      {/* Search Input Bar */}
      <div className="relative flex items-center w-full rounded-2xl bg-slate-950/92 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.55)] transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/40">
        <div className="flex items-center justify-center ps-3.5 pe-1 text-emerald-400 shrink-0">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isAr
              ? '🔍 ابحث عن قريتك، مركزك، مدينتك...'
              : 'Search village, town, region...'
          }
          className="w-full py-2.5 px-2 bg-transparent text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
        />

        {isLoadingOnline && (
          <div className="pe-2 text-slate-400 animate-spin shrink-0">
            <Loader2 className="w-3.5 h-3.5" />
          </div>
        )}

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            title={isAr ? 'مسح البحث' : 'Clear search'}
            className="pe-3 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full start-0 end-0 mt-1.5 max-h-72 overflow-y-auto rounded-2xl bg-slate-950/96 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-1.5 flex flex-col gap-1 [scrollbar-width:thin] animate-fade-in z-50">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 border-b border-white/10 flex items-center justify-between">
            <span>{isAr ? 'النتائج المتوقعة والقرى الزراعية' : 'Matching Places'}</span>
            <span className="font-mono text-emerald-400">{results.length}</span>
          </div>

          {results.map((item, idx) => {
            const isSel = idx === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full px-3 py-2 rounded-xl text-start flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSel
                    ? 'bg-emerald-600/90 text-white shadow-md'
                    : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === 'reclamation'
                      ? 'bg-amber-500/20 text-amber-300'
                      : item.type === 'oasis'
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
                    <span>{isAr ? item.nameAr : item.nameEn}</span>
                    {item.type === 'reclamation' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-normal">
                        {isAr ? 'مشروع استصلاح' : 'Reclamation'}
                      </span>
                    )}
                    {item.type === 'oasis' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/30 text-teal-200 font-normal">
                        {isAr ? 'واحة' : 'Oasis'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {isAr ? item.regionAr : item.regionEn}
                  </div>
                </div>

                <Navigation className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
