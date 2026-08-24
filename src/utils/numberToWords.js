import writtenNumber from 'written-number';
import { CURRENCIES } from '../types/documentTypes';

// Arabic number to words helper
const arabicUnits = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const arabicTeens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const arabicTens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const arabicHundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertArabicHundreds(num) {
  if (num === 0) return '';
  let str = '';
  const h = Math.floor(num / 100);
  const rem = num % 100;
  
  if (h > 0) {
    str += arabicHundreds[h];
  }
  
  if (rem > 0) {
    if (str) str += ' و ';
    if (rem < 10) {
      str += arabicUnits[rem];
    } else if (rem < 20) {
      str += arabicTeens[rem - 10];
    } else {
      const u = rem % 10;
      const t = Math.floor(rem / 10);
      if (u > 0) {
        str += arabicUnits[u] + ' و ' + arabicTens[t];
      } else {
        str += arabicTens[t];
      }
    }
  }
  return str;
}

function arabicNumberToWords(num) {
  if (num === 0) return 'صفر';
  if (num < 0) return 'سالب ' + arabicNumberToWords(-num);
  
  const thousands = Math.floor((num % 1000000) / 1000);
  const millions = Math.floor(num / 1000000);
  const units = num % 1000;
  
  let parts = [];
  
  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions >= 3 && millions <= 10) parts.push(convertArabicHundreds(millions) + ' ملايين');
    else parts.push(convertArabicHundreds(millions) + ' مليون');
  }
  
  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(convertArabicHundreds(thousands) + ' آلاف');
    else parts.push(convertArabicHundreds(thousands) + ' ألف');
  }
  
  if (units > 0) {
    parts.push(convertArabicHundreds(units));
  }
  
  return parts.join(' و ');
}

export function formatAmountInWords(amount, currencyCode = 'EUR', language = 'fr') {
  if (isNaN(amount) || amount === null) return '';
  
  const curr = CURRENCIES[currencyCode] || CURRENCIES.EUR;
  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);
  
  try {
    if (language === 'ar') {
      const intWords = arabicNumberToWords(integerPart);
      let res = intWords + ' ' + (curr.code === 'MAD' ? 'درهم' : curr.code === 'DZD' ? 'دينار جزائري' : curr.code === 'USD' ? 'دولار' : curr.code === 'TND' ? 'دينار تونسي' : curr.namePlural);
      if (decimalPart > 0) {
        const decWords = arabicNumberToWords(decimalPart);
        res += ' و ' + decWords + ' ' + (curr.code === 'TND' ? 'مليم' : 'سنتيم');
      }
      return 'فقط ' + res + ' لا غير';
    }

    const writtenLang = language === 'es' ? 'es' : language === 'en' ? 'en' : 'fr';
    let intWords = writtenNumber(integerPart, { lang: writtenLang });
    
    // Capitalize first letter
    intWords = intWords.charAt(0).toUpperCase() + intWords.slice(1);
    
    let mainUnit = integerPart > 1 ? curr.namePlural : curr.name;
    let text = `${intWords} ${mainUnit}`;
    
    if (decimalPart > 0) {
      const decWords = writtenNumber(decimalPart, { lang: writtenLang });
      const subUnit = decimalPart > 1 ? curr.subPlural : curr.sub;
      const andWord = language === 'en' ? 'and' : language === 'es' ? 'con' : 'et';
      text += ` ${andWord} ${decWords} ${subUnit}`;
    }
    
    return text;
  } catch (err) {
    console.error('Error formatting amount in words', err);
    return '';
  }
}
