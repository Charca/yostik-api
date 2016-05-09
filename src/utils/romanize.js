function toRoman( num ) {
 num = parseInt( num, 10);
 if( num > 0 && num < 6000 ) {
  var mill = [ '', 'M', 'MM', 'MMM', 'MMMM', 'MMMMM' ],
   cent = [ '', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM' ],
   tens = [ '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC' ],
   ones = [ '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX' ],
   m, c, t, r = function(n) {
     n = (num - (num % n ) ) / n;
     return n;
   };
   m = r(1000);
   num = num % 1000;
   c = r(100);
   num = num % 100;
   t = r(10);
  return mill[m] + cent[c] + tens[t] + ones[ num%10 ];
 } else {
  return 'Numbers from 1 to 5999 only please.';
 }
}

module.exports = {
  toRoman
};
