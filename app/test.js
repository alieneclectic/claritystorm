"use strict";
//[0, 1, 2, 3, 4].reduce(function (previousValue, currentValue, currentIndex, array) {
//    var result = previousValue + currentValue;
//    
//    
//});
var flags = 5;
var FLAG_A = 1; // 0001
var FLAG_B = 2; // 0010
var FLAG_C = 4; // 0100
var FLAG_D = 8; // 1000
var mask = FLAG_A | FLAG_B | FLAG_D;

if (flags & FLAG_C) { // 0101 & 0100 => 0100 => true
   console.log("yes");
}
//console.log(mask);