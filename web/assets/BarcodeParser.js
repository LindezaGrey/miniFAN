/**
 * P. Brockfeld, 2014-02-05
 *
 * JavaScript for parsing GS1 barcodes, see
 *
 * https://github.com/MaximBelov/BarcodeParser      (active fork)
 * https://github.com/PeterBrockfeld/BarcodeParser  (original repo)
 *
 * for details.
 */

/**
* @typedef {Object} ParsedBarcode
* @property {string} codeName - Symbology identifier
* @property {ParsedElement[]} parsedCodeItems - an array with elements which are objects of type "ParsedElement"
*/

/**
 *
 * encapsulating the barcode parsing function in an anonymous, self-executing function
 */
const parseBarcode = (function () {
    'use strict';
    /**
     * This is the main routine provided by the parseBarcode library. It takes a string,
     * splices it from left to right into its elements and tries to parse it as an
     * GS1 - element. If it succeeds, the result is returned as an object composed of
     * an identifier and an array.It accepts
     * @param   {String}   barcode is the contents of the barcode you'd like to get parsed
     * @returns {ParsedBarcode}   with code name and an array with elements which are objects of type "ParsedElement"
     */

    function parseBarcode(barcode) {
        var i = 0, // counter
            fncChar = String.fromCharCode(29), // the ASCII "group separator"
            barcodelength = barcode.length,
            answer = {}, // the object to return
            restOfBarcode = "", // the rest of the barcode, when first
            // elements are spliced away
            symbologyIdentifier = barcode
                .replace(fncChar, '')
                .slice(0, 3),
            firstElement = {};

        //auxilliary functions

        /**
         * "ParsedElement" is the
         *
         * @constructor for ParsedElements, the components of the array returned by parseBarcode
         * @param {String} elementAI        the AI of the recognized element
         * @param {String} elementDataTitle the title of the element, i.e. its short description
         * @param {String} elementType      a one-letter string describing the type of the element.
         *                                  allowed values are
         *                                  "S" for strings,
         *                                  "N" for numbers and
         *                                  "D" for dates
         */
        function ParsedElement(elementAI, elementDataTitle, elementType) {
            /* defines the object which represents a single element
             */
            this.ai = elementAI; //application identifier
            this.dataTitle = elementDataTitle; //title
            switch (elementType) {
                case "S":
                    this.data = ""; // the contents
                    break;
                case "N":
                    this.data = 0;
                    break;
                case "D":
                    this.data = new Date();
                    this.data.setHours(0, 0, 0, 0);
                    break;
                default:
                    this.data = "";
                    break;
            }
            this.unit = ""; // some elements are accompaigned by an unit of
            // measurement or currency
        }

        /**
         *
         * ================== BEGIN of identifyAI =======================
         *
         * does the main work:
         *   what AI is in the beginning of the restOfBarcode?
         *     If identified:
         *       which function to call with
         *       which parameters to parse the element?[Description]]
         * @param   {String} codestring a string; the function tries to
         *                   identify an AI in the beginning of this string
         * @returns {Object} if it succeeds in identifying an AI the
         *                   ParsedElement is returned, together with the
         *                   still unparsed rest of codestring.
         */
        function identifyAI(codestring) {
            // find first identifier. AIs have a minimum length of 2
            // digits, some have 3, some even 4.
            var firstNumber = codestring.slice(0, 1),
                secondNumber = codestring.slice(1, 2),
                thirdNumber = "",
                fourthNumber = "",
                codestringToReturn = "",
                codestringLength = codestring.length,
                elementToReturn = "";

            /**
             * ============ auxiliary functions for identifyAI =============
             */
            /**
             * some data items are followed by an FNC even in case of
             * fixed length, so the codestringToReturn may have
             * leading FNCs.
             *
             * This function eleminates these leading FNCs.
             *
             * @param   {String} stringToClean string which has to be cleaned
             * @returns {String} the cleaned string
             */
            function cleanCodestring(stringToClean) {
                //
                var firstChar = stringToClean.slice(0, 1);
                while (firstChar === fncChar) {
                    stringToClean = stringToClean.slice(1, stringToClean.length);
                    firstChar = stringToClean.slice(0, 1);
                }
                return stringToClean;
            }
            /**
             * Used for calculating numbers which are given as string
             * with a given number of fractional decimals.
             *
             * To avoid conversion errors binary <-> decimal I _don't_
             * just divide by 10 numberOfFractionals times.
             */
            function parseFloatingPoint(stringToParse, numberOfFractionals) {
                var auxString = "",
                    offset = stringToParse.length - numberOfFractionals,
                    auxFloat = 0.0;

                auxString = stringToParse.slice(0, offset) +
                    '.' +
                    stringToParse.slice(offset, stringToParse.length);
                try {
                    auxFloat = parseFloat(auxString);
                } catch (e36) {
                    throw "36";
                }

                return auxFloat;
            }
            /**
             * ======== END of auxiliary function for identifyAI =======
             */

            /**
             *
             * ======== BEGIN of parsing functions in identifyAI =======
             *
             * Some functions to parse the various GS1 formats. They
             * create a new ParsedElement and set its properties.
             *
             * They all modify the variables "elementToReturn" and
             * "codestringToReturn".
             */

            /**
             * dates in GS1-elements have the format "YYMMDD".
             * This function generates a new ParsedElement and tries to fill a
             * JS-date into the "data"-part.
             * @param {String} ai    the AI to use for the ParsedElement
             * @param {String} title the title to use for the ParsedElement
             */
            function parseDate(ai, title) {
                elementToReturn = new ParsedElement(ai, title, "D");
                var offSet = ai.length,
                    dateYYMMDD = codestring.slice(offSet, offSet + 6),
                    yearAsNumber = 0,
                    monthAsNumber = 0,
                    dayAsNumber = 0;
                var currentCCYY = new Date().getUTCFullYear(),
                    currentYear = currentCCYY % 100,
                    currentCentury = currentCCYY - currentYear,
                    yearGap = 0;

                try {
                    yearAsNumber = parseInt(dateYYMMDD.slice(0, 2), 10);
                    yearGap = yearAsNumber - currentYear;
                } catch (e33) {
                    throw "33";
                }

                try {
                    monthAsNumber = parseInt(dateYYMMDD.slice(2, 4), 10);
                } catch (e34) {
                    throw "34";
                }

                try {
                    dayAsNumber = parseInt(dateYYMMDD.slice(4, 6), 10);
                } catch (e35) {
                    throw "35";
                }
                // Year determination
                //   use a sliding window going from -49 years to +50 years
                //   as specified in section 7.1.2. (see: https://ref.gs1.org/standards/genspecs/)
                //
                //                   2024         2074
                //     ----------------|------------]------->
                //
                //   In 2024, the horizon for 21th century is 2074
                //     
                //   Example: 
                //     If 2-digits year is 78 -> 1978 (closer to 2024 than 2078)
                if (yearGap >= 51) {
                    yearAsNumber = yearAsNumber + currentCentury - 100;
                } else if (yearGap <= -50) {
                    yearAsNumber = yearAsNumber + currentCentury + 100;
                } else {
                    yearAsNumber = yearAsNumber + currentCentury;
                }

                if (dayAsNumber > 0) {
                    // Dates in Javascript are funny. Months start at 0. Days, on the other
                    // hand, start at 1. We need to decrement the month by 1. Otherwise,
                    // the date will be wrong by one month. E.g., month 11 and day 15
                    // become Dec 15th. If the day is equal to 0, however, we use a Javascript
                    // trick to turn the date into the last day of the previous month.
                    // So, e.g., month 11 and day 0 become Nov 30th.
                    monthAsNumber--;
                }

                elementToReturn.data.setFullYear(yearAsNumber, monthAsNumber, dayAsNumber);
                codestringToReturn = codestring.slice(offSet + 6, codestringLength);
                elementToReturn.raw = codestring.slice(offSet, offSet + 6);
            }

            /**
             * simple: the element has a fixed length AND is not followed by an FNC1.
             * @param {String} ai     the AI to use
             * @param {String} title  its title, i.e. its short description
             * @param {Number} length the fixed length
             */
            function parseFixedLength(ai, title, length) {

                elementToReturn = new ParsedElement(ai, title, "S");
                var offSet = ai.length;
                elementToReturn.data = codestring.slice(offSet, length + offSet);
                codestringToReturn = codestring.slice(length + offSet, codestringLength);
                elementToReturn.raw = codestring.slice(offSet, offSet + length);
            }

            /**
             * tries to parse an element of variable length
             * some fixed length AIs are terminated by FNC1, so this function
             * is used even for fixed length items
             * @param {String} ai    the AI to use
             * @param {String} title its title, i.e. its short description
             */
            function parseVariableLength(ai, title) {
                //
                elementToReturn = new ParsedElement(ai, title, "S");
                var offSet = ai.length,
                    posOfFNC = codestring.indexOf(fncChar);

                if (posOfFNC === -1) { //we've got the last element of the barcode
                    elementToReturn.data = codestring.slice(offSet, codestringLength);
                    elementToReturn.raw = codestring.slice(offSet);
                    codestringToReturn = "";
                } else {
                    elementToReturn.data = codestring.slice(offSet, posOfFNC);
                    codestringToReturn = codestring.slice(posOfFNC + 1, codestringLength);
                    elementToReturn.raw = codestring.slice(offSet, posOfFNC);
                }

            }

            /**
             * the place of the decimal fraction is given by the fourth number, that's
             * the first after the identifier itself.
             *
             * All of theses elements have a length of 6 characters.
             * @param {String} ai_stem      the first digits of the AI, _not_ the fourth digit
             * @param {Number} fourthNumber the 4th number indicating the count of valid fractionals
             * @param {String} title        the title of the AI
             * @param {String} unit         often these elements have an implicit unit of measurement
             */
            function parseFixedLengthMeasure(ai_stem, fourthNumber, title, unit) {
                //
                elementToReturn = new ParsedElement(ai_stem + fourthNumber, title, "N");
                var offSet = ai_stem.length + 1,
                    numberOfDecimals = parseInt(fourthNumber, 10),
                    numberPart = codestring.slice(offSet, offSet + 6);

                elementToReturn.data = parseFloatingPoint(numberPart, numberOfDecimals);

                elementToReturn.unit = unit;
                codestringToReturn = codestring.slice(offSet + 6, codestringLength);
                elementToReturn.raw = codestring.slice(offSet, offSet + 6);
            }

            /**
             * parses data elements of variable length, which additionally have
             *
             * - an indicator for the number of valid decimals
             * - an implicit unit of measurement
             *
             * These data elements contain e.g. a weight or length.
             *
             */
            function parseVariableLengthMeasure(ai_stem, fourthNumber, title, unit) {
                // the place of the decimal fraction is given by the fourth number, that's
                // the first after the identifier itself.
                elementToReturn = new ParsedElement(ai_stem + fourthNumber, title, "N");
                var offSet = ai_stem.length + 1,
                    posOfFNC = codestring.indexOf(fncChar),
                    numberOfDecimals = parseInt(fourthNumber, 10),
                    numberPart = "";

                if (posOfFNC === -1) {
                    numberPart = codestring.slice(offSet, codestringLength);
                    elementToReturn.raw = codestring.slice(offSet);
                    codestringToReturn = "";
                } else {
                    numberPart = codestring.slice(offSet, posOfFNC);
                    codestringToReturn = codestring.slice(posOfFNC + 1, codestringLength);
                    elementToReturn.raw = codestring.slice(offSet, posOfFNC);
                }
                // adjust decimals according to fourthNumber:

                elementToReturn.data = parseFloatingPoint(numberPart, numberOfDecimals);
                elementToReturn.unit = unit;
            }

            /**
             * parses data elements of variable length, which additionally have
             *
             * - an indicator for the number of valid decimals
             * - an explicit unit of measurement
             *
             * These data element contain amounts to pay or prices.
             *
             */
            function parseVariableLengthWithISONumbers(ai_stem, fourthNumber, title) {
                // an element of variable length, representing a number, followed by
                // some ISO-code.
                elementToReturn = new ParsedElement(ai_stem + fourthNumber, title, "N");
                var offSet = ai_stem.length + 1,
                    posOfFNC = codestring.indexOf(fncChar),
                    numberOfDecimals = parseInt(fourthNumber, 10),
                    isoPlusNumbers = "",
                    numberPart = "";

                if (posOfFNC === -1) {
                    isoPlusNumbers = codestring.slice(offSet, codestringLength);
                    elementToReturn.raw = codestring.slice(offSet);
                    codestringToReturn = "";
                } else {
                    isoPlusNumbers = codestring.slice(offSet, posOfFNC);
                    codestringToReturn = codestring.slice(posOfFNC + 1, codestringLength);
                    elementToReturn.raw = codestring.slice(offSet, posOfFNC);
                }
                // cut off ISO-Code
                numberPart = isoPlusNumbers.slice(3, isoPlusNumbers.length);
                elementToReturn.data = parseFloatingPoint(numberPart, numberOfDecimals);

                elementToReturn.unit = isoPlusNumbers.slice(0, 3);

            }
            /**
             * parses data elements of variable length, which additionally have
             *
             * - an explicit unit of measurement or reference
             *
             * These data element contain countries, authorities within countries.
             *
             */
            function parseVariableLengthWithISOChars(ai_stem, title) {
                // an element of variable length, representing a sequence of chars, followed by
                // some ISO-code.
                elementToReturn = new ParsedElement(ai_stem, title, "S");
                var offSet = ai_stem.length,
                    posOfFNC = codestring.indexOf(fncChar),
                    isoPlusNumbers = "";

                if (posOfFNC === -1) {
                    isoPlusNumbers = codestring.slice(offSet, codestringLength);
                    elementToReturn.raw = codestring.slice(offSet);
                    codestringToReturn = "";
                } else {
                    isoPlusNumbers = codestring.slice(offSet, posOfFNC);
                    codestringToReturn = codestring.slice(posOfFNC + 1, codestringLength);
                    elementToReturn.raw = codestring.slice(offSet, posOfFNC);
                }
                // cut off ISO-Code
                elementToReturn.data = isoPlusNumbers.slice(3, isoPlusNumbers.length);
                elementToReturn.unit = isoPlusNumbers.slice(0, 3);
            }
            /**
             *
             * ======== END of parsing functions in identifyAI =======
             *
             */
            /**
             *
             * ======= BEGIN of the big switch =======================
             *
             * and now a very big "switch", which tries to find a valid
             * AI within the first digits of the codestring.
             *
             * See the documentation for an explanation why it is made
             * this way (and not by some configuration file).
             */

            switch (firstNumber) {
                case "0":
                    switch (secondNumber) {
                        case "0":
                            // SSCC (Serial Shipping Container Code)
                            parseFixedLength("00", "SSCC", 18);
                            break;
                        case "1":
                            // Global Trade Item Number (GTIN)
                            parseFixedLength("01", "GTIN", 14);
                            break;
                        case "2":
                            // GTIN of Contained Trade Items
                            parseFixedLength("02", "CONTENT", 14);
                            break;
                        default:
                            throw "01";
                    }
                    break;
                case "1":
                    switch (secondNumber) {
                        case "0":
                            // Batch or Lot Number
                            parseVariableLength("10", "BATCH/LOT");
                            break;
                        case "1":
                            // Production Date (YYMMDD)
                            parseDate("11", "PROD DATE");
                            break;
                        case "2":
                            // Due Date (YYMMDD)
                            parseDate("12", "DUE DATE");
                            break;
                        case "3":
                            // Packaging Date (YYMMDD)
                            parseDate("13", "PACK DATE");
                            break;
                        // AI "14" isn't defined
                        case "5":
                            // Best Before Date (YYMMDD)
                            parseDate("15", "BEST BEFORE or BEST BY");
                            break;
                        case "6":
                            // Sell By Date (YYMMDD)
                            parseDate("16", "SELL BY");
                            break;
                        case "7":
                            // Expiration Date (YYMMDD)
                            parseDate("17", "USE BY OR EXPIRY");
                            break;
                        default:
                            throw "02";
                    }
                    break;
                case "2":
                    switch (secondNumber) {
                        case "0":
                            // Variant Number
                            parseFixedLength("20", "VARIANT", 2);
                            break;
                        case "1":
                            // Serial Number
                            parseVariableLength("21", "SERIAL");
                            break;
                        case "2":
                            // Consumer product variant
                            parseVariableLength("22", "CPV");
                            break;
                        case "3":
                            // from now, the third number matters:
                            thirdNumber = codestring.slice(2, 3);
                            switch (thirdNumber) {
                                case "5":
                                    // Third Party Controlled, Serialised Extension of Global Trade Item Number (GTIN) (TPX)
                                    parseVariableLength("235", "TPX");
                                    break;
                            }
                            break;
                        case "4":
                            // from now, the third number matters:
                            thirdNumber = codestring.slice(2, 3);
                            switch (thirdNumber) {
                                case "0":
                                    // Additional Item Identification
                                    parseVariableLength("240", "ADDITIONAL ID");
                                    break;
                                case "1":
                                    // Customer Part Number
                                    parseVariableLength("241", "CUST. PART NO.");
                                    break;
                                case "2":
                                    // Made-to-Order Variation Number
                                    parseVariableLength("242", "MTO VARIANT");
                                    break;
                                case "3":
                                    // Packaging Component Number
                                    parseVariableLength("243", "PCN");
                                    break;
                                default:
                                    throw "03";
                            }
                            break;
                        case "5":
                            // from now, the third number matters:
                            thirdNumber = codestring.slice(2, 3);
                            switch (thirdNumber) {
                                case "0":
                                    // Secondary Serial Number
                                    parseVariableLength("250", "SECONDARY SERIAL");
                                    break;
                                case "1":
                                    // Reference to Source Entity
                                    parseVariableLength("251", "REF. TO SOURCE");
                                    break;
                                // AI "252" isn't defined
                                case "3":
                                    // Global Document Type Identifier (GDTI)
                                    parseVariableLength("253", "GDTI");
                                    break;
                                case "4":
                                    // GLN Extension Component
                                    parseVariableLength("254", "GLN EXTENSION COMPONENT");
                                    break;
                                case "5":
                                    // Global Coupon Number (GCN)
                                    parseVariableLength("255", "GCN");
                                    break;
                                default:
                                    throw "04";
                            }
                            break;
                        // AI "26" to "29" aren't defined
                        default:
                            throw "05";
                    }
                    break;
                case "3":
                    switch (secondNumber) {
                        case "0":
                            // Count of Items (Variable Measure Trade Item)
                            parseVariableLength("30", "VAR. COUNT");
                            break;
                        case "1":
                            // third and fourth numbers matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    // Net weight, kilograms (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("310", fourthNumber, "NET WEIGHT (kg)", "KGM");
                                    break;
                                case "1":
                                    // Length or first dimension, metres (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("311", fourthNumber, "LENGTH (m)", "MTR");
                                    break;
                                case "2":
                                    // Width, diameter, or second dimension, metres (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("312", fourthNumber, "WIDTH (m)", "MTR");
                                    break;
                                case "3":
                                    // Depth, thickness, height, or third dimension, metres (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("313", fourthNumber, "HEIGHT (m)", "MTR");
                                    break;
                                case "4":
                                    // Area, square metres (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("314", fourthNumber, "AREA (m2)", "MTK");
                                    break;
                                case "5":
                                    // Net volume, litres (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("315", fourthNumber, "NET VOLUME (l)", "LTR");
                                    break;
                                case "6":
                                    // Net volume, cubic metres (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("316", fourthNumber, "NET VOLUME (m3)", "MTQ");
                                    break;
                                default:
                                    throw "06";
                            }
                            break;
                        case "2":
                            // third and fourth numbers matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    // Net weight, pounds (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("320", fourthNumber, "NET WEIGHT (lb)", "LBR");
                                    break;
                                case "1":
                                    // Length or first dimension, inches (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("321", fourthNumber, "LENGTH (i)", "INH");
                                    break;
                                case "2":
                                    // Length or first dimension, feet (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("322", fourthNumber, "LENGTH (f)", "FOT");
                                    break;
                                case "3":
                                    // Length or first dimension, yards (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("323", fourthNumber, "LENGTH (y)", "YRD");
                                    break;
                                case "4":
                                    // Width, diameter, or second dimension, inches (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("324", fourthNumber, "WIDTH (i)", "INH");
                                    break;
                                case "5":
                                    // Width, diameter, or second dimension, feet (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("325", fourthNumber, "WIDTH (f)", "FOT");
                                    break;
                                case "6":
                                    // Width, diameter, or second dimension, yards (Variable Measure Trade Item
                                    parseFixedLengthMeasure("326", fourthNumber, "WIDTH (y)", "YRD");
                                    break;
                                case "7":
                                    // Depth, thickness, height, or third dimension, inches (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("327", fourthNumber, "HEIGHT (i)", "INH");
                                    break;
                                case "8":
                                    // Depth, thickness, height, or third dimension, feet (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("328", fourthNumber, "HEIGHT (f)", "FOT");
                                    break;
                                case "9":
                                    // Depth, thickness, height, or third dimension, yards (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("329", fourthNumber, "HEIGHT (y)", "YRD");
                                    break;
                                default:
                                    throw "07";
                            }
                            break;
                        case "3":
                            // third and fourth numbers matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    // Logistic weight, kilograms
                                    parseFixedLengthMeasure("330", fourthNumber, "GROSS WEIGHT (kg)", "KGM");
                                    break;
                                case "1":
                                    // Length or first dimension, metres
                                    parseFixedLengthMeasure("331", fourthNumber, "LENGTH (m), log", "MTR");
                                    break;
                                case "2":
                                    // Width, diameter, or second dimension, metres
                                    parseFixedLengthMeasure("332", fourthNumber, "WIDTH (m), log", "MTR");
                                    break;
                                case "3":
                                    // Depth, thickness, height, or third dimension, metres
                                    parseFixedLengthMeasure("333", fourthNumber, "HEIGHT (m), log", "MTR");
                                    break;
                                case "4":
                                    // Area, square metres
                                    parseFixedLengthMeasure("334", fourthNumber, "AREA (m2), log", "MTK");
                                    break;
                                case "5":
                                    // Logistic volume, litres
                                    parseFixedLengthMeasure("335", fourthNumber, "VOLUME (l), log", "LTR");
                                    break;
                                case "6":
                                    // Logistic volume, cubic metres
                                    parseFixedLengthMeasure("336", fourthNumber, "VOLUME (m3), log", "MTQ");
                                    break;
                                case "7":
                                    // Kilograms per square metre, yes, the ISO code for this _is_ "28".
                                    parseFixedLengthMeasure("337", fourthNumber, "KG PER m²", "28");
                                    break;
                                default:
                                    throw "08";
                            }
                            break;
                        case "4":
                            // third and fourth numbers matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    // Logistic weight, pounds
                                    parseFixedLengthMeasure("340", fourthNumber, "GROSS WEIGHT (lb)", "LBR");
                                    break;
                                case "1":
                                    // Length or first dimension, inches
                                    parseFixedLengthMeasure("341", fourthNumber, "LENGTH (i), log", "INH");
                                    break;
                                case "2":
                                    // Length or first dimension, feet
                                    parseFixedLengthMeasure("342", fourthNumber, "LENGTH (f), log", "FOT");
                                    break;
                                case "3":
                                    // Length or first dimension, yards
                                    parseFixedLengthMeasure("343", fourthNumber, "LENGTH (y), log", "YRD");
                                    break;
                                case "4":
                                    // Width, diameter, or second dimension, inches
                                    parseFixedLengthMeasure("344", fourthNumber, "WIDTH (i), log", "INH");
                                    break;
                                case "5":
                                    // Width, diameter, or second dimension, feet
                                    parseFixedLengthMeasure("345", fourthNumber, "WIDTH (f), log", "FOT");
                                    break;
                                case "6":
                                    // Width, diameter, or second dimension, yard
                                    parseFixedLengthMeasure("346", fourthNumber, "WIDTH (y), log", "YRD");
                                    break;
                                case "7":
                                    // Depth, thickness, height, or third dimension, inches
                                    parseFixedLengthMeasure("347", fourthNumber, "HEIGHT (i), log", "INH");
                                    break;
                                case "8":
                                    // Depth, thickness, height, or third dimension, feet
                                    parseFixedLengthMeasure("348", fourthNumber, "HEIGHT (f), log", "FOT");
                                    break;
                                case "9":
                                    // Depth, thickness, height, or third dimension, yards
                                    parseFixedLengthMeasure("349", fourthNumber, "HEIGHT (y), log", "YRD");
                                    break;
                                default:
                                    throw "09";
                            }
                            break;
                        case "5":
                            // third and fourth numbers matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    // Area, square inches (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("350", fourthNumber, "AREA (i2)", "INK");
                                    break;
                                case "1":
                                    // Area, square feet (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("351", fourthNumber, "AREA (f2)", "FTK");
                                    break;
                                case "2":
                                    // Area, square yards (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("352", fourthNumber, "AREA (y2)", "YDK");
                                    break;
                                case "3":
                                    // Area, square inches
                                    parseFixedLengthMeasure("353", fourthNumber, "AREA (i2), log", "INK");
                                    break;
                                case "4":
                                    // Area, square feet
                                    parseFixedLengthMeasure("354", fourthNumber, "AREA (f2), log", "FTK");
                                    break;
                                case "5":
                                    // Area, square yards
                                    parseFixedLengthMeasure("355", fourthNumber, "AREA (y2), log", "YDK");
                                    break;
                                case "6":
                                    // Net weight, troy ounces (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("356", fourthNumber, "NET WEIGHT (t)", "APZ");
                                    break;
                                case "7":
                                    // Net weight (or volume), ounces (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("357", fourthNumber, "NET VOLUME (oz)", "ONZ");
                                    break;
                                default:
                                    throw "10";
                            }
                            break;
                        case "6":
                            // third and fourth numbers matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    // Net volume, quarts (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("360", fourthNumber, "NET VOLUME (q)", "QT");
                                    break;
                                case "1":
                                    // Net volume, gallons U.S. (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("361", fourthNumber, "NET VOLUME (g)", "GLL");
                                    break;
                                case "2":
                                    // Logistic volume, quarts
                                    parseFixedLengthMeasure("362", fourthNumber, "VOLUME (q), log", "QT");
                                    break;
                                case "3":
                                    // Logistic volume, gallons U.S.
                                    parseFixedLengthMeasure("363", fourthNumber, "VOLUME (g), log", "GLL");
                                    break;
                                case "4":
                                    // Net volume, cubic inches (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("364", fourthNumber, "VOLUME (i3)", "INQ");
                                    break;
                                case "5":
                                    // Net volume, cubic feet (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("365", fourthNumber, "VOLUME (f3)", "FTQ");
                                    break;
                                case "6":
                                    // Net volume, cubic yards (Variable Measure Trade Item)
                                    parseFixedLengthMeasure("366", fourthNumber, "VOLUME (y3)", "YDQ");
                                    break;
                                case "7":
                                    // Logistic volume, cubic inches
                                    parseFixedLengthMeasure("367", fourthNumber, "VOLUME (i3), log", "INQ");
                                    break;
                                case "8":
                                    // Logistic volume, cubic feet
                                    parseFixedLengthMeasure("368", fourthNumber, "VOLUME (f3), log", "FTQ");
                                    break;
                                case "9":
                                    // Logistic volume, cubic yards
                                    parseFixedLengthMeasure("369", fourthNumber, "VOLUME (y3), log", "YDQ");
                                    break;
                                default:
                                    throw "11";
                            }
                            break;
                        case "7":
                            // Count of Trade Items
                            parseVariableLength("37", "COUNT");
                            break;
                        // AI "38" isn't defined
                        case "9":
                            // third and fourth numbers matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    // Applicable Amount Payable, local currency
                                    parseVariableLengthMeasure("390", fourthNumber, "AMOUNT", "");
                                    break;
                                case "1":
                                    // Applicable Amount Payable with ISO Currency Code
                                    parseVariableLengthWithISONumbers("391", fourthNumber, "AMOUNT");
                                    break;
                                case "2":
                                    // Applicable Amount Payable, single monetary area (Variable Measure Trade Item)
                                    parseVariableLengthMeasure("392", fourthNumber, "PRICE", "");
                                    break;
                                case "3":
                                    // Applicable Amount Payable with ISO Currency Code (Variable Measure Trade Item)
                                    parseVariableLengthWithISONumbers("393", fourthNumber, "PRICE");
                                    break;
                                case "4":
                                    // Percentage discount of a coupon
                                    parseVariableLengthMeasure("394", fourthNumber, "COUPON DISCOUNT", "PRCNT OFF");
                                    break;
                                case "5":
                                    // Amount Payable per unit of measure single monetary area (variable measure trade item)
                                    parseVariableLengthMeasure("395", fourthNumber, "AMOUNT PAYABLE", "PRICE/UoM");
                                    break;
                                default:
                                    throw "12";
                            }
                            break;
                        default:
                            throw "13";
                    }
                    break;
                case "4":
                    switch (secondNumber) {
                        case "0":
                            // third number matters:
                            thirdNumber = codestring.slice(2, 3);
                            switch (thirdNumber) {
                                case "0":
                                    // Customer's Purchase Order Number
                                    parseVariableLength("400", "ORDER NUMBER");
                                    break;
                                case "1":
                                    // Global Identification Number for Consignment (GINC)
                                    parseVariableLength("401", "GINC");
                                    break;
                                case "2":
                                    // Global Shipment Identification Number (GSIN)
                                    parseVariableLength("402", "GSIN"); // should be 17 digits long
                                    break;
                                case "3":
                                    // Routing Code
                                    parseVariableLength("403", "ROUTE");
                                    break;
                                default:
                                    throw "14";
                            }
                            break;
                        case "1":
                            //third number matters:
                            thirdNumber = codestring.slice(2, 3);
                            switch (thirdNumber) {
                                case "0":
                                    // Ship to - Deliver to Global Location Number
                                    parseFixedLength("410", "SHIP TO LOC", 13);
                                    break;
                                case "1":
                                    // Bill to - Invoice to Global Location Number
                                    parseFixedLength("411", "BILL TO", 13);
                                    break;
                                case "2":
                                    // Purchased from Global Location Number
                                    parseFixedLength("412", "PURCHASE FROM", 13);
                                    break;
                                case "3":
                                    // Ship for - Deliver for - Forward to Global Location Number
                                    parseFixedLength("413", "SHIP FOR LOC", 13);
                                    break;
                                case "4":
                                    // Ship for - Deliver for - Forward to Global Location Number
                                    parseFixedLength("414", "LOC No", 13);
                                    break;
                                case "5":
                                    // Ship for - Deliver for - Forward to Global Location Number
                                    parseFixedLength("415", "PAY TO", 13);
                                    break;
                                case "6":
                                    // Ship for - Deliver for - Forward to Global Location Number
                                    parseFixedLength("416", "PROD/SERV LOC", 13);
                                    break;
                                case "7":
                                    // Ship for - Deliver for - Forward to Global Location Number
                                    parseFixedLength("417", "PARTY", 13);
                                    break;
                                default:
                                    throw "15";
                            }
                            break;
                        case "2":
                            //third number matters:
                            thirdNumber = codestring.slice(2, 3);
                            switch (thirdNumber) {
                                case "0":
                                    // Ship to - Deliver to Postal Code Within a Single Postal Authority
                                    parseVariableLength("420", "SHIP TO POST");
                                    break;
                                case "1":
                                    // Ship to - Deliver to Postal Code with ISO Country Code
                                    parseVariableLengthWithISOChars("421", "SHIP TO POST");
                                    break;
                                case "2":
                                    // Country of Origin of a Trade Item
                                    parseFixedLength("422", "ORIGIN", 3);
                                    break;
                                case "3":
                                    // Country of Initial Processing
                                    // Up to 5 3-digit ISO-countrycodes
                                    parseVariableLength("423", "COUNTRY - INITIAL PROCESS.");
                                    break;
                                case "4":
                                    // Country of Processing
                                    parseFixedLength("424", "COUNTRY - PROCESS.", 3);
                                    break;
                                case "5":
                                    // Country of Disassembly
                                    parseFixedLength("425", "COUNTRY - DISASSEMBLY", 3);
                                    break;
                                case "6":
                                    // Country Covering full Process Chain
                                    parseFixedLength("426", "COUNTRY – FULL PROCESS", 3);
                                    break;
                                case "7":
                                    // Country Subdivision of Origin
                                    parseVariableLength("427", "ORIGIN SUBDIVISION");
                                    break;
                                default:
                                    throw "16";
                            }
                            break;

                        case "3":
                            //third and fourth number matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Ship-to - Deliver-to Company name
                                            parseVariableLength("4300", "SHIP TO COMP");
                                            break;
                                        case "1":
                                            // Ship-to - Deliver-to contact name
                                            parseVariableLength("4301", "SHIP TO NAME");
                                            break;
                                        case "2":
                                            // Ship-to - Deliver-to address line 1
                                            parseVariableLength("4302", "SHIP TO ADD1");
                                            break;
                                        case "3":
                                            // Ship-to - Deliver-to address line 2
                                            parseVariableLength("4303", "SHIP TO ADD2");
                                            break;
                                        case "4":
                                            // Ship-to - Deliver-to suburb
                                            parseVariableLength("4304", "SHIP TO SUB");
                                            break;
                                        case "5":
                                            // Ship-to - Deliver-to locality
                                            parseVariableLength("4305", "SHIP TO LOC");
                                            break;
                                        case "6":
                                            // Ship-to - Deliver-to region
                                            parseVariableLength("4306", "SHIP TO REG");
                                            break;
                                        case "7":
                                            // Ship-to - Deliver-to country code
                                            parseFixedLength("4307", "SHIP TO COUNTRY", 2);
                                            break;
                                        case "8":
                                            // Ship-to - Deliver-to telephone number
                                            parseVariableLength("4308", "SHIP TO PHONE");
                                            break;
                                        case "9":
                                            // Ship-to - Deliver-to GEO location
                                            parseFixedLength("4309", "SHIP TO GEO", 20);
                                            break;
                                    }
                                    break;

                                case "1":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Return-to company name
                                            parseVariableLength("4310", "RTN TO COMP");
                                            break;
                                        case "1":
                                            // Return-to contact name
                                            parseVariableLength("4311", "RTN TO NAME");
                                            break;
                                        case "2":
                                            // Return-to address line 1
                                            parseVariableLength("4312", "RTN TO ADD1");
                                            break;
                                        case "3":
                                            // Return-to address line 2
                                            parseVariableLength("4313", "RTN TO ADD2");
                                            break;
                                        case "4":
                                            // Return-to suburb
                                            parseVariableLength("4314", "RTN TO SUB");
                                            break;
                                        case "5":
                                            // Return-to locality
                                            parseVariableLength("4315", "RTN TO LOC");
                                            break;
                                        case "6":
                                            // Return-to region
                                            parseVariableLength("4316", "RTN TO REG");
                                            break;
                                        case "7":
                                            // Return-to country code
                                            parseFixedLength("4317", "RTN TO COUNTRY", 2);
                                            break;
                                        case "8":
                                            // Return-to postal code
                                            parseVariableLength("4318", "RTN TO POST");
                                            break;
                                        case "9":
                                            // Return-to telephone number 
                                            parseVariableLength("4319", "RTN TO PHONE");
                                            break;
                                    }
                                    break;

                                case "2":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Service code description
                                            parseVariableLength("4320", "SRV DESCRIPTION");
                                            break;
                                        case "1":
                                            // Dangerous goods flag
                                            parseFixedLength("4321", "DANGEROUS GOODS", 1);
                                            break;
                                        case "2":
                                            // 	Authority to leave
                                            parseFixedLength("4322", "AUTH LEAVE", 1);
                                            break;
                                        case "3":
                                            // Signature required flag
                                            parseFixedLength("4323", "SIG REQUIRED", 1);
                                            break;
                                        case "4":
                                            // Not before delivery date time
                                            parseVariableLength("4324", "NBEF DEL DT");
                                            break;
                                        case "5":
                                            // Not after delivery date time
                                            parseVariableLength("4325", "NAFT DEL DT");
                                            break;
                                        case "6":
                                            // Release date
                                            parseDate("4326", "REL DATE");
                                            break;
                                    }
                                    break;

                                case "3":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Maximum temperature in Fahrenheit
                                            parseVariableLength("4330", "MAX TEMP F");
                                            break;
                                        case "1":
                                            // Maximum temperature in Celsius
                                            parseVariableLength("4331", "MAX TEMP C");
                                            break;
                                        case "2":
                                            // Minimum temperature in Fahrenheit
                                            parseVariableLength("4332", "MIN TEMP F");
                                            break;
                                        case "3":
                                            // Minimum temperature in Celsius
                                            parseVariableLength("4333", "MIN TEMP C");
                                            break;
                                    }
                                    break;

                                default:
                                    throw "16";
                            }

                        default:
                            throw "17";
                    }
                    break;
                // first digits 5 and 6 are not used
                case "7":
                    switch (secondNumber) {
                        case "0":
                            //third and fourth number matter:
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    switch (fourthNumber) {
                                        case "1":
                                            // NATO Stock Number (NSN)
                                            parseVariableLength("7001", "NSN"); //should be 13 digits long
                                            break;
                                        case "2":
                                            // UN/ECE Meat Carcasses and Cuts Classification
                                            parseVariableLength("7002", "MEAT CUT");
                                            break;
                                        case "3":
                                            // Expiration Date and Time
                                            parseVariableLength("7003", "EXPIRY TIME"); //should be 10 digits long
                                            break;
                                        case "4":
                                            // Active Potency
                                            parseVariableLength("7004", "ACTIVE POTENCY");
                                            break;
                                        case "5":
                                            // Catch area
                                            parseVariableLength("7005", "CATCH AREA");
                                            break;
                                        case "6":
                                            // First freeze date
                                            parseDate("7006", "FIRST FREEZE DATE");
                                            break;
                                        case "7":
                                            // Harvest date
                                            parseDate("7007", "HARVEST DATE");
                                            break;
                                        case "8":
                                            // Species for fishery purposes
                                            parseVariableLength("7008", "AQUATIC SPECIES");
                                            break;
                                        case "9":
                                            // Fishing gear type
                                            parseVariableLength("7009", "FISHING GEAR TYPE");
                                            break;
                                        default:
                                            throw "18";
                                    }
                                    break;
                                case "1":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Production method
                                            parseVariableLength("7010", "PROD METHOD");
                                            break;
                                    }
                                case "1":
                                    // Test by date (and optional time)
                                    parseVariableLength("7011", "TEST BY DATE");
                                    break;
                            }
                            break;
                        case "2":
                            switch (fourthNumber) {
                                case "0":
                                    // Refurbishment lot ID
                                    parseVariableLength("7020", "REFURB LOT");
                                    break;
                                case "1":
                                    // Functional status
                                    parseVariableLength("7021", "FUNC STAT");
                                    break;
                                case "2":
                                    // Revision status
                                    parseVariableLength("7022", "REV STAT");
                                    break;
                                case "3":
                                    // Global Individual Asset Identifier (GIAI) of an assembly
                                    parseVariableLength("7023", "GIAI - ASSEMBLY");
                                    break;
                            }
                            break;
                        case "3":
                            // Approval Number of Processor with ISO Country Code

                            // Title and stem for parsing are build from 4th number:

                            parseVariableLengthWithISOChars("703" + fourthNumber, "PROCESSOR # " + fourthNumber);
                            break;
                        case "4":
                            switch (fourthNumber) {
                                case "0":
                                    // GS1 UIC with Extension 1 and Importer index
                                    parseFixedLength("7040", "UIC+EXT", 4);
                                    break;
                            }
                            break;

                        default:
                            throw "19";
                    }
                    break;

                case "1":
                    thirdNumber = codestring.slice(2, 3);
                    switch (thirdNumber) {
                        case "0":
                            // National Healthcare Reimbursement Number (NHRN) – Germany PZN
                            parseVariableLength("710", "NHRN PZN");
                            break;
                        case "1":
                            // National Healthcare Reimbursement Number (NHRN) – France CIP
                            parseVariableLength("711", "NHRN CIP");
                            break;
                        case "2":
                            // National Healthcare Reimbursement Number (NHRN) – Spain CN
                            parseVariableLength("712", "NHRN CN");
                            break;
                        case "3":
                            // National Healthcare Reimbursement Number (NHRN) – Brasil DRN
                            parseVariableLength("713", "NHRN DRN");
                            break;
                        case "4":
                            // National Healthcare Reimbursement Number (NHRN) - Portugal AIM
                            parseVariableLength("714", "NHRN PT");
                            break;
                        case "5":
                            // National Healthcare Reimbursement Number (NHRN) - United States of America NDC
                            parseVariableLength("715", "NHRN NDC");
                            break;
                        default:
                            throw "20";
                    }
                    break;

                case "2":
                    //third and fourth number matter:
                    thirdNumber = codestring.slice(2, 3);
                    fourthNumber = codestring.slice(3, 4);

                    switch (thirdNumber) {
                        // 0, 1 and 2 are unused
                        case "3":
                            // Certification reference
                            parseVariableLength("723" + fourthNumber, "CERT # " + fourthNumber);
                            break;
                        case "4":
                            switch (fourthNumber) {
                                case "0":
                                    // Protocol ID
                                    parseVariableLength("7240", "PROTOCOL");
                                    break;
                                case "1":
                                    // AIDC media type
                                    parseFixedLength("7241", "AIDC MEDIA TYPE", 2);
                                    break;
                                case "2":
                                    // Version Control Number (VCN)
                                    parseVariableLength("7242", "VCN");
                                    break;
                            }
                        default:
                            throw "21";
                    }
                    break;
                case "8":
                    switch (secondNumber) {
                        case "0":
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);

                            switch (thirdNumber) {
                                case "0":
                                    switch (fourthNumber) {
                                        case "1":
                                            // Roll Products (Width, Length, Core Diameter, Direction, Splices)
                                            parseVariableLength("8001", "DIMENSIONS"); // should be 14 digits long
                                            break;
                                        case "2":
                                            // Cellular Mobile Telephone Identifier
                                            parseVariableLength("8002", "CMT No");
                                            break;
                                        case "3":
                                            // Global Returnable Asset Identifier (GRAI)
                                            parseVariableLength("8003", "GRAI"); // should contain at least 14 digits
                                            break;
                                        case "4":
                                            // Global Individual Asset Identifier (GIAI)
                                            parseVariableLength("8004", "GIAI");
                                            break;
                                        case "5":
                                            // Price Per Unit of Measure
                                            parseVariableLength("8005", "PRICE PER UNIT"); // should be 6 digits long
                                            break;
                                        case "6":
                                            // Identification of the Components of a Trade Item
                                            parseVariableLength("8006", "GCTIN"); // should be exactly 18 digits long
                                            break;
                                        case "7":
                                            // International Bank Account Number (IBAN)
                                            parseVariableLength("8007", "IBAN");
                                            break;
                                        case "8":
                                            // Date and Time of Production
                                            parseVariableLength("8008", "PROD TIME"); // should be exactly 12 digits long
                                            break;
                                        case "9":
                                            // Optically Readable Sensor Indicator
                                            parseVariableLength("8009", "OPTSEN");
                                            break;
                                        default:
                                            throw "22";
                                    }
                                    break;
                                case "1":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Component / Part Identifier (CPID)
                                            parseVariableLength("8010", "CPID");
                                            break;
                                        case "1":
                                            // Component / Part Identifier Serial Number (CPID SERIAL)
                                            parseVariableLength("8011", "CPID SERIAL");
                                            break;
                                        case "2":
                                            // Software version
                                            parseVariableLength("8012", "VERSION");
                                            break;
                                        case "3":
                                            // Global Model Number (GMN)
                                            parseVariableLength("8013", "GMN");
                                            break;

                                        // 4, 5 and 6 are unused

                                        case "7":
                                            // Global Service Relation Number to identify the relationship between an organisation offering services and the provider of services
                                            parseVariableLength("8017", "GSRN - PROVIDER"); // should be 18 digits long
                                            break;
                                        case "8":
                                            // Global Service Relation Number to identify the relationship between an organisation offering services and the recipient of services
                                            parseVariableLength("8018", "GSRN - RECIPIENT"); // should be 18 digits long
                                            break;
                                        case "9":
                                            // Service Relation Instance Number (SRIN)
                                            parseVariableLength("8019", "SRIN");
                                            break;
                                        default:
                                            throw "23";
                                    }
                                    break;
                                case "2":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Payment Slip Reference Number
                                            parseVariableLength("8020", "REF No");
                                            break;

                                        // 1, 2, 3, 4 and 5 are unused

                                        case "6":
                                            // Identification of pieces of a trade item (ITIP) contained in a logistic unit
                                            parseFixedLength("8026", "ITIP CONTENT", 14 + 2 + 2);
                                            break;
                                        default:
                                            throw "24";
                                    }
                                    break;

                                case "3":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Digital Signature (DigSig)
                                            parseVariableLength("8030", "DIGSIG");
                                            break;
                                    }
                                    break;

                                default:
                                    throw "25";
                            }
                            break;
                        case "1":
                            thirdNumber = codestring.slice(2, 3);
                            fourthNumber = codestring.slice(3, 4);
                            switch (thirdNumber) {
                                case "0":
                                    switch (fourthNumber) {
                                        case "0":
                                            // GS1-128 Coupon Extended Code
                                            parseVariableLength("8100", "-"); //should be 6 digits long
                                            break;
                                        case "1":
                                            // GS1-128 Coupon Extended Code
                                            parseVariableLength("8101", "-"); //should be 10 digits long
                                            break;
                                        case "2":
                                            // GS1-128 Coupon Extended Code
                                            parseVariableLength("8102", "-"); //should be 2 digits long
                                            break;
                                        default:
                                            throw "26";
                                    }
                                    break;
                                case "1":
                                    switch (fourthNumber) {
                                        case "0":
                                            // Coupon Code Identification for Use in North America
                                            parseVariableLength("8110", "-");
                                            break;
                                        default:
                                            throw "27";
                                    }
                                    break;
                                default:
                                    throw "28";
                            }
                            break;
                        case "2":
                            thirdNumber = codestring.slice(2, 3);
                            switch (thirdNumber) {
                                case "0":
                                    // Extended Packaging URL
                                    parseVariableLength("8200", "PRODUCT URL");
                                    break;
                                default:
                                    throw "29";
                            }
                            break;
                        default:
                            throw "30";
                    }
                    break;
                case "9":
                    switch (secondNumber) {
                        case "0":
                            // Information Mutually Agreed Between Trading Partners
                            parseVariableLength("90", "INTERNAL");
                            break;
                        case "1":
                            // Company Internal Information
                            parseVariableLength("91", "INTERNAL");
                            break;
                        case "2":
                            // Company Internal Information
                            parseVariableLength("92", "INTERNAL");
                            break;
                        case "3":
                            // Company Internal Information
                            parseVariableLength("93", "INTERNAL");
                            break;
                        case "4":
                            // Company Internal Information
                            parseVariableLength("94", "INTERNAL");
                            break;
                        case "5":
                            // Company Internal Information
                            parseVariableLength("95", "INTERNAL");
                            break;
                        case "6":
                            // Company Internal Information
                            parseVariableLength("96", "INTERNAL");
                            break;
                        case "7":
                            // Company Internal Information
                            parseVariableLength("97", "INTERNAL");
                            break;
                        case "8":
                            // Company Internal Information
                            parseVariableLength("98", "INTERNAL");
                            break;
                        case "9":
                            // Company Internal Information
                            parseVariableLength("99", "INTERNAL");
                            break;
                        default:
                            throw "31";
                    }
                    break;
                default:
                    throw "32";
            }
            /**
             *
             * ======= END of the big switch =======================
             *
             * now identifyAI has just to return the new
             * ParsedElement (create by one of the parsing
             * functions) and the (cleaned) rest of codestring.
             */

            return ({
                element: elementToReturn,
                codestring: cleanCodestring(codestringToReturn)
            });
        }

        /**
         *
         * =========== END of identifyAI =======================
         *
         */

        /**
         * =========== BEGIN of main routine ===================
         */

        /**
         *
         * ==== First step: ====
         *
         * IF there is any symbology identifier
         *   chop it off;
         *   put as "codeName" into the answer;
         *   fill restOfBarcode with the rest
         *   after the symbology identifier;
         * ELSE
         *   leave "codeName" empty;
         *   put the whole barcode into restOfBarcode;
         */

        switch (symbologyIdentifier) {
            case "]C1":
                answer.codeName = "GS1-128";
                restOfBarcode = barcode.slice(3, barcodelength);
                break;
            case "]e0":
                answer.codeName = "GS1 DataBar";
                restOfBarcode = barcode.slice(3, barcodelength);
                break;
            case "]e1":
                answer.codeName = "GS1 Composite";
                restOfBarcode = barcode.slice(3, barcodelength);
                break;
            case "]e2":
                answer.codeName = "GS1 Composite";
                restOfBarcode = barcode.slice(3, barcodelength);
                break;
            case "]d2":
                answer.codeName = "GS1 DataMatrix";
                restOfBarcode = barcode.slice(3, barcodelength);
                break;
            case "]Q3":
                answer.codeName = "GS1 QR Code";
                restOfBarcode = barcode.slice(3, barcodelength);
                break;
            default:
                answer.codeName = "";
                restOfBarcode = barcode;
                break;
        }

        /**
         * we have chopped off any symbology identifier. Now we can
         * try to parse the rest. It should give us an array of
         * ParsedElements.
         */

        /**
         * ===== Second step: ====
         *
         * Parse "barcode" data element by data element using
         * identifyAI.
         *
         */

        answer.parsedCodeItems = [];

        /**
         * The follwoing part calls "identifyAI" in a loop, until
         * the whole barcode is parsed (or an error occurs).
         *
         * It uses the following strategy:
         *
         *   try to parse the part after the symbology identifier:
         *   - identify the first AI;
         *   - make a parsed element from the part after the AI;
         *   - append the parsed element to answer;
         *   - chop off the parsed part;
         *  do so while there is left something to parse;
         */

        while (restOfBarcode.length > 0) {
            try {
                firstElement = identifyAI(restOfBarcode);
                restOfBarcode = firstElement.codestring;
                answer.parsedCodeItems.push(firstElement.element);
            } catch (e) {
                switch (e) {
                    case "01":
                        throw "invalid AI after '0'";
                    case "02":
                        throw "invalid AI after '1'";
                    case "03":
                        throw "invalid AI after '24'";
                    case "04":
                        throw "invalid AI after '25'";
                    case "05":
                        throw "invalid AI after '2'";
                    case "06":
                        throw "invalid AI after '31'";
                    case "07":
                        throw "invalid AI after '32'";
                    case "08":
                        throw "invalid AI after '33'";
                    case "09":
                        throw "invalid AI after '34'";
                    case "10":
                        throw "invalid AI after '35'";
                    case "11":
                        throw "invalid AI after '36'";
                    case "12":
                        throw "invalid AI after '39'";
                    case "13":
                        throw "invalid AI after '3'";
                    case "14":
                        throw "invalid AI after '40'";
                    case "15":
                        throw "invalid AI after '41'";
                    case "16":
                        throw "invalid AI after '42'";
                    case "17":
                        throw "invalid AI after '4'";
                    case "18":
                        throw "invalid AI after '700'";
                    case "19":
                        throw "invalid AI after '70'";
                    case "20":
                        throw "invalid AI after '71'";
                    case "21":
                        throw "invalid AI after '7'";
                    case "22":
                        throw "invalid AI after '800'";
                    case "23":
                        throw "invalid AI after '801'";
                    case "24":
                        throw "invalid AI after '802'";
                    case "25":
                        throw "invalid AI after '80'";
                    case "26":
                        throw "invalid AI after '810'";
                    case "27":
                        throw "invalid AI after '811'";
                    case "28":
                        throw "invalid AI after '81'";
                    case "29":
                        throw "invalid AI after '82'";
                    case "30":
                        throw "invalid AI after '8'";
                    case "31":
                        throw "invalid AI after '9'";
                    case "32":
                        throw "no valid AI";
                    case "33":
                        throw "invalid year in date";
                    case "34":
                        throw "invalid month in date";
                    case "35":
                        throw "invalid day in date";
                    case "36":
                        throw "invalid number";
                    default:
                        throw "unknown error";
                }
            }
        }
        /**
         * ==== Third and last step: =====
         *
         */
        return answer;
    }
    return parseBarcode;
}());

if (typeof exports === 'object') {
    exports.parseBarcode = parseBarcode;
}