"use strict";

import chalk from 'chalk';
import { join } from "path";
import fs_extra from "fs-extra";
import csvtojson from "csvtojson";
const { readdirSync, lstatSync } = fs_extra;

const getFiles = srcpath => readdirSync(srcpath).filter(file => !lstatSync(join(srcpath, file)).isDirectory());

const vendorToCategoryMap = {
    "Airfare"                          : { r: [/AIR TRANSAT.*/] },
    "Arts/Exhibits/Theatre/Museum/Zoo" : { r: [/DEVILS TOWER.*/, /.*CODY CAVE TOURS/, /CRAZY HORSE.*/, /Groupon, Inc./, /NIAGARA PARKS COMMISSION/, /PN KOOTENAY WEST GATE NP/, /TIVOLI THEATRE/] },
    "Allowance"                        : { r: [/.*TFR-TO [ALST]N(SAV|SPD|TTH)/] },
    "Amusement Park"                   : { r: [] },
    "Auto Insurance"                   : { r: [/ICBC.*INS/] },
    "Bank Fees & Charges"              : { r: [/SEND E-TFR FEE/] },
    "Books & Supplies"                 : { r: [] },
    "Clothing"                         : { r: [/Decathlon Canada.*/, /LEGEND LOGOS/, /MARK'S STORE.*/, /TARGET.*/] },
    "Doctor/Dentist/Chiro/Optometrist" : { r: [/.*KOOTENAY CHIROPRA/, /NISH DENTAL CLINIC/, /SUN LIFE.*/] },
    "Electronics & Software"           : { r: [/Amazon Downloads.*/, /APPLE\.COM\/BILL/, /GOOGLE \*Google Storage/] },
    "Fast Food"                        : { r: [/A&W.*/, /ARBY'S.*/, /BOOSTER JUICE.*/, /DAIRY QUEEN.*/, /HARVEYS.*/, /MCDONALD'S.*/, /KFC/, /PANAGO.*/, /PIZZA PIZZA.*/, /.*STONE COLD ICE CREAM.*/, /Subway.*/, /TACO TIME CANTINA.*/, /TIM HORTON'?S.*/, /.*WAREHOUSE PIZZA/, /WENDY'?S.*/] },
    "Fitness & Gym / Pool"             : { r: [/AINSWORTH HOT SPRINGS.*/, /ARQ MOUNTAIN CENTRE/] },
    "Gas & Fuel"                       : { r: [/CBSA\/ASFC RYKERTS/, /CHEVRON.*/, /CHV40149 CRANBROOK CHE/, /CONOCO.*/, /.*ESSO.*/, /EXXON.*/, /HUSKY.*/, /MOBIL@.*/, /PETRO.?CAN.*/, /SHELL.*/] },
    "Groceries"                        : { r: [/7[- ]ELEVEN.*/, /.*MARAR ORCHARD.*/, /.*MAX'S PLACE/, /PAUL'S SUPERETTE/, /PEALOW'S YOUR INDEPEND.*/, /REAL (CDN|CANADIAN) SUPER.*/, /SAFEWAY.*/, /SAVE ON FOODS.*/, /WLOKA FARMS FRUIT STAND.*/, /WYNNDEL FOODS/] },
    "Hobbies"                          : { r: [] },
    "Home"                             : { r: [/CDN TIRE STORE.*/, /.*HOME HARDWARE.*/] },
    "Home Insurance"                   : { r: [/TD Ins\/TD Assur.*INS/] },
    "Horse"                            : { r: [/TANGLEFOOT VETERINARY.*/] },
    "Hotel"                            : { r: [/BAYMONT INN.*/, /COUNTRY INN & SUITES.*/, /FAIRBRIDGE INN & SUITES.*/, /HOLIDAY INN EXPRESS.*/, /RAMADA/, /SOUTHBRIDGE HOTEL.*/, /WESTWOOD INN & SUITES/] },
    "Income - Primary"                 : { r: [/INTUIT CANADA U.*PAY/] },
    "Income - Secondary"               : { r: [/KTUNAXA KINBASK.*PAY/] },
    "Internet"                         : { r: [/INTUIT CANADA.*AP/, /TELUS PRE-AUTH PAYMENT/] },
    "Media & Entertainment"            : { r: [/NETFLIX\.COM/] },
    "Mobile Phone"                     : { r: [/BELL MOBILITY.*/, /VIRGIN PLUS/] },
    "Mortgage & Rent"                  : { r: [/INTEREST/, /LN PYMT.*[0-9]{9}/, /TFR-FR [0-9]{7}/] },
    "Office Supplies"                  : { r: [/CRESTON CARD & STATION/, /STAPLES STORE.*/] },
    "Pets"                             : { r: [/HOUND N MOUSER.*/, /.*PET ADOPTION.*/, /PETLAND.*/, /PETSMART.*/] },
    "Parking"                          : { r: [/CALGARY AIRPORT EXIT TOLL/] },
    "Pharmacy"                         : { r: [/SHOPPERS DRUG MART.*/] },
    "Postage & Shipping"               : { r: [/CPC \/ SCP.*/, /JAKES LANDING LLC/] },
    "Registration & Licensing"         : { r: [/ICBC.*/] },
    "Restaurants"                      : { r: [/APPLEBEES.*/, /BOSTON PIZZA.*/, /DENNY'S.*/, /MARLINS FAMILY RESTAUR/, /OLIVE GARD.*/, /ROCKY RIVER GRILL/, /SWISS CHALET.*/] },
    "Service & Parts"                  : { r: [/HIGH CALIBER AUTO COLL.*/, /INTEGRA TIRE/, /LORDCO PARTS.*/, /NAPA ASSOCIATE.*/] },
    "Shopping"                         : { r: [/Amazon\.ca.*/, /AMZN Mktp.*/, /CRICUT/, /DOLLAR TREE.*/, /ETSY/, /MORRIS FLOWERS/, /SP FUTUREMOTIONINC/, /WISH\.COM/, /.*MODERN ALCHEMY.*/, /WAL-MART.*/, /YOUR DOLLAR STORE.*/] },
    "Transfer"                         : { r: [/.*CASH WITHDRA.*/, /PREAUTHORIZED PAYMENT/, /REWARDS REDEMPTION/, /TD VISA PREAUTH PYMT/] },
    "Tuition"                          : { r: [/IXL FAMILY SUB.*/] },
    "Utilities"                        : { r: [/(Fortis|FORTIS)BC.*/] },
};

(() => {
    const categoryToAmountMap = {};

    // Read in the current statements
    const files = getFiles("./statements");
    var parsedFiles = 0;

    // Output helpers
    const cp = c => c === "Uncategorized" ? chalk.red(c) : chalk.blue(c);
    const dp = d => chalk.yellow(d);
    const np = n => n < 0 ? chalk.red(ra(nlp(n), 12)) : chalk.green(ra(nlp(n), 12));
    const nlp = n => n.toLocaleString('en-CA', {minimumFractionDigits:2, maximumFractionDigits:2});
    const ra = (text, width) => " ".repeat(width - text.length) + text
    const output = () => {
        Object.keys(categoryToAmountMap).sort().forEach(yearMonth => {
            console.error(chalk.bold(`${dp(yearMonth)}`));
            Object.keys(categoryToAmountMap[yearMonth]).sort().forEach(category => {
                console.error(chalk.bold(`${np(categoryToAmountMap[yearMonth][category].a)} ${cp(category)}`));
                categoryToAmountMap[yearMonth][category].t.sort().forEach(transaction => {
                    console.error(`\t\t${transaction}`);
                });
            });
        });
    }

    // Parse and classify
    files.forEach((file, i) => {
        csvtojson({noheader: true, headers: ["date", "description", "debit", "credit", "balance"]})
            .fromFile(`./statements/${file}`)
            .then(json => {
                json.forEach(transaction => {
                    const date = transaction.date.split("/");
                    const isoDate = [date[2], date[0], date[1]].join("-");
                    const yearMonth = [date[2], date[0]].join("-");
                    const category = Object.keys(vendorToCategoryMap).find(category => {
                        return vendorToCategoryMap[category].r.some(regex => regex.test(transaction.description));
                    }) || "Uncategorized";
                    const amount = parseFloat(transaction.debit || `-${transaction.credit}`);

                    categoryToAmountMap[yearMonth] = categoryToAmountMap[yearMonth] || {};
                    categoryToAmountMap[yearMonth][category] = categoryToAmountMap[yearMonth][category] || {};
                    categoryToAmountMap[yearMonth][category].a = categoryToAmountMap[yearMonth][category].a || 0;
                    categoryToAmountMap[yearMonth][category].a += amount;
                    categoryToAmountMap[yearMonth][category].a = Math.round(categoryToAmountMap[yearMonth][category].a * 100) / 100;

                    categoryToAmountMap[yearMonth][category].t = categoryToAmountMap[yearMonth][category].t || [];
                    categoryToAmountMap[yearMonth][category].t.push(`${dp(isoDate)}${np(amount)}\t${transaction.description}`);
                });

                ++parsedFiles === files.length && output();
            });
    });
})();
