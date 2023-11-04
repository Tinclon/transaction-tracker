"use strict";

import { join } from "path";
import fs_extra from "fs-extra";
import csvtojson from "csvtojson";
const { readdirSync, lstatSync } = fs_extra;

const getFiles = srcpath => readdirSync(srcpath).filter(file => !lstatSync(join(srcpath, file)).isDirectory());

const vendorToCategoryMap = {
    "Arts/Exhibits/Theatre/Museum/Zoo" : { regexes: [/Groupon, Inc./, /PN KOOTENAY WEST GATE NP/] },
    "Allowance"                        : { regexes: [] },
    "Amusement Park"                   : { regexes: [] },
    "Auto Insurance"                   : { regexes: [] },
    "Bank Fees & Charges"              : { regexes: [] },
    "Books & Supplies"                 : { regexes: [] },
    "Clothing"                         : { regexes: [/LEGEND LOGOS/, /MARK'S STORE.*/] },
    "Doctor"                           : { regexes: [/.*KOOTENAY CHIROPRA/] },
    "Electronics & Software"           : { regexes: [/APPLE\.COM\/BILL/, /GOOGLE \*Google Storage/] },
    "Fast Food"                        : { regexes: [/ARBY'S.*/, /MCDONALD'S.*/, /PIZZA PIZZA.*/, /Subway.*/, /TACO TIME CANTINA.*/, /WENDYS.*/] },
    "Fitness & Gym"                    : { regexes: [/ARQ MOUNTAIN CENTRE/] },
    "Gas & Fuel"                       : { regexes: [/CBSA\/ASFC RYKERTS/, /CHV40149 CRANBROOK CHE/, /.*ESSO.*/, /MOBIL@.*/, /PETRO CANADA.*/] },
    "Groceries"                        : { regexes: [/7-ELEVEN.*/, /PAUL'S SUPERETTE/, /PEALOW'S YOUR INDEPEND.*/, /REAL CDN SUPERSTORE.*/, /SAVE ON FOODS.*/, /SQ \*MAX'S PLACE/, /WLOKA FARMS FRUIT STAND.*/] },
    "Hobbies"                          : { regexes: [] },
    "Home"                             : { regexes: [/.*HOME HARDWARE.*/] },
    "Home Insurance"                   : { regexes: [] },
    "Horse"                            : { regexes: [] },
    "Hotel"                            : { regexes: [] },
    "Internet"                         : { regexes: [] },
    "Media & Entertainment"            : { regexes: [/NETFLIX\.COM/] },
    "Mobile Phone"                     : { regexes: [/TELUS PRE-AUTH PAYMENT/, /VIRGIN PLUS/] },
    "Mortgage & Rent"                  : { regexes: [] },
    "Office Supplies"                  : { regexes: [/CRESTON CARD & STATION/, /STAPLES STORE.*/] },
    "Pets"                             : { regexes: [] },
    "Pharmacy"                         : { regexes: [] },
    "Postage & Shipping"               : { regexes: [/JAKES LANDING LLC/] },
    "Restaurants"                      : { regexes: [/ROCKY RIVER GRILL/] },
    "Service & Parts"                  : { regexes: [/NAPA ASSOCIATE.*/] },
    "Shopping"                         : { regexes: [/Amazon\.ca.*/, /AMZN Mktp.*/, /DOLLAR TREE.*/, /MORRIS FLOWERS/, /SP FUTUREMOTIONINC/, /WISH\.COM/, /.*MODERN ALCHEMY.*/] },
    "Transfer"                         : { regexes: [/PREAUTHORIZED PAYMENT/] },
    "Tuition"                          : { regexes: [] },
    "Utilities"                        : { regexes: [] },
};

(() => {
    const categoryToAmountMap = {};
    const uncategorizedVendors = [];

    // Read in the current statements
    const files = getFiles("./statements").sort();

    files.forEach(file => {
        csvtojson({noheader: true, headers: ["date", "description", "debit", "credit", "balance"]})
            .fromFile(`./statements/${file}`)
            .then(json => {
                // Classify them
                json.forEach(transaction => {
                    const date = transaction.date.split("/");
                    const yearMonth = [date[2],date[0]].join("-");
                    const category = Object.keys(vendorToCategoryMap).find(category => {
                        return vendorToCategoryMap[category].regexes.some(regex => regex.test(transaction.description));
                    }) || "Uncategorized";
                    const amount = parseFloat(transaction.debit || `-${transaction.credit}`);

                    if (category === "Uncategorized") {
                        uncategorizedVendors.push(`${transaction.date} - ${amount} - ${transaction.description}`);
                    }

                    categoryToAmountMap[yearMonth] = categoryToAmountMap[yearMonth] || {};
                    categoryToAmountMap[yearMonth][category] = Math.round((categoryToAmountMap[yearMonth][category] || 0) + amount * 100) / 100;
                });

                // Output the totals
                console.error(categoryToAmountMap);
                console.error(uncategorizedVendors);
            });
    })
})();
